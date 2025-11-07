from googlesearch import search

def search_username(username, context=None, platforms=None, num_results=10):
    """
    Search for a username across the web with optional context and platform filters.
    
    :param username: The username to search for (e.g. '@shaiksameer5861')
    :param context: Extra keywords for narrowing down (e.g. 'can i use it for my project')
    :param platforms: List of sites to restrict search (e.g. ['github.com', 'reddit.com'])
    :param num_results: Number of results to fetch
    :return: List of result URLs
    """
    
    base_query = f'"{username}"'
    if context:
        base_query += f' "{context}"'
    
    queries = []
    if platforms:
        for site in platforms:
            queries.append(f'{base_query} site:{site}')
    else:
        queries.append(base_query)

    all_results = []
    for q in queries:
        print(f"\n🔍 Searching: {q}")
        try:
            for url in search(q, num_results=num_results):
                all_results.append(url)
                print("👉", url)
        except Exception as e:
            print("❌ Error:", e)

    return all_results


# Example usage
if __name__ == "__main__":
    username = "@shaiksameer5861"
    context = "can i use it for my project"
    platforms = ["community.spline.design", "github.com", "reddit.com"]

    results = search_username(username, context, platforms, num_results=5)
    print("\n✅ Total results found:", len(results))
