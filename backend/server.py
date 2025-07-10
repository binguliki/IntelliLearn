from dotenv import load_dotenv
from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from src.client import Agent
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

agent = Agent()

@app.post("/reset")
async def reset_endpoint(request: Request):
    data = await request.json()
    # For now, just re-instantiate the global agent (stateless, single user)
    global agent
    agent = Agent()
    return JSONResponse({"status": "reset"})

@app.get("/ready")
async def ready_check():
    return {"status": "ready", "speech_model_ready": is_speech_model_ready()}

@app.post("/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    message = data.get("message")
    image_base64 = data.get("image_base64", None)
    session_id = data.get("session_id")
    quiz_report = data.get("quizReport")
    chat_history = data.get("chat_history")

    if chat_history:
        # Re-initialize agent's memory with chat history
        agent.memory = agent.memory.__class__(memory_key="chat_history", return_messages=True)
        agent.memory.chat_memory.messages.clear()
        from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
        agent.memory.chat_memory.add_message(SystemMessage(content=agent.SYSTEM_PROMPT if hasattr(agent, 'SYSTEM_PROMPT') else ""))
        for msg in chat_history:
            if msg.get('sender') == 'user':
                agent.memory.chat_memory.add_message(HumanMessage(content=msg.get('text', '')))
            elif msg.get('sender') == 'bot':
                agent.memory.chat_memory.add_message(AIMessage(content=msg.get('text', '')))

    if quiz_report:
        response = await agent.process_query({"quizReport": quiz_report})
        return response

    if not message or not session_id:
        return {"error": "Message and session_id required"}
    
    content = {"text": message}
    if image_base64:
        content["image_base64"] = image_base64
    response = await agent.process_query(content)
    return response

@app.post("/transcribe")
async def transcribe_endpoint(
    audio_file: UploadFile = File(...),
    session_id: str = Form(...)
):
    try:
        if not audio_file:
            return {"error": "Audio file required"}
        
        if not audio_file.content_type.startswith('audio/'):
            return {"error": "File must be an audio file"}
        
        if not is_speech_model_ready():
            return {
                "error": "Speech-to-text model is still loading. Please try again soon.",
                "success": False
            }
        
        audio_content = await audio_file.read()
        
        speech_processor = get_speech_processor()
        transcription = speech_processor.transcribe_audio_bytes(audio_content)
        
        return {
            "text": transcription,
            "session_id": session_id,
            "success": True
        }
        
    except Exception as e:
        print(f"Transcription error: {e}")
        return {
            "error": f"Transcription failed: {str(e)}",
            "success": False
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
