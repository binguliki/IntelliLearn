from langchain.tools import tool
from google import genai
from google.genai.types import GenerateContentConfig, Content, Part
from dotenv import load_dotenv
import base64
import os

load_dotenv()

@tool
def generate_image(description: str) -> str:
    """
    Generate an image based on a detailed text description using Gemini.

    Args:
        description: Description of the image to generate.

    Returns:
        A base64-encoded image string.
    """
    if not description.strip():
        return "Error: Description must not be empty."

    MODEL_NAME = "gemini-2.0-flash-preview-image-generation"
    SYSTEM_PROMPT = """
        You are a skilled visual artist who collaborates with another AI agent responsible for providing image descriptions. 
        Your task is to interpret these descriptions creatively and accurately to generate high-quality images. 
        Ensure that each image aligns with the given context, includes appropriate visual elements, and is clearly labeled or annotated when necessary. 
        Pay close attention to composition, color, style, and detail to bring the description to life while maintaining artistic consistency and clarity.
    """

    try:
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            return "Error: Missing GEMINI_API_KEY in environment."

        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[
                Content(role="user", parts=[Part(text=SYSTEM_PROMPT)]),
                Content(role="user", parts=[Part(text=description)])
            ],
            config=GenerateContentConfig(response_modalities=['TEXT', 'IMAGE'])
        )

        image_part = next(
            (part for part in response.candidates[0].content.parts if part.inline_data), 
            None
        )

        if not image_part:
            return "Error: No image data found in the response."

        encoded = base64.b64encode(image_part.inline_data.data).decode("utf-8")
        response = {"image_base64": encoded}
        return response
    
    except Exception as e:
        return f"Error generating image: {str(e)}"