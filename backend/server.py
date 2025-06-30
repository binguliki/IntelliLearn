from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from src.client import chat_with_memory

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
