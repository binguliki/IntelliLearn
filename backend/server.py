from dotenv import load_dotenv
from fastapi import FastAPI, Request, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from src.auth import get_current_user
from src.session_manager import session_manager
from src.speech_to_text import get_speech_processor, is_speech_model_ready

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
# Reset — clears only the calling user's session
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

    response = await agent.process_query(content, user_id=user_id, jwt=jwt)
    return response


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
