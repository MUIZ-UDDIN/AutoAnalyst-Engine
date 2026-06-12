import pathlib
from tavily import TavilyClient
from config import TAVILY_API_KEY
from config import OUTPUT_DIR

class AgentTools:
    pass

    def __init__(self) -> None:
        self.tavily_api = TavilyClient(api_key=TAVILY_API_KEY)
        self.research_outpt = OUTPUT_DIR
        
    def search_web(self, query: str):
        tavily_search = self.tavily_api.search(query=query, search_depth="advanced")
        data = []

        results = tavily_search.get("results")

        if not results:
            return "No results found"
            
        for result in results:
            title, url, content =result["title"], result["url"], result["content"]

            formated_str = f"Title:{title}\nURL: {url}\nContent: {content}"
            data.append(formated_str)

        return "\n\n".join(data)

    def save_report(self, filename: str, content: str):
        filepath = self.research_outpt / pathlib.Path(filename).with_suffix(".md")
        filepath.write_text(content, encoding="utf-8")



if __name__ == "__main__":
    engine = AgentTools()
    
    data = engine.search_web("what is weahter in pakistan")
    print("search done")

    engine.save_report("test", data)
    print("save done")
