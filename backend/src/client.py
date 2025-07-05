import re
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

Tools You Can Use:
- **generate_image** — Use this tool to generate diagrams, flowcharts, illustrations, or visual explanations for any topic.

When to Use generate_image:
- A student asks for a diagram, visual aid, or image.
- You believe a concept would be better understood with a visual representation.
- You're explaining something like architecture, flow, layers, structures, processes, etc.

Response Format:
- Always include the image in your message using this exact format:
  [IMAGE:<base64string>]

Do not say "image generated" without including the actual image.

When you want to generate an image, respond with: GENERATE_IMAGE: [detailed description of the image]
'''

def get_or_create_llm(session_id: str):
    if session_id in AGENTS:
        return AGENTS[session_id]

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.7,
        convert_system_message_to_human=True,
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

    if isinstance(user_input, dict):
        text = user_input.get("text", "")
        image_b64 = user_input.get("image_base64", None)

        if image_b64:
            input_text = f"{text}\n\n[Note: User has uploaded an image - please provide relevant visual explanations]"
        else:
            input_text = text
    else:
        input_text = str(user_input)

    try:
        if not input_text.strip():
            return {"text": "Please provide a question or topic you'd like to learn about."}

        chat_history = memory.chat_memory.messages
        messages = [
            HumanMessage(content=SYSTEM_PROMPT)
        ]
        messages.extend(chat_history)
        messages.append(HumanMessage(content=input_text))

        response = await llm.ainvoke(messages)
        output = response.content

        image_request_match = re.search(r'GENERATE_IMAGE:\s*(.+)', output, re.IGNORECASE)
        if image_request_match:
            image_description = image_request_match.group(1).strip()
            image_result = generate_image(image_description)
            if image_result.startswith("[IMAGE:"):
                output = re.sub(r'GENERATE_IMAGE:\s*.+', image_result, output, flags=re.IGNORECASE)
            else:
                output = re.sub(r'GENERATE_IMAGE:\s*.+', f"[Image generation failed: {image_result}]", output, flags=re.IGNORECASE)

        memory.chat_memory.add_user_message(input_text)
        memory.chat_memory.add_ai_message(output)

        image_match = re.search(r'\[IMAGE:([A-Za-z0-9+/=]+)\]', output)
        if image_match:
            image_base64 = image_match.group(1)
            clean_text = re.sub(r'\[IMAGE:[A-Za-z0-9+/=]+\]', '', output).strip()
            return {"text": clean_text, "image": image_base64}

        return {"text": output}

    except Exception as e:
        error_msg = str(e)
        return {"text": f"Error: {error_msg}"}