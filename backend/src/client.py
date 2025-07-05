import re
import json
from typing import Dict, Union
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage
from langchain.memory import ConversationBufferMemory
from langchain_google_genai import ChatGoogleGenerativeAI

from .tools import generate_image

load_dotenv()

AGENTS: Dict[str, any] = {}

SYSTEM_PROMPT = '''
You are IntelliLearn — an intelligent, friendly educational assistant that helps students learn effectively at their own pace using both text and visuals.

Goals:
- Provide accurate, clear, and supportive answers.
- Adjust explanations to the student's level: beginner, intermediate, or advanced.
- Break down complex topics into simple, digestible steps.
- Use **visual aids and diagrams** whenever possible to enhance understanding.

Teaching Style:
- For beginners: Use analogies, simple language, and basic concepts.
- For intermediate learners: Add more structure, terminology, and examples.
- For advanced learners: Be deep, analytical, and technically rich.
- Use diagrams or generated images whenever a student seems confused or asks for a visual explanation.

Tool You Can Use:
- **generate_image** — Use this tool to generate diagrams, flowcharts, illustrations, or visual explanations for any topic.

When to Use generate_image:
- A student asks for a diagram, visual aid, or image.
- You believe a concept would be better understood with a visual representation.
- You're explaining something like architecture, flow, layers, structures, processes, etc.

How to Call a Tool:
- When you want to use the `generate_image` tool, respond using this structure:

{
  "tool": {
    "name": "generate_image",
    "parameters": {
      "description": "a detailed description of the image to be generated"
    }
  },
  "text": "Additional explanation if needed."
}

Rules:
- This JSON should be a single object embedded in the response.
- Only one tool call per response.
'''

def get_or_create_llm(session_id: str):
    if session_id in AGENTS:
        return AGENTS[session_id]

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.7,
    )

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True
    )

    AGENTS[session_id] = {"llm": llm, "memory": memory}
    return AGENTS[session_id]

async def chat_with_memory(user_input: Union[str, dict], session_id: str) -> dict:
    agent_data = get_or_create_llm(session_id)
    llm = agent_data["llm"]
    memory = agent_data["memory"]

    text = ""
    image_b64 = None

    if isinstance(user_input, dict):
        text = user_input.get("text", "")
        image_b64 = user_input.get("image_base64", None)
    else:
        text = str(user_input)

    try:
        if not text.strip():
            return {"text": "Please provide a question or topic you'd like to learn about."}

        chat_history = memory.chat_memory.messages
        messages = [HumanMessage(content=SYSTEM_PROMPT)]
        messages.extend(chat_history)

        if image_b64:
            content = [
                {"type": "text", "text": text},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}}
            ]
            messages.append(HumanMessage(content=content))
        else:
            messages.append(HumanMessage(content=text))

        response = await llm.ainvoke(messages)
        raw_output = response.content.strip()
        
        tool_block_match = re.search(
            r'{\s*"tool"\s*:\s*{[\s\S]+?},\s*"text"\s*:\s*".*?"\s*}', raw_output
        )

        if tool_block_match:
            try:
                parsed = json.loads(tool_block_match.group())

                explanation = parsed.get("text", "").strip()
                tool = parsed.get("tool", {})
                tool_name = tool.get("name")
                tool_params = tool.get("parameters", {})
                
                if tool_name == "generate_image" and "description" in tool_params:
                    description = tool_params["description"]
                    image_result = generate_image.invoke({"description": description})

                    memory.chat_memory.add_user_message(text)
                    memory.chat_memory.add_ai_message(f"{explanation}\n[Image generated: {description}]")

                    return {
                        "text": explanation,
                        "image": image_result
                    }

            except json.JSONDecodeError:
                pass 

        memory.chat_memory.add_user_message(text)
        memory.chat_memory.add_ai_message(raw_output)
        return {"text": raw_output, "image": ""}

    except Exception as e:
        return {"text": f"Error: {str(e)}", "image": ""}