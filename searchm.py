import aiohttp
import asyncio
from googlesearch import search

async def duckduckgo_search(session, query):
    url = f"https://duckduckgo.com/html/?q={query}"
    async with session.get(url, headers={"User-Agent": "Mozilla/5.0"}) as resp:
        text = await resp.text()
        return [line.split('"')[0] for line in text.split("href=") if line.startswith('"http')]

async def ruthless_multi_search(query):
    results = set()

    # Google search (sync but strong)
    for url in search(query, num_results=10):
        results.add(url)

    # DuckDuckGo async
    async with aiohttp.ClientSession() as session:
        duck = await duckduckgo_search(session, query)
        results.update(duck)

    print("\n✅ Total results:", len(results))
    for i, url in enumerate(results, 1):
        print(f"{i}. {url}")

if __name__ == "__main__":
    asyncio.run(ruthless_multi_search("can i use it for my project"))
