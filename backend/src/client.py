from typing import Union
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage, SystemMessage
from langchain.memory import ConversationBufferMemory

from .prompts import load_prompt
from .providers.factory import get_model_provider
from .tools import generate_image, generate_quiz, make_save_notes_tool

load_dotenv()

# Loaded once at module import — not on every Agent instantiation.
_SYSTEM_PROMPT = load_prompt("agent_system_prompt")


class Agent:
    """
    Stateful conversational agent for a single user session.

    Each authenticated user gets their own Agent instance (managed by
    SessionManager) so chat histories are fully isolated.

    The LLM backend is resolved via the strategy pattern (get_model_provider),
    making it swappable without touching this class.
    """

    def __init__(self):
        # Resolve the model provider from env — swappable without code changes.
        provider = get_model_provider()

        # Base tools that don't need per-request context.
        # save_notes is created per-request via make_save_notes_tool(jwt).
        self._base_tools = [generate_image, generate_quiz]

        # LLM with base tools pre-bound; save_notes is injected at query time.
        self.llm = provider.get_llm(self._base_tools)

        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
        )
        self.memory.chat_memory.add_message(SystemMessage(content=_SYSTEM_PROMPT))

    def _get_llm_with_save_notes(self, jwt: str):
        """Return an LLM instance that has save_notes bound with the user's JWT."""
        provider = get_model_provider()
        save_notes_tool = make_save_notes_tool(jwt)
        return provider.get_llm(self._base_tools + [save_notes_tool])

    def format_quiz_report_summary(self, quiz_report: list) -> str:
        """Format quiz results into a structured summary for the LLM."""
        total_questions = len(quiz_report)
        correct_answers = sum(1 for ans in quiz_report if ans["isCorrect"])
        score_percentage = (
            (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        )

        summary = "Quiz Results Summary:\n"
        summary += f"Score: {correct_answers}/{total_questions} ({score_percentage:.1f}%)\n\n"
        summary += "Detailed Results:\n"

        for ans in quiz_report:
            status = "✓ Correct" if ans["isCorrect"] else "✗ Incorrect"
            summary += f"Q{ans['questionNumber']}: {status}\n"
            summary += f"  User Answer: {ans['userAnswer']}\n"
            summary += f"  Correct Answer: {ans['correctAnswer']}\n"
            if not ans["isCorrect"]:
                summary += f"  Explanation: {ans.get('explanation', 'No explanation provided')}\n"
            summary += "\n"

        summary += "Please provide feedback on the student's performance and suggest areas for improvement."
        return summary

    async def process_query(self, user_input: Union[str, dict], user_id: str, jwt: str) -> dict:
        """
        Process a user query and return the agent's response.

        Args:
            user_input: Either a plain string or a dict with keys:
                        'text', 'image_base64', 'quizReport'.
            user_id:    The authenticated user's UUID (from JWT, not from request body).
            jwt:        The user's Supabase access token, used to scope DB writes.

        Returns:
            dict with keys: 'text', 'image', 'quiz'.
        """
        text = ""
        image_b64 = None
        quiz_report = None

        if isinstance(user_input, dict):
            text = user_input.get("text", "").strip()
            image_b64 = user_input.get("image_base64")
            quiz_report = user_input.get("quizReport")
        else:
            text = str(user_input).strip()

        # ------------------------------------------------------------------ #
        # Quiz report path — no tool calls needed, just LLM feedback.        #
        # ------------------------------------------------------------------ #
        if quiz_report:
            try:
                quiz_summary = self.format_quiz_report_summary(quiz_report)
                messages = self.memory.chat_memory.messages.copy()
                messages.append(HumanMessage(content=quiz_summary))

                response = await self.llm.ainvoke(messages)
                explanation = response.content

                self.memory.chat_memory.add_user_message(quiz_summary)
                self.memory.chat_memory.add_ai_message(explanation)

                return {"text": explanation, "image": "", "quiz": None}

            except Exception as e:
                return {"text": f"Error processing quiz results: {str(e)}", "image": "", "quiz": None}

        if not text:
            return {
                "text": "Please provide a question or topic you'd like to learn about.",
                "image": "",
                "quiz": None,
            }

        # ------------------------------------------------------------------ #
        # Normal chat path — uses JWT-bound LLM so save_notes is authorised. #
        # ------------------------------------------------------------------ #
        try:
            # Bind save_notes with the user's JWT for this request.
            llm = self._get_llm_with_save_notes(jwt)

            messages = self.memory.chat_memory.messages.copy()

            if image_b64:
                content = [
                    {"type": "text", "text": text},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}},
                ]
            else:
                content = text

            messages.append(HumanMessage(content=content))

            response = await llm.ainvoke(messages)
            explanation = response.content

            generated_image = ""
            quiz_data = None
            tool_error = None

            if hasattr(response, "tool_calls") and response.tool_calls:
                save_notes_tool = make_save_notes_tool(jwt)

                for tool_call in response.tool_calls:
                    tool_name = tool_call.get("name")
                    tool_params = tool_call.get("args", {})

                    if tool_name == "generate_image" and "description" in tool_params:
                        try:
                            result = generate_image.invoke({"description": tool_params["description"]}) or ""
                            if isinstance(result, str) and result.startswith("Error"):
                                tool_error = result
                            else:
                                generated_image = result
                        except Exception as e:
                            tool_error = f"Error generating image: {e}"

                    elif tool_name == "generate_quiz":
                        try:
                            json_data = generate_quiz.invoke({"content": tool_params["content"]})
                            if isinstance(json_data, dict) and "error" in json_data:
                                tool_error = json_data["error"]
                            else:
                                quiz_data = json_data
                        except Exception as e:
                            tool_error = f"Error processing quiz: {e}"

                    elif tool_name == "save_notes":
                        try:
                            status = save_notes_tool.invoke({
                                "data": tool_params["data"],
                                "user_id": user_id,  # Comes from validated JWT, not request body.
                            })
                            if isinstance(status, str) and status.startswith("Error"):
                                tool_error = status
                            else:
                                self.memory.chat_memory.add_user_message(status)
                        except Exception as e:
                            tool_error = f"Error saving notes: {e}"

            self.memory.chat_memory.add_user_message(text)
            self.memory.chat_memory.add_ai_message(explanation)

            if tool_error and not (generated_image or quiz_data):
                return {
                    "text": tool_error,
                    "image": generated_image,
                    "quiz": quiz_data,
                }

            return {
                "text": explanation,
                "image": generated_image,
                "quiz": quiz_data,
            }

        except Exception as e:
            return {"text": f"Error: {str(e)}", "image": "", "quiz": None}