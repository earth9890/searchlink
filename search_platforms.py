import requests
import time
from urllib.parse import quote
from typing import Dict, List, Optional

class AISearchPlatform:
    def __init__(self, name: str, search_url: str, result_selector: str = None):
        self.name = name
        self.search_url = search_url
        self.result_selector = result_selector
    
    def search(self, query: str, target_domain: str) -> Dict:
        try:
            search_query = f"{query} site:{target_domain}"
            url = self.search_url.format(query=quote(search_query))
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            found = target_domain.lower() in response.text.lower()
            
            return {
                'platform': self.name,
                'query': query,
                'target_domain': target_domain,
                'found': found,
                'status': 'success',
                'timestamp': time.time()
            }
            
        except Exception as e:
            return {
                'platform': self.name,
                'query': query,
                'target_domain': target_domain,
                'found': False,
                'status': 'error',
                'error': str(e),
                'timestamp': time.time()
            }

class SearchLinkMonitor:
    def __init__(self):
        self.platforms = [
            AISearchPlatform("Perplexity", "https://www.perplexity.ai/search?q={query}"),
            AISearchPlatform("SearchGPT", "https://chatgpt.com/search?q={query}"),
            AISearchPlatform("You.com", "https://you.com/search?q={query}"),
            AISearchPlatform("Phind", "https://www.phind.com/search?q={query}"),
        ]
    
    def monitor_domain(self, domain: str, queries: List[str]) -> List[Dict]:
        results = []
        
        for query in queries:
            print(f"Searching for '{query}' mentioning {domain}...")
            
            for platform in self.platforms:
                result = platform.search(query, domain)
                results.append(result)
                
                status = "✓" if result['found'] else "✗"
                print(f"  {platform.name}: {status} {result['status']}")
                
                time.sleep(1)
        
        return results
    
    def get_summary(self, results: List[Dict]) -> Dict:
        total_searches = len(results)
        found_count = sum(1 for r in results if r['found'])
        error_count = sum(1 for r in results if r['status'] == 'error')
        
        platform_stats = {}
        for result in results:
            platform = result['platform']
            if platform not in platform_stats:
                platform_stats[platform] = {'found': 0, 'total': 0, 'errors': 0}
            
            platform_stats[platform]['total'] += 1
            if result['found']:
                platform_stats[platform]['found'] += 1
            if result['status'] == 'error':
                platform_stats[platform]['errors'] += 1
        
        return {
            'total_searches': total_searches,
            'found_count': found_count,
            'error_count': error_count,
            'success_rate': found_count / total_searches if total_searches > 0 else 0,
            'platform_stats': platform_stats
        }