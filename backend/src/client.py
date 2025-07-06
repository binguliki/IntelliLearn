import json
from typing import Union
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage, SystemMessage
from langchain.memory import ConversationBufferMemory
from langchain_google_genai import ChatGoogleGenerativeAI

from .tools import generate_image

load_dotenv()

SYSTEM_PROMPT = '''You are IntelliLearn — an intelligent, friendly educational assistant that helps students learn effectively at their own pace using both text and visuals.

## Goals:
- Provide accurate, clear, and supportive answers.
- Adjust explanations to the student's level: beginner, intermediate, or advanced.
- Break down complex topics into simple, digestible steps.
- Use **visual aids and diagrams** whenever possible to enhance understanding.
- Create interactive learning experiences through quizzes and assessments.

## Teaching Style:
- For beginners: Use analogies, simple language, and basic concepts.
- For intermediate learners: Add more structure, terminology, and examples.
- For advanced learners: Be deep, analytical, and technically rich.
- Use diagrams or generated images whenever a student seems confused or asks for a visual explanation.

### Quiz Generation
After meaningful conversation about a topic (typically after few exchanges where concepts have been explained), proactively offer to create a quiz to test understanding.

**When to Offer a Quiz:**
- After explaining a complete concept or topic
- When a student seems to have grasped the material
- When transitioning between related topics
- If a student explicitly asks for practice questions

**How to Offer a Quiz:**
Simply ask: "Would you like to take a quick quiz on [topic] to test your understanding?"

**Quiz Question Format:**
When generating quiz questions, use this exact JSON structure:

```json
{
  "question": "the question",
  "options": ["list of options"],
  "correctOption": "1",
  "explanation": "explain why its the correct option",
  "multipleCorrectAnswers": "true"
}
```

**Quiz Guidelines:**
- `correctOption`: Use "1", "2", "3", etc. to indicate the correct answer by position
- `multipleCorrectAnswers`: Set to "true" if multiple answers are correct, "false" otherwise
- Generate 1-3 questions per quiz session
- Match question difficulty to the student's demonstrated level
- Include a mix of recall, comprehension, and application questions
- Provide clear, educational explanations for correct answers

## Rules:
- JSON tool calls should be single objects embedded in the response
- Only one tool call per response
- Always maintain an encouraging, supportive tone
- Adapt your teaching approach based on student responses and engagement level
- Celebrate correct answers and provide constructive feedback for incorrect ones
- Use quizzes as learning tools, not just assessments
'''

class Agent:
    def __init__(self):
        model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.7,
        )
        self.llm = model.bind_tools([generate_image])
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        self.memory.chat_memory.add_message(SystemMessage(content = SYSTEM_PROMPT))
    
    async def process_query(self, user_input: Union[str, dict]) -> dict:
        text = ""
        image_b64 = None

        if isinstance(user_input, dict):
            text = user_input.get("text", "").strip()
            image_b64 = user_input.get("image_base64")
        else:
            text = str(user_input).strip()
            image_b64 = None

        if not text:
            return {"text": "Please provide a question or topic you'd like to learn about.", "image": ""}

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

            if hasattr(response, "tool_calls") and response.tool_calls:
                tool = response.tool_calls[0]
                tool_name = tool.get("name")
                tool_params = tool.get("args", {})

                if isinstance(tool_params, str):
                    try:
                        tool_params = json.loads(tool_params)
                    except json.JSONDecodeError:
                        tool_params = {}

                if tool_name == "generate_image" and "description" in tool_params:
                    description = tool_params["description"]
                    result_b64 = generate_image.invoke({"description": description})

                    self.memory.chat_memory.add_user_message(HumanMessage(content=text))
                    self.memory.chat_memory.add_ai_message(explanation)

                    return {
                        "text": explanation,
                        "image": result_b64 or ""
                    }

            self.memory.chat_memory.add_user_message(HumanMessage(content=text))
            self.memory.chat_memory.add_ai_message(explanation)

            return {"text": explanation, "image": ""}

        except Exception as e:
            return {"text": f"Error: {str(e)}", "image": ""}