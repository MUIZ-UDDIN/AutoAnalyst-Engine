from config import GROQ_API_KEY, MODEL_NAME
from tools import AgentTools
from groq import Groq
import json
from schema import TOOLS


class ResearchEngine:
    def __init__(self) -> None:

        self.tools_instance = AgentTools()
        self.groq_client = Groq(api_key=GROQ_API_KEY)


    def run(self, user_prompt: str):

        message = [
            {"role": "system",
            "content":         
                    "You are a Senior Research Analyst. "
                    "1. Use 'search_web' to find detailed information. "
                    "2. You MUST combine all the facts you find into a long, professional Markdown report. "
                    "3. Use 'save_report' to save this full detailed report. "
                    "4. The 'content' you provide to 'save_report' must be at least 3-4 paragraphs long with headings."
                },
            {"role": "user",
            "content": user_prompt
            }
        ]

        while True:
            response = self.groq_client.chat.completions.create(
                model= MODEL_NAME,
                messages= message,
                tools= TOOLS
            )

            response_message = response.choices[0].message
            message.append(response_message)

            tool_calls = response_message.tool_calls

            if not tool_calls:
                print(response_message.content)
                
                break
            
            if tool_calls:
                for tool_call in tool_calls:

                    call_id = tool_call.id
                    function_name = tool_call.function.name
                    args = json.loads(tool_call.function.arguments)

                    target_function = getattr(self.tools_instance, function_name)
                    result = target_function(**args)

                    tool_response = {
                        "role": "tool",
                        "name": function_name,
                        "tool_call_id": call_id,
                        "content": result
                    }
            
                    message.append(tool_response)

        return "Research Task Completed Successfully."

if __name__ == "__main__":
    engine = ResearchEngine()
    user_input = "Research the latest news on AI Agents and save a report named ai_agents.txt"
    try:

        result = engine.run(user_input)
        print(result)

    except Exception as e:
        print(f"error no response found {e}")
