import os
import base64
import json

from langchain.tools import tool
from typing import Optional, Dict
from google import genai
from google.genai.types import GenerateContentConfig, Content, Part
from dotenv import load_dotenv
from .supabaseClient import supabase

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

        combined_prompt = f"{SYSTEM_PROMPT.strip()}\n\nGenerate an image for: {description.strip()}"
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[Content(role="user", parts=[Part(text=combined_prompt)])],
            config=GenerateContentConfig(response_modalities=['TEXT', 'IMAGE'])
        )

        if not response or not response.candidates:
            return "Error: No response received from Gemini."

        candidate = response.candidates[0]
        if not candidate.content or not candidate.content.parts:
            return "Error: No content parts in the response."

        image_part = None
        for part in candidate.content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                image_part = part
                break

        if not image_part:
            return "Error: No image data found in the response."

        encoded = base64.b64encode(image_part.inline_data.data).decode("utf-8")
        
        return encoded
    
    except Exception as e:
        return f"Error generating image: {str(e)}"

# Helper functions  
def parse_quiz_json(json_string: str) -> Optional[Dict]:
    """Parse and validate quiz JSON string"""
    try:
        json_string = json_string.strip()
        quiz_data = json.loads(json_string)
        
        if is_valid_quiz_json(quiz_data):
            return quiz_data
        return None
    except json.JSONDecodeError:
        return None
    

def is_valid_quiz_json(data: Dict) -> bool:
    """Validate quiz JSON structure"""
    try:
        required_fields = ['quizTitle', 'totalQuestions', 'questions']
        if not all(field in data for field in required_fields):
            return False
        
        if not isinstance(data['questions'], list) or len(data['questions']) == 0:
            return False
        
        first_question = data['questions'][0]
        question_fields = ['questionNumber', 'question', 'options', 'correctOption', 'explanation']
        if not all(field in first_question for field in question_fields):
            return False
        
        return True
    except:
        return False


@tool
def generate_quiz(content: str) -> Dict:
    """
    Generate and validate quiz JSON from content string.

    Args:
        content: JSON string containing quiz data in the format:
        {
            "content": "Any additional text, encouragement, or instructions you want to include",
            "quizTitle": "descriptive title for the quiz",
            "totalQuestions": 2,
            "questions": [
                {
                    "questionNumber": 1,
                    "question": "the question text",
                    "options": ["option A", "option B", "option C", "option D"],
                    "correctOption": "2",
                    "explanation": "detailed explanation of why this is correct and why other options are wrong",
                    "multipleCorrectAnswers": false
                },
                {
                    "questionNumber": 2,
                    "question": "another question",
                    "options": ["option A", "option B", "option C"],
                    "correctOption": "1,3",
                    "explanation": "explanation for multiple correct answers",
                    "multipleCorrectAnswers": true
                }
            ]
        }
            
    Returns:
        Dict: Validated quiz data or error message
    """
    try:
        quiz_data = parse_quiz_json(content)
        if quiz_data:
            return quiz_data
        else:
            return {"error": "Invalid quiz JSON structure"}
    except Exception as e:
        return {"error": f"Error processing quiz: {str(e)}"}

# here the user_id is kept optional so model doesn't keep looking for it.
@tool
def save_notes(data: str, user_id: str) -> str:
    '''
        Args:
            content: JSON string containing notes in the format.
            {  
                "title": "title of the document",
                "content" : "Complete notes in markdown format"
            }
            user_id: User id
        Returns: 
            str: Success message or Error message
    '''
    try:
        note_data = json.loads(data)
        title = note_data.get("title")
        content = note_data.get("content")
        
        # Validating the input
        if not title or not content:
            return "Error: 'title' and 'content' fields are required in the data."

        user_check = supabase.table("Notes").select("notes").eq("user_id", user_id).execute()

        if not user_check.data:
            supabase.table("Notes").insert({
                "user_id": user_id,
                "notes": [note_data]
            }).execute()
        else:
            existing_notes = user_check.data[0].get("notes", [])
            updated_notes = existing_notes + [note_data]

            supabase.table("Notes").update({
                "notes": updated_notes
            }).eq("user_id", user_id).execute()

        return "Note successfully saved to the database."

    except Exception as e:
        return f"Unexpected error: {str(e)}"