const { SearchLinkMonitor } = require('./searchPlatforms');
const fs = require('fs');

class CompetitorAnalyzer {
    constructor() {
        this.monitor = new SearchLinkMonitor();
    }

    async compareCompetitors(targetDomain, competitors, queries) {
        const allDomains = [targetDomain, ...competitors];
        const comparisonResults = {};

        console.log(`Comparing ${targetDomain} against ${competitors.length} competitors`);
        console.log(`Domains: ${allDomains.join(', ')}`);
        console.log(`Queries: ${queries.join(', ')}`);
        console.log("-".repeat(60));

        for (const domain of allDomains) {
            console.log(`\nAnalyzing ${domain}...`);
            const results = await this.monitor.monitorDomain(domain, queries);
            const summary = this.monitor.getSummary(results);

            comparisonResults[domain] = {
                domain,
                results,
                summary,
                isTarget: domain === targetDomain
            };

            console.log(`  Found: ${summary.foundCount}/${summary.totalSearches} (${(summary.successRate * 100).toFixed(1)}%)`);
        }

        return this.generateComparisonReport(comparisonResults, targetDomain);
    }

    generateComparisonReport(results, targetDomain) {
        const domains = Object.keys(results);
        const targetData = results[targetDomain];

        const report = {
            timestamp: new Date().toISOString(),
            targetDomain,
            competitors: domains.filter(d => d !== targetDomain),
            analysis: {
                targetPerformance: targetData.summary,
                competitorPerformance: {},
                platformAnalysis: {},
                recommendations: []
            }
        };

        domains.forEach(domain => {
            if (domain !== targetDomain) {
                report.analysis.competitorPerformance[domain] = results[domain].summary;
            }
        });

        const platforms = targetData.results.map(r => r.platform);
        [...new Set(platforms)].forEach(platform => {
            const platformData = {
                target: { found: 0, total: 0 },
                competitors: {}
            };

            domains.forEach(domain => {
                const platformResults = results[domain].results.filter(r => r.platform === platform);
                const found = platformResults.filter(r => r.found).length;
                const total = platformResults.length;

                if (domain === targetDomain) {
                    platformData.target = { found, total };
                } else {
                    platformData.competitors[domain] = { found, total };
                }
            });

            report.analysis.platformAnalysis[platform] = platformData;
        });

        this.generateRecommendations(report);

        return report;
    }

    generateRecommendations(report) {
        const targetRate = report.analysis.targetPerformance.successRate;
        const competitorRates = Object.values(report.analysis.competitorPerformance)
            .map(p => p.successRate);
        const avgCompetitorRate = competitorRates.reduce((a, b) => a + b, 0) / competitorRates.length;

        if (targetRate < avgCompetitorRate) {
            report.analysis.recommendations.push({
                type: 'performance',
                priority: 'high',
                message: `Target domain visibility (${(targetRate * 100).toFixed(1)}%) is below competitor average (${(avgCompetitorRate * 100).toFixed(1)}%)`
            });
        }

        Object.entries(report.analysis.platformAnalysis).forEach(([platform, data]) => {
            const targetFound = data.target.found;
            const competitorFound = Object.values(data.competitors).map(c => c.found);
            const maxCompetitorFound = Math.max(...competitorFound);

            if (targetFound < maxCompetitorFound) {
                report.analysis.recommendations.push({
                    type: 'platform',
                    priority: 'medium',
                    message: `Low visibility on ${platform} compared to competitors`
                });
            }
        });
    }

    async saveReport(report, filename = 'competitor_analysis.json') {
        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        console.log(`\nReport saved to ${filename}`);
    }
}

module.exports = { CompetitorAnalyzer };
