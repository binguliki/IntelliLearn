import os
import base64
import json

from langchain.tools import tool
from typing import Optional, Dict
from google import genai
from google.genai.types import GenerateContentConfig, Content, Part
from dotenv import load_dotenv

from .supabaseClient import get_user_client
from .prompts import load_prompt

load_dotenv()

# Loaded once at import time — no runtime file I/O per request.
_IMAGE_GEN_SYSTEM_PROMPT = load_prompt("image_generation_system_prompt")

# Image generation model — override via IMAGE_GEN_MODEL env var.
_IMAGE_GEN_MODEL = os.getenv("IMAGE_GEN_MODEL", "gemini-2.0-flash-preview-image-generation")


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

    try:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return "Error: Missing GOOGLE_API_KEY in environment."

        client = genai.Client(api_key=api_key)

        combined_prompt = (
            f"{_IMAGE_GEN_SYSTEM_PROMPT.strip()}\n\n"
            f"Generate an image for: {description.strip()}"
        )

        response = client.models.generate_content(
            model=_IMAGE_GEN_MODEL,
            contents=[Content(role="user", parts=[Part(text=combined_prompt)])],
            config=GenerateContentConfig(response_modalities=["TEXT", "IMAGE"]),
        )

        if not response or not response.candidates:
            return "Error: No response received from the image generation model."

        candidate = response.candidates[0]
        if not candidate.content or not candidate.content.parts:
            return "Error: No content parts in the response."

        image_part = None
        for part in candidate.content.parts:
            if hasattr(part, "inline_data") and part.inline_data:
                image_part = part
                break

        if not image_part:
            return "Error: No image data found in the response."

        encoded = base64.b64encode(image_part.inline_data.data).decode("utf-8")
        return encoded

    except Exception as e:
        return f"Error generating image: {str(e)}"


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def parse_quiz_json(json_string: str) -> Optional[Dict]:
    """Parse and validate quiz JSON string."""
    try:
        json_string = json_string.strip()
        quiz_data = json.loads(json_string)

        if is_valid_quiz_json(quiz_data):
            return quiz_data
        return None
    except json.JSONDecodeError:
        return None


def is_valid_quiz_json(data: Dict) -> bool:
    """Validate quiz JSON structure."""
    try:
        required_fields = ["quizTitle", "totalQuestions", "questions"]
        if not all(field in data for field in required_fields):
            return False

        if not isinstance(data["questions"], list) or len(data["questions"]) == 0:
            return False

        first_question = data["questions"][0]
        question_fields = ["questionNumber", "question", "options", "correctOption", "explanation"]
        if not all(field in first_question for field in question_fields):
            return False

        return True
    except Exception:
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


def make_save_notes_tool(jwt: str):
    """
    Factory that returns a `save_notes` tool bound to the calling user's JWT.

    Using a JWT-scoped Supabase client means RLS policies are enforced —
    the tool can only write to the row that belongs to the authenticated user,
    even if the application passes a wrong user_id by mistake.

    Args:
        jwt: The user's Supabase access token.

    Returns:
        A LangChain tool that saves notes for that specific user.
    """
    user_client = get_user_client(jwt)

    @tool
    def save_notes(data: str, user_id: str) -> str:
        """
        Save notes to the database for the authenticated user.

        Args:
            data: JSON string in the format:
                {
                    "title": "title of the document",
                    "content": "Complete notes in markdown format"
                }
            user_id: The authenticated user's ID (resolved server-side from JWT).

        Returns:
            str: Success message or error message.
        """
        try:
            note_data = json.loads(data)
            title = note_data.get("title")
            content = note_data.get("content")

            if not title or not content:
                return "Error: 'title' and 'content' fields are required in the data."

            # All queries go through the JWT-scoped client — RLS enforced.
            user_check = (
                user_client.table("Notes")
                .select("notes")
                .eq("user_id", user_id)
                .execute()
            )

            if not user_check.data:
                user_client.table("Notes").insert({
                    "user_id": user_id,
                    "notes": [note_data],
                }).execute()
            else:
                existing_notes = user_check.data[0].get("notes", [])
                updated_notes = existing_notes + [note_data]

                user_client.table("Notes").update({
                    "notes": updated_notes,
                }).eq("user_id", user_id).execute()

            return "Notes successfully saved to the database."

        except Exception as e:
            return f"Error: {str(e)}"

    return save_notes