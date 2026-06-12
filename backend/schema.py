TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Use this tool to search the internet for live, real-time information, weather, news, or facts you do not know.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search keywords or question. Example: 'latest AI trends 2026'."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_report",
            "description": "Use this tool to save your final research report to a local text file. Run this ONLY when your research is completely finished.",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "The name of the file ending in .txt. Example: 'ai_market_report.txt'."
                    },
                    "content": {
                        "type": "string",
                        "description": "The full text content of the research report to be saved."
                    }
                },
                "required": ["filename", "content"]
            }
        }
    }
]