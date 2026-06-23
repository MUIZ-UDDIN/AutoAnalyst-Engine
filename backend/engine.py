from typing import Callable
from backend.config import GROQ_API_KEY, MODEL_NAME
from backend.tools import AgentTools
from groq import AsyncGroq
import uuid
from datetime import datetime
import json
import asyncio
import pathlib
from backend.schema import TOOLS


class ResearchEngine:
    def __init__(self) -> None:

        self.tools_instance = AgentTools()
        self.groq_client = AsyncGroq(api_key=GROQ_API_KEY)


    async def run(self, user_prompt: str, on_step: Callable):

        message = [
            {"role": "system",
            "content":
                "You are AutoAnalyst-Engine, a professional research assistant.\n\n"

                "## How you work\n"
                "1. Use 'search_web' to gather information — do 2 or 3 searches with different queries.\n"
                "2. After 2-3 searches, IMMEDIATELY call 'save_report' with the full synthesized report. "
                "Do NOT keep searching. You have limited steps.\n"
                "3. You communicate ONLY through tool calls. No conversational text.\n"
                "4. After saving, your final response is a brief confirmation.\n\n"

                "## Report structure (must be in Markdown)\n"
                "Your report MUST follow this structure:\n\n"
                "---\n"
                "# {Title}\n"
                "**Published:** {current date} | **Topic:** {brief description}\n\n"
                "---\n\n"
                "## Executive Summary\n"
                "{2-3 paragraphs summarizing the key findings, significance, and implications}\n\n"
                "## 1. Background & Context\n"
                "{Historical context, why this topic matters, current landscape}\n\n"
                "## 2. Key Findings\n"
                "{Break down the most important discoveries, data, or developments. "
                "Use sub-sections (###) for each major finding. Support with specific facts, "
                "statistics, and quoted sources.}\n\n"
                "### 2.1 {Finding One}\n"
                "{Details with data, quotes, and analysis}\n\n"
                "### 2.2 {Finding Two}\n"
                "{Details with data, quotes, and analysis}\n\n"
                "## 3. Analysis & Implications\n"
                "{Your analysis of what these findings mean. Trends, impacts, predictions. "
                "Connect the dots between different pieces of information.}\n\n"
                "## 4. Conclusion\n"
                "{Summarize the most important takeaway. What should the reader remember?}\n\n"
                "## Sources\n"
                "{Numbered list of all URLs you visited, with brief descriptions}\n"
                "---\n\n"

                "## Quality rules\n"
                "- Write in a professional, analytical tone — like a consulting firm report.\n"
                "- Each section must be multiple paragraphs with real substance, not bullet-point lists.\n"
                "- Include specific numbers, dates, names, and facts from your searches.\n"
                "- Do NOT make up information or speculate without evidence.\n"
                "- The report must be at least 500 words.\n"
                "- If information is limited, state what is known and acknowledge gaps.\n"
                "- Use Markdown formatting: headings, bold, italics, blockquotes, links, and tables where appropriate."
            },
            {"role": "user",
            "content": user_prompt
            }
        ]

        steps = 0
        final_markdown = ""
        saved_filename = ""

        while True:

            steps += 1
            if steps > 5:
                await on_step("error", "Max Steps hit!")
                return "Max steps reached — research incomplete."

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
                            raw_filename = args.get("filename", "report.md")
                            saved_filename = pathlib.Path(raw_filename).with_suffix(".md").name

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

        final_content = response_message.content or ""
        markdown_text = final_markdown or final_content
        actual_filename = saved_filename or f"{user_prompt[:30].replace(' ', '_')}.md".lower()
        report_data = {
            "id": str(uuid.uuid4()),
            "title": user_prompt,
            "markdown": markdown_text,
            "createdAt": datetime.now().isoformat(),
            "wordCount": len(markdown_text.split()),
            "filename": actual_filename,
            "sizeKb": round(len(markdown_text.encode("utf-8")) / 1024, 1),
            "downloadUrl": f"http://localhost:8000/api/reports/{actual_filename}",
            "sources": []
        }

        # 2. Send the specialized "report" type to the bridge
        await on_step("report", report_data)

        # 3. Finally, signal completion
        await on_step("complete", "Research and report generation complete.")

        return response_message.content

if __name__ == "__main__":
    async def main():
        engine = ResearchEngine()
        user_input = "Research the latest news on AI Agents and save a report named ai_agents.txt"
        try:
            result = await engine.run(user_input)
            print(result)
        except Exception as e:
            print(f"error no response found {e}")

    asyncio.run(main())
