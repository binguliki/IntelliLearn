import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from src.client import chat_with_memory
from src.speech_to_text import get_speech_processor

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading models...")
get_speech_processor()
print("Models loaded successfully!")

@app.get("/ready")
async def ready_check():
    return {"status": "ready"}

@app.post("/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    message = data.get("message")
    image_base64 = data.get("image_base64", None)
    session_id = data.get("session_id")

    if not message or not session_id:
        return {"error": "Message and session_id required"}
    
    content = {"text": message}
    if image_base64:
        content["image_base64"] = image_base64
    response = await chat_with_memory(content, session_id)
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
