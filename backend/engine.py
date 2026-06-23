from gc import callbacks
from backend.config import GROQ_API_KEY, MODEL_NAME
from backend.tools import AgentTools
from groq import AsyncGroq
import uuid
from datetime import datetime
import json
from backend.schema import TOOLS


class ResearchEngine:
    def __init__(self) -> None:

        self.tools_instance = AgentTools()
        self.groq_client = AsyncGroq(api_key=GROQ_API_KEY)


    async def run(self, user_prompt: str, on_step: Callable):

        message = [
            {"role": "system",
            "content":         
                "SYSTEM PROTOCOL: You are the AutoAnalyst-Engine. "
                "You communicate ONLY via the provided JSON tool-calling schema. "
                "CRITICAL: Do not use <function> or <tool> tags. Do not output code blocks. "
                "Only use the 'search_web' and 'save_report' tools as defined. "
                
                "WORKFLOW:\n"
                "1. Use 'search_web' to gather specific sports facts.\n"
                "2. Once facts are gathered, use 'save_report' to store the final Markdown report.\n"
                "3. STRICT PROTOCOL: Respond ONLY with tool calls. No conversational text."
                "4. Your final response after saving must be a brief confirmation."
                },
            {"role": "user",
            "content": user_prompt
            }
        ]

        steps = 0
        final_markdown = ""

        while True:

            steps += 1
            if steps > 5:
                await on_step("error", "Max Steps hit!")

                break

            response = await self.groq_client.chat.completions.create(
                model= MODEL_NAME,
                messages= message,
                tools= TOOLS
            )

            response_message = response.choices[0].message
            message.append(response_message)

            if response_message.content:
                await on_step("reason", response_message.content)

            tool_calls = response_message.tool_calls

            if not tool_calls:
                await on_step("final", response_message.content)
                    
                break
                
            if tool_calls:
                for tool_call in tool_calls:

                    call_id = tool_call.id
                    function_name = tool_call.function.name
                    await on_step("search", f" [🔍] Agent is executing: {function_name}...")
                    try:
                        args = json.loads(tool_call.function.arguments)

                        if function_name == "save_report":
                            final_markdown = args.get("content", "")

                        target_function = getattr(self.tools_instance, function_name)
                        result = await target_function(**args)

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

                    await on_step("analyze", f" [✅] Tool '{function_name}' returned data. Incorporating into research...")

        report_data = {
            "id": str(uuid.uuid4()),
            "title": user_prompt,
            "markdown": final_markdown,
            "createdAt": datetime.now().isoformat(),
            "wordCount": len(response_message.content.split()),
            "sources": [] # Pro: You can extract URLs from the 'message' history later
        }

        # 2. Send the specialized "report" type to the bridge
        await on_step("report", report_data)

        # 3. Finally, signal completion
        await on_step("complete", "Research and report generation complete.")

        return response_message.content

if __name__ == "__main__":
    engine = ResearchEngine()
    user_input = "Research the latest news on AI Agents and save a report named ai_agents.txt"
    
    try:
        result = engine.run(user_input)

    except Exception as e:
        print(f"error no response found {e}")
