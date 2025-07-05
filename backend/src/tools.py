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
        A base64-encoded image string in the format [IMAGE:base64string].
    """
    if not description or not description.strip():
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
            return "Error: Missing GOOGLE_API_KEY in environment."

        client = genai.Client(api_key=api_key)

        # SOLUTION 1: Use a single combined prompt instead of multiple contents
        # This prevents LangChain from adding empty parts
        combined_prompt = f"{SYSTEM_PROMPT.strip()}\n\nGenerate an image for: {description.strip()}"
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[Content(role="user", parts=[Part(text=combined_prompt)])],
            config=GenerateContentConfig(response_modalities=['TEXT', 'IMAGE'])
        )

        # Check if response exists and has candidates
        if not response or not response.candidates:
            return "Error: No response received from Gemini."

        candidate = response.candidates[0]
        if not candidate.content or not candidate.content.parts:
            return "Error: No content parts in the response."

        # Find the image part
        image_part = None
        for part in candidate.content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                image_part = part
                break

        if not image_part:
            return "Error: No image data found in the response."

        # Encode the image
        encoded = base64.b64encode(image_part.inline_data.data).decode("utf-8")
        
        # Return in the expected format that your client.py expects
        return f"[IMAGE:{encoded}]"
    
    except Exception as e:
        return f"Error generating image: {str(e)}"