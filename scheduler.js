const { SearchLinkMonitor } = require('./searchPlatforms');
const fs = require('fs');
const config = require('./config');

class SearchLinkScheduler {
    constructor() {
        this.monitor = new SearchLinkMonitor();
        this.isRunning = false;
        this.intervalId = null;
        this.results = [];
    }

    async start(domain, queries = [domain]) {
        if (this.isRunning) {
            console.log('Scheduler already running');
            return;
        }

        this.isRunning = true;
        console.log(`Starting continuous monitoring for ${domain}`);
        console.log(`Interval: ${config.monitoring.interval / 1000} seconds`);
        console.log(`Queries: ${queries.join(', ')}`);

        await this.runMonitoring(domain, queries);

        this.intervalId = setInterval(async () => {
            await this.runMonitoring(domain, queries);
        }, config.monitoring.interval);
    }

    async runMonitoring(domain, queries) {
        const timestamp = new Date().toISOString();
        console.log(`\n[${timestamp}] Running monitoring cycle...`);

        const results = await this.monitor.monitorDomain(domain, queries);
        const summary = this.monitor.getSummary(results);

        this.results.push({
            timestamp,
            domain,
            queries,
            results,
            summary
        });

        this.saveResults();
        this.logSummary(summary);
    }

    saveResults() {
        if (config.output.json) {
            const data = {
                lastUpdate: new Date().toISOString(),
                totalCycles: this.results.length,
                history: this.results.slice(-10) // Keep last 10 cycles
            };
            fs.writeFileSync(config.output.jsonFile, JSON.stringify(data, null, 2));
        }
    }

    logSummary(summary) {
        if (config.output.console) {
            console.log(`Found: ${summary.foundCount}/${summary.totalSearches} (${(summary.successRate * 100).toFixed(1)}%)`);
            console.log(`Errors: ${summary.errorCount}`);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('Monitoring stopped');
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            totalCycles: this.results.length,
            lastRun: this.results.length > 0 ? this.results[this.results.length - 1].timestamp : null
        };
    }
}

module.exports = { SearchLinkScheduler };