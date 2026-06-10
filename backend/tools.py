from tavily import TavilyClient
from dotenv import load_dotenv
import os

load_dotenv()

class AgentTools:
    pass

    def __init__(self) -> None:
        self.tavily_api = TavilyClient(api_key=os.getenv("tavily_api"))
