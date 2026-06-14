from pyexpat import model
from backend import tools
from config import GROQ_API_KEY, TAVILY_API_KEY
from tools import AgentTools
from groq import Groq
from schema import TOOLS


class ResearchEngine:
    def __init__(self) -> None:

        self.tools_instance = AgentTools()
        self.groq_client = Groq(api_key=GROQ_API_KEY)


    def run(self, user_prompt: str):
        response_messages = []

        message = [
            {"role": "system",
            "content": "You are an expert researcher. Use search_web to find facts, and save_report as your absolute final step."
            },
            {"role": "user",
            "content": user_prompt
            }
        ]

        while True:
            response = self.groq_client.chat.completions.create(
                model= "llama3-70b-8192",
                message= message,
                tools= TOOLS
            )

            response_message = response.choices[0].message
            response_messages.append(response_message)

            tool_calls = response_message.tool_calls

            if not tool_calls:
                print(response_message.content)
                
                break


if __name__ == "__main__":
    engine = ResearchEngine()
    user_input = ""
    engine.run(user_input)
