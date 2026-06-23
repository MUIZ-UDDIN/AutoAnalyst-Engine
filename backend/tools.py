import pathlib
from tavily import TavilyClient
from backend.config import TAVILY_API_KEY, OUTPUT_DIR

class AgentTools:

    def __init__(self) -> None:
        self.tavily_api = TavilyClient(api_key=TAVILY_API_KEY)
        self.research_output = OUTPUT_DIR
        
    async def search_web(self, query: str):
        tavily_search = self.tavily_api.search(query=query, search_depth="advanced", max_results=2)
        data = []

        results = tavily_search.get("results")

        if not results:
            return "No results found"
            
        for result in results:
            short_content = result["content"][:800]
            title, url, content = result["title"], result["url"], short_content
            formatted_str = f"Title: {title}\nURL: {url}\nContent: {content}"
            data.append(formatted_str)

        return "\n\n".join(data)

    async def save_report(self, filename: str, content: str):
        filepath = self.research_output / pathlib.Path(filename).with_suffix(".md")
        filepath.write_text(content, encoding="utf-8")
        return f"Report has been saved to: {filename}"


if __name__ == "__main__":
    import asyncio

    async def main():
        engine = AgentTools()
        data = await engine.search_web("what is weather in pakistan")
        print("search done")
        await engine.save_report("test", data)
        print("save done")

    asyncio.run(main())
