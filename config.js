const config = {
    platforms: [
        {
            name: "Perplexity",
            baseUrl: "https://www.perplexity.ai",
            searchPath: "/search",
            enabled: true,
            weight: 1.0
        },
        {
            name: "SearchGPT",  
            baseUrl: "https://chatgpt.com",
            searchPath: "/search",
            enabled: true,
            weight: 1.0
        },
        {
            name: "You.com",
            baseUrl: "https://you.com",
            searchPath: "/search",
            enabled: true,
            weight: 1.0
        },
        {
            name: "Phind",
            baseUrl: "https://www.phind.com",
            searchPath: "/search",
            enabled: true,
            weight: 1.0
        }
    ],
    monitoring: {
        interval: 300000, // 5 minutes
        retryAttempts: 3,
        retryDelay: 5000,
        timeout: 15000
    },
    output: {
        console: true,
        json: true,
        jsonFile: 'results.json'
    }
};

module.exports = config;