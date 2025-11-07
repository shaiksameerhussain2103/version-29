from googlesearch import search

def brute_force_search(username, context=None, num_results=10):
    base_query = f'"{username}"'
    if context:
        base_query += f' "{context}"'
    
    print(f"\n🔍 Searching: {base_query}\n")
    
    all_results = []
    try:
        for url in search(base_query, num_results=num_results):
            # Filter out Google redirect/search URLs and empty results
            if url and "google.com/search" not in url:
                all_results.append(url)
                print("👉", url)
    except Exception as e:
        print("❌ Error:", e)

    # Final Summary
    print("\n" + "="*50)
    print(f"✅ Total valid results found: {len(all_results)}")
    print("="*50)
    for i, url in enumerate(all_results, start=1):
        print(f"{i}. {url}")
    print("="*50)

    return all_results


# Example run
if __name__ == "__main__":
    username = "@shaiksameer5861"
    context = "can i use it for my project ?"
    
    results = brute_force_search(username, context, num_results=15)
