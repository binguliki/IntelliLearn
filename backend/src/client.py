import re
from typing import Dict, Union, List
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage

from langchain.agents import initialize_agent, AgentType
from langchain.memory import ConversationBufferMemory
from langchain_google_genai import ChatGoogleGenerativeAI

from .tools import generate_image

load_dotenv()

# Global storage
AGENTS: Dict[str, any] = {}

SYSTEM_PROMPT = '''
You are IntelliLearn — an intelligent, friendly educational assistant that helps students learn effectively at their own pace using both text and visuals.

🎯 Goals:
- Provide accurate, clear, and supportive answers.
- Adjust explanations to the student's level: beginner, intermediate, or advanced.
- Break down complex topics into simple, digestible steps.
- Use **visual aids and diagrams** whenever possible to enhance understanding.

🧠 Teaching Style:
- For beginners: Use analogies, simple language, and basic concepts.
- For intermediate learners: Add more structure, terminology, and examples.
- For advanced learners: Be deep, analytical, and technically rich.
- Use diagrams or generated images whenever a student seems confused or asks for a visual explanation.

🛠️ Tools You Can Use:
- **generate_image** — Use this tool to generate diagrams, flowcharts, illustrations, or visual explanations for any topic.

📌 When to Use generate_image:
- A student asks for a diagram, visual aid, or image.
- You believe a concept would be better understood with a visual representation.
- You're explaining something like architecture, flow, layers, structures, processes, etc.

📤 Response Format:
- Always include the image in your message using this exact format:
  
  [IMAGE:<base64string>]

✅ Do not say “image generated” without including the actual image.
'''

def get_or_create_agent(session_id: str):
    if session_id in AGENTS:
        return AGENTS[session_id]

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.7
    )

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True
    )

    tools = [generate_image]

    agent = initialize_agent(
        agent=AgentType.OPENAI_FUNCTIONS,
        tools=tools,
        llm=llm,
        memory=memory,
        verbose=True,
        handle_parsing_errors=True,
        agent_kwargs={"system_message": SYSTEM_PROMPT}
    )

    AGENTS[session_id] = agent
    return agent

async def chat_with_memory(user_input: Union[str, dict], session_id: str) -> dict:
    agent = get_or_create_agent(session_id)

    if isinstance(user_input, dict):
        text = user_input.get("text", "")
        image_b64 = user_input.get("image_base64", None)

        if image_b64:
            human_msg = HumanMessage(content=[
                {"type": "text", "text": text},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}}
            ])
        else:
            human_msg = HumanMessage(content=text)
    else:
        human_msg = HumanMessage(content=user_input)

    try:
        response = await agent.ainvoke(
            human_msg.content,
        )

        output = str(response["output"])

        image_match = re.search(r'\[IMAGE:([A-Za-z0-9+/=]+)\]', output)
        if image_match:
            image_base64 = image_match.group(1)
            clean_text = re.sub(r'\[IMAGE:[A-Za-z0-9+/=]+\]', '', output).strip()
            return {"text": clean_text, "image": image_base64}

        return {"text": output}

    except Exception as e:
        return {"text": f"Error: {str(e)}"}