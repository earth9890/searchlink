const axios = require('axios');
const config = require('./config');

class AISearchPlatform {
    constructor(name, searchUrl) {
        this.name = name;
        this.searchUrl = searchUrl;
    }

    async search(query, targetDomain, retryCount = 0) {
        try {
            const searchQuery = `${query} site:${targetDomain}`;
            const url = this.searchUrl.replace('{query}', encodeURIComponent(searchQuery));
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: config.monitoring.timeout
            });

            const found = response.data.toLowerCase().includes(targetDomain.toLowerCase());

            return {
                platform: this.name,
                query,
                targetDomain,
                found,
                status: 'success',
                timestamp: Date.now(),
                retryCount
            };

        } catch (error) {
            if (retryCount < config.monitoring.retryAttempts) {
                await new Promise(resolve => setTimeout(resolve, config.monitoring.retryDelay));
                return this.search(query, targetDomain, retryCount + 1);
            }
            
            return {
                platform: this.name,
                query,
                targetDomain,
                found: false,
                status: 'error',
                error: error.message,
                timestamp: Date.now(),
                retryCount
            };
        }
    }
}

class SearchLinkMonitor {
    constructor() {
        this.platforms = config.platforms
            .filter(p => p.enabled)
            .map(p => new AISearchPlatform(p.name, `${p.baseUrl}${p.searchPath}?q={query}`));
        this.config = config;
    }

    async monitorDomain(domain, queries) {
        const results = [];

        for (const query of queries) {
            console.log(`Searching for '${query}' mentioning ${domain}...`);

            for (const platform of this.platforms) {
                const result = await platform.search(query, domain);
                results.push(result);

                const status = result.found ? "✓" : "✗";
                console.log(`  ${platform.name}: ${status} ${result.status}`);

                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        return results;
    }

    getSummary(results) {
        const totalSearches = results.length;
        const foundCount = results.filter(r => r.found).length;
        const errorCount = results.filter(r => r.status === 'error').length;

        const platformStats = {};
        results.forEach(result => {
            const platform = result.platform;
            if (!platformStats[platform]) {
                platformStats[platform] = { found: 0, total: 0, errors: 0 };
            }

            platformStats[platform].total++;
            if (result.found) platformStats[platform].found++;
            if (result.status === 'error') platformStats[platform].errors++;
        });

        return {
            totalSearches,
            foundCount,
            errorCount,
            successRate: totalSearches > 0 ? foundCount / totalSearches : 0,
            platformStats
        };
    }
}

module.exports = { SearchLinkMonitor };