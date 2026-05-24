#!/usr/bin/env python3

from search_platforms import SearchLinkMonitor
import sys
import json

def main():
    if len(sys.argv) < 2:
        print("Usage: python monitor.py <domain> [query1] [query2] ...")
        print("Example: python monitor.py example.com 'python tutorials' 'web development'")
        sys.exit(1)
    
    domain = sys.argv[1]
    queries = sys.argv[2:] if len(sys.argv) > 2 else [domain]
    
    print(f"Monitoring {domain} across AI search platforms...")
    print(f"Queries: {queries}")
    print("-" * 50)
    
    monitor = SearchLinkMonitor()
    results = monitor.monitor_domain(domain, queries)
    
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    
    summary = monitor.get_summary(results)
    
    print(f"Total searches: {summary['total_searches']}")
    print(f"Found: {summary['found_count']}")
    print(f"Success rate: {summary['success_rate']:.1%}")
    print(f"Errors: {summary['error_count']}")
    
    print("\nPlatform breakdown:")
    for platform, stats in summary['platform_stats'].items():
        rate = stats['found'] / stats['total'] if stats['total'] > 0 else 0
        print(f"  {platform}: {stats['found']}/{stats['total']} ({rate:.1%})")
    
    print("\nDetailed results saved to results.json")
    
    with open('results.json', 'w') as f:
        json.dump({
            'results': results,
            'summary': summary
        }, f, indent=2)

if __name__ == "__main__":
    main()