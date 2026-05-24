#!/usr/bin/env node

const { SearchLinkMonitor } = require('./searchPlatforms');
const { SearchLinkScheduler } = require('./scheduler');
const { CompetitorAnalyzer } = require('./compare');
const fs = require('fs');

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log("Usage:");
        console.log("  node monitor.js <domain> [query1] [query2] ...          # Single run");
        console.log("  node monitor.js --watch <domain> [query1] [query2] ...  # Continuous monitoring");
        console.log("  node monitor.js --compare <domain> <competitor1> <competitor2> ... --queries <query1> <query2> ...");
        console.log("\nExamples:");
        console.log("  node monitor.js example.com 'python tutorials'");
        console.log("  node monitor.js --watch example.com 'python tutorials'");
        console.log("  node monitor.js --compare example.com competitor1.com competitor2.com --queries 'python tutorials' 'web dev'");
        process.exit(1);
    }

    if (args[0] === '--watch') {
        const domain = args[1];
        const queries = args.length > 2 ? args.slice(2) : [domain];
        
        const scheduler = new SearchLinkScheduler();
        await scheduler.start(domain, queries);
        
        process.on('SIGINT', () => {
            scheduler.stop();
            process.exit(0);
        });
        
    } else if (args[0] === '--compare') {
        const domains = [];
        const queries = [];
        let isQueryMode = false;
        
        for (let i = 1; i < args.length; i++) {
            if (args[i] === '--queries') {
                isQueryMode = true;
            } else if (isQueryMode) {
                queries.push(args[i]);
            } else {
                domains.push(args[i]);
            }
        }
        
        if (domains.length < 2) {
            console.log('Need at least 2 domains for comparison');
            process.exit(1);
        }
        
        const targetDomain = domains[0];
        const competitors = domains.slice(1);
        const searchQueries = queries.length > 0 ? queries : [targetDomain];
        
        const analyzer = new CompetitorAnalyzer();
        const report = await analyzer.compareCompetitors(targetDomain, competitors, searchQueries);
        await analyzer.saveReport(report);
        
        console.log("\n" + "=".repeat(60));
        console.log("COMPETITIVE ANALYSIS");
        console.log("=".repeat(60));
        
        console.log(`Target: ${targetDomain} - ${(report.analysis.targetPerformance.successRate * 100).toFixed(1)}% success rate`);
        
        console.log("\nCompetitors:");
        Object.entries(report.analysis.competitorPerformance).forEach(([domain, perf]) => {
            console.log(`  ${domain}: ${(perf.successRate * 100).toFixed(1)}% success rate`);
        });
        
        if (report.analysis.recommendations.length > 0) {
            console.log("\nRecommendations:");
            report.analysis.recommendations.forEach(rec => {
                console.log(`  [${rec.priority.toUpperCase()}] ${rec.message}`);
            });
        }
        
    } else {
        const domain = args[0];
        const queries = args.length > 1 ? args.slice(1) : [domain];

        console.log(`Monitoring ${domain} across AI search platforms...`);
        console.log(`Queries: ${queries.join(', ')}`);
        console.log("-".repeat(50));

        const monitor = new SearchLinkMonitor();
        const results = await monitor.monitorDomain(domain, queries);

        console.log("\n" + "=".repeat(50));
        console.log("SUMMARY");
        console.log("=".repeat(50));

        const summary = monitor.getSummary(results);

        console.log(`Total searches: ${summary.totalSearches}`);
        console.log(`Found: ${summary.foundCount}`);
        console.log(`Success rate: ${(summary.successRate * 100).toFixed(1)}%`);
        console.log(`Errors: ${summary.errorCount}`);

        console.log("\nPlatform breakdown:");
        Object.entries(summary.platformStats).forEach(([platform, stats]) => {
            const rate = stats.total > 0 ? (stats.found / stats.total * 100).toFixed(1) : 0;
            console.log(`  ${platform}: ${stats.found}/${stats.total} (${rate}%)`);
        });

        console.log("\nDetailed results saved to results.json");

        fs.writeFileSync('results.json', JSON.stringify({
            results,
            summary
        }, null, 2));
    }
}

main().catch(console.error);