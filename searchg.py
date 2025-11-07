from googlesearch import search

def ruthless_search(query, num_results=20, variations=True):
    """
    Brutal web searcher:
    - Takes any text (username, comment, phrase, anything).
    - Runs exact + broad variations (if enabled).
    - Filters out junk Google URLs.
    - Returns a strong list of results.
    """

    queries = [f'"{query}"'] if variations else [query]

    if variations:
        queries.append(query)  # broad search without quotes

    all_results = []
    seen = set()

    for q in queries:
        print(f"\n🔍 Searching: {q}\n")
        try:
            for url in search(q, num_results=num_results):
                if url and "google.com/search" not in url and url not in seen:
                    all_results.append(url)
                    seen.add(url)
                    print("👉", url)
        except Exception as e:
            print("❌ Error:", e)

    # Final summary
    print("\n" + "="*60)
    print(f"✅ Total unique valid results found: {len(all_results)}")
    print("="*60)
    for i, url in enumerate(all_results, start=1):
        print(f"{i}. {url}")
    print("="*60)

    return all_results


# Example Run
if __name__ == "__main__":
    # Try any text, username, or phrase here:
    query = "can i use it for my project"  
    results = ruthless_search(query, num_results=15, variations=True)
