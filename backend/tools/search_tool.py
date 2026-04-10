import requests
import os
from concurrent.futures import ThreadPoolExecutor, as_completed


def search_learning_resources(topics: list[str]) -> dict:
    """
    Search for real learning resources for multiple topics at once.
    Args:
        topics: List of search topics, one per week.
                e.g. ["Java OOP tutorial youtube", "Spring Boot REST API freecodecamp"]
    Returns:
        Dict mapping each topic to a list of resources with title, description, link.
        e.g. {
            "Java OOP tutorial youtube": [
                {"title": "...", "description": "...", "link": "https://..."},
                ...
            ],
            "Spring Boot REST API freecodecamp": [...]
        }
    """
    api_key = os.getenv("SERPAPI_KEY")

    def fetch(topic: str) -> tuple[str, list[dict]]:
        try:
            response = requests.get(
                "https://serpapi.com/search",
                params={
                    "q": f"{topic} site:youtube.com OR site:udemy.com OR site:coursera.org OR site:freecodecamp.org",
                    "api_key": api_key,
                    "num": 2,
                },
                timeout=10,
            )
            results = response.json().get("organic_results", [])
            resources = [
                {
                    "title": r.get("title", ""),
                    "description": r.get("snippet", ""),
                    "link": r.get("link", ""),
                }
                for r in results
                if r.get("link")
            ]
            return topic, resources
        except Exception as e:
            print(f"Search failed for topic '{topic}': {e}")
            return topic, []

    results = {}
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(fetch, topic): topic for topic in topics}
        for future in as_completed(futures):
            topic, resources = future.result()
            results[topic] = resources

    return results
