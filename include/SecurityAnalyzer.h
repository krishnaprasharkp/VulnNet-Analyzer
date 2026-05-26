#pragma once
#include "NetworkGraph.h"
#include <string>
#include <vector>

struct SecurityReport {
    int totalDevices;
    int infectedCount;
    int safeCount;
    int protectedCount;
    int vulnerableCount;
    double networkRiskScore;       // 0-100
    std::string riskLevel;         // LOW / MEDIUM / HIGH / CRITICAL
    std::vector<int> highRiskIds;  // devices with risk > 70
    std::string timestamp;
};

class SecurityAnalyzer {
private:
    NetworkGraph* graph;

    double computeNetworkRisk() const;

public:
    explicit SecurityAnalyzer(NetworkGraph* g);

    // Recalculate risk scores for all devices
    void analyzeRisks();

    // Generate a full report
    SecurityReport generateReport() const;

    // Save report to file in reports/ directory
    void saveReport(const SecurityReport& report, const std::string& filename) const;

    // Print report to terminal
    void printReport(const SecurityReport& report) const;

    // Return the most vulnerable device id (-1 if none)
    int getMostVulnerableDevice() const;
};
