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
                    "You are a Senior Research Analyst. Follow this strict protocol:\n"
                    "1. CONDUCT RESEARCH: Use 'search_web' multiple times to gather facts.\n"
                    "2. ANALYZE DATA: Look at the URLs and content returned. Extract specific details.\n"
                    "3. SYNTHESIZE: Combine all found facts into a professional Markdown report. "
                    "Do NOT use placeholders. Do NOT summarize. Use verbatim facts.\n"
                    "4. SAVE: Use 'save_report' with a detailed body (min 300 words) using Markdown headers.\n"
                    "5. TERMINATE: Only after saving, confirm the file location to the user."
                },
            {"role": "user",
            "content": user_prompt
            }
        ]

        steps = 0

        while True:

            steps += 1
            if steps > 5:
                print("Max Steps hit!")

                break

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
                    print(f" [🔍] Agent is executing: {function_name}...")
                    try:
                        args = json.loads(tool_call.function.arguments)

                        target_function = getattr(self.tools_instance, function_name)
                        result = target_function(**args)

                        tool_response = {
                            "role": "tool",
                            "tool_call_id": call_id,
                            "name": function_name,
                            "content": result
                        }
                        message.append(tool_response)

                    except Exception as e:
                        return_message = {
                            "role": "tool",
                            "tool_call_id": call_id,
                            "name": function_name,
                            "content": f"Error execution: {e}"
                        }
                        message.append(return_message)

                    print(f" [✅] Tool '{function_name}' returned data.")

        return response_message.content

if __name__ == "__main__":
    engine = ResearchEngine()
    user_input = "Research the latest news on AI Agents and save a report named ai_agents.txt"
    try:

        result = engine.run(user_input)

    except Exception as e:
        print(f"error no response found {e}")
