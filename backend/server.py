from dotenv import load_dotenv
from fastapi import FastAPI, Request, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from src.auth import get_current_user
from src.session_manager import session_manager
from src.speech_to_text import get_speech_processor, is_speech_model_ready
from src.rag.rag_pipeline import rag_pipeline
from src.rag.pdf_processor import PDFValidationError

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    speech_processor = get_speech_processor()
    speech_processor.load_model_async()
    yield
    del speech_processor


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health check — no auth required
# ---------------------------------------------------------------------------

@app.get("/ready")
async def ready_check():
    return {"status": "ready", "speech_model_ready": is_speech_model_ready()}


# ---------------------------------------------------------------------------
# Reset — clears only the calling user's session (and their RAG data)
# ---------------------------------------------------------------------------

@app.post("/reset")
async def reset_endpoint(user_id: str = Depends(get_current_user)):
    session_manager.reset_session(user_id)
    return JSONResponse({"status": "reset"})


# ---------------------------------------------------------------------------
# Chat — main endpoint, fully authenticated and per-user
# ---------------------------------------------------------------------------

@app.post("/chat")
async def chat_endpoint(
    request: Request,
    user_id: str = Depends(get_current_user),
):
    # Extract the raw JWT to pass to tools that write to Supabase.
    auth_header = request.headers.get("Authorization", "")
    jwt = auth_header.removeprefix("Bearer ").strip()

    data = await request.json()
    message = data.get("message")
    image_base64 = data.get("image_base64", None)
    quiz_report = data.get("quizReport")
    chat_history = data.get("chat_history")
    use_rag = data.get("use_rag", False)

    # Fetch (or create) this user's isolated agent session.
    agent = session_manager.get_or_create_session(user_id)

    # If the frontend is sending prior chat history (e.g. on page reload),
    # rebuild the agent's memory from it so context is preserved.
    if chat_history:
        agent.memory = agent.memory.__class__(
            memory_key="chat_history", return_messages=True
        )
        agent.memory.chat_memory.messages.clear()

        # Re-add system prompt at the top of rebuilt history.
        from src.client import _SYSTEM_PROMPT
        agent.memory.chat_memory.add_message(SystemMessage(content=_SYSTEM_PROMPT))

        for msg in chat_history:
            if msg.get("sender") == "user":
                agent.memory.chat_memory.add_message(HumanMessage(content=msg.get("text", "")))
            elif msg.get("sender") == "bot":
                agent.memory.chat_memory.add_message(AIMessage(content=msg.get("text", "")))

    if quiz_report:
        response = await agent.process_query({"quizReport": quiz_report}, user_id=user_id, jwt=jwt)
        return response

    if not message:
        return {"error": "Message required"}

    content = {"text": message}
    if image_base64:
        content["image_base64"] = image_base64

    # If the /uploads prefix was used, retrieve relevant document context
    # and prepend it to the user's message before invoking the agent.
    if use_rag:
        if rag_pipeline.get_pdf_count(user_id) == 0:
            return {
                "text": (
                    "You haven't uploaded any PDF documents yet. "
                    "Use the PDF upload button to add documents, then ask your question with the `/uploads` prefix."
                ),
                "image": "",
                "quiz": None,
            }

        try:
            context = await rag_pipeline.retrieve_context(user_id, message)
        except Exception as e:
            print(f"[/chat] RAG retrieval error for user {user_id}: {e}")
            return {
                "text": (
                    "Sorry, I ran into a problem searching your documents. "
                    "This is usually a temporary issue — please try again in a moment."
                ),
                "image": "",
                "quiz": None,
            }

        if context is None:
            return {
                "text": (
                    "I couldn't find relevant information in your uploaded documents for that question. "
                    "Try rephrasing, or ask without the `/uploads` prefix for a general answer."
                ),
                "image": "",
                "quiz": None,
            }

        # Prepend the retrieved context to the user's message text.
        content["text"] = context + message

    response = await agent.process_query(content, user_id=user_id, jwt=jwt)
    return response


# ---------------------------------------------------------------------------
# Upload PDF — ingest a PDF into the user's RAG vector store
# ---------------------------------------------------------------------------

@app.post("/upload-pdf")
async def upload_pdf_endpoint(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """
    Accept a PDF file upload, validate it, extract text, chunk it, embed it,
    and store the embeddings in the user's ChromaDB collection.

    Limits (configurable via env vars):
        MAX_PDF_COUNT   - max PDFs per session (default: 2)
        MAX_PDF_SIZE_MB - max file size in MB (default: 10)
    """
    # Validate MIME type early before reading the full file.
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted. Please upload a .pdf file.",
        )

    pdf_bytes = await file.read()

    try:
        result = await rag_pipeline.ingest_pdf(
            user_id=user_id,
            pdf_bytes=pdf_bytes,
            filename=file.filename or "document.pdf",
        )
    except PDFValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[upload-pdf] Unexpected error for user {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process PDF: {str(e)}",
        )

    return JSONResponse({
        "status": "ingested",
        "filename": result["filename"],
        "chunks": result["chunks"],
        "pdf_count": result["pdf_count"],
    })


# ---------------------------------------------------------------------------
# Uploaded PDFs — list documents currently indexed for the session
# ---------------------------------------------------------------------------

@app.get("/uploaded-pdfs")
async def uploaded_pdfs_endpoint(user_id: str = Depends(get_current_user)):
    """Return metadata for all PDFs currently indexed in the user's session."""
    pdfs = rag_pipeline.get_pdf_list(user_id)
    return JSONResponse({
        "pdfs": pdfs,
        "count": len(pdfs),
    })


# ---------------------------------------------------------------------------
# Transcribe — no user-level state needed, but still requires valid auth
# ---------------------------------------------------------------------------

@app.post("/transcribe")
async def transcribe_endpoint(
    audio_file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),  # Enforces auth even for STT
):
    try:
        if not audio_file:
            raise HTTPException(status_code=400, detail="Audio file required")

        if not audio_file.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="File must be an audio file")

        if not is_speech_model_ready():
            raise HTTPException(
                status_code=503,
                detail="Speech-to-text model is still loading. Please try again soon.",
            )

        audio_content = await audio_file.read()

        speech_processor = get_speech_processor()
        transcription = speech_processor.transcribe_audio_bytes(audio_content)

        return {"text": transcription, "success": True}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
