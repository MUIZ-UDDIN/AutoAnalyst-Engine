import pathlib
from tavily import TavilyClient
from dotenv import load_dotenv
import os

load_dotenv()

class AgentTools:
    pass

    def __init__(self) -> None:
        self.tavily_api = TavilyClient(api_key=os.getenv("tavily_api"))
        self.result = []
        self.research_outpt = pathlib.Path("../research_output")
        
    def search_web(self, query: str):
        tavily_search = self.tavily_api.search(query=query, search_depth="advanced")

        results = tavily_search.get("results")
            
        for result in results:
            title, url, content =result["title"], result["url"], result["content"]
            self.result.append({"title": title, "url": url, "content": content})

        if not results:
            return "No results found"

        return tavily_search



if __name__ == "__main__":
    AgentTools().search_web("what is weahter in pakistan")
