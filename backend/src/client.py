from typing import Union
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage, SystemMessage
from langchain.memory import ConversationBufferMemory
from langchain_google_genai import ChatGoogleGenerativeAI

from .tools import generate_image, generate_quiz

load_dotenv()

SYSTEM_PROMPT = '''# IntelliLearn — Enhanced Educational Assistant

You are IntelliLearn — an intelligent, friendly educational assistant that helps students learn effectively at their own pace using both text and visuals.

## Core Goals:
- Provide accurate, clear, and supportive answers
- Adjust explanations to the student's level: beginner, intermediate, or advanced
- Break down complex topics into simple, digestible steps
- Use **visual aids and diagrams** whenever possible to enhance understanding
- Create comprehensive interactive learning experiences through multi-question quizzes

## Enhanced Quiz System

### When to Offer Quizzes:
- After explaining a complete concept or topic
- When a student demonstrates understanding of the material
- When a student explicitly requests practice questions or wants to test their knowledge
- During natural transition points between related topics

### ALWAYS Generate Quizzes via Tool:
**You must ALWAYS call the `generate_quiz` tool to generate a quiz. Never present a quiz directly in the response.**
Use the quiz format shown below, convert it to a valid JSON string, and call the `generate_quiz` tool with it as the argument.

### Quiz Creation Guidelines:
- Always create 5-10 questions per quiz
- Mix question types: recall, comprehension, application, analysis
- Provide 3-4 options per question
- Include detailed explanations for each correct answer
- Use "correctOption" as a string: "1" for single answer, "1,3" for multiple answers
- Set "multipleCorrectAnswers": true when multiple options are correct

### Quiz Invitation:
- Proactively offer quizzes with engaging language:
- "Ready to test your understanding of [topic] with a comprehensive quiz?"
- "How about we check your mastery of these concepts with some practice questions?"
- "Would you like to take a quiz covering everything we've discussed about [topic]?"

## Response Guidelines:
- Maintain encouraging, supportive communication
- Provide constructive feedback for improvement
- Use quizzes to guide future teaching
- Celebrate learning progress and effort
- Encourage questions and curiosity beyond the quiz content''' 

class Agent:
    def __init__(self):
        model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.7,
        )
        
        self.llm = model.bind_tools([generate_image, generate_quiz])
        
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        self.memory.chat_memory.add_message(SystemMessage(content=SYSTEM_PROMPT))
        self.SYSTEM_PROMPT = SYSTEM_PROMPT
        
    def format_quiz_report_summary(self, quiz_report: list) -> str:
        """Format quiz results for processing"""
        total_questions = len(quiz_report)
        correct_answers = sum(1 for ans in quiz_report if ans['isCorrect'])
        score_percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        
        summary = f"Quiz Results Summary:\n"
        summary += f"Score: {correct_answers}/{total_questions} ({score_percentage:.1f}%)\n\n"
        summary += "Detailed Results:\n"
        
        for ans in quiz_report:
            status = "✓ Correct" if ans['isCorrect'] else "✗ Incorrect"
            summary += f"Q{ans['questionNumber']}: {status}\n"
            summary += f"  User Answer: {ans['userAnswer']}\n"
            summary += f"  Correct Answer: {ans['correctAnswer']}\n"
            if not ans['isCorrect']:
                summary += f"  Explanation: {ans.get('explanation', 'No explanation provided')}\n"
            summary += "\n"
        
        summary += "Please provide feedback on the student's performance and suggest areas for improvement."
        return summary

    async def process_query(self, user_input: Union[str, dict]) -> dict:
        """Process user query and return response"""
        text = ""
        image_b64 = None
        quiz_report = None

        if isinstance(user_input, dict):
            text = user_input.get("text", "").strip()
            image_b64 = user_input.get("image_base64")
            quiz_report = user_input.get("quizReport")
        else:
            text = str(user_input).strip()

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
            return {"text": "Please provide a question or topic you'd like to learn about.", "image": "", "quiz": None}

        try:
            messages = self.memory.chat_memory.messages.copy()

            if image_b64:
                content = [
                    {"type": "text", "text": text},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}}
                ]
            else:
                content = text

            messages.append(HumanMessage(content=content))

            response = await self.llm.ainvoke(messages)
            explanation = response.content

            generated_image = ""
            quiz_data = None
            
            if hasattr(response, "tool_calls") and response.tool_calls:
                for tool_call in response.tool_calls:
                    tool_name = tool_call.get("name")
                    tool_params = tool_call.get("args", {})

                    if tool_name == "generate_image" and "description" in tool_params:
                        try:
                            generated_image = generate_image.invoke({"description": tool_params["description"]}) or ""
                        except Exception as e:
                            print(f"Error generating image: {e}")
                    
                    elif tool_name == "generate_quiz":
                        try:
                            jsonData = generate_quiz.invoke({"content": tool_params["content"]})
                            if 'error' not in jsonData:
                                quiz_data = jsonData
                        except Exception as e:
                            print(f"Error processing quiz: {e}")

            self.memory.chat_memory.add_user_message(text)
            self.memory.chat_memory.add_ai_message(explanation)

            return {
                "text": explanation,
                "image": generated_image,
                "quiz": quiz_data
            }

        except Exception as e:
            return {
                "text": f"Error: {str(e)}", 
                "image": "", 
                "quiz": None
            }