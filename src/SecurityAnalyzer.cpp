#include "SecurityAnalyzer.h"
#include <fstream>
#include <iostream>
#include <iomanip>
#include <ctime>
#include <algorithm>

SecurityAnalyzer::SecurityAnalyzer(NetworkGraph* g) : graph(g) {}

void SecurityAnalyzer::analyzeRisks() {
    graph->refreshConnectionCounts();
}

double SecurityAnalyzer::computeNetworkRisk() const {
    const auto& devs = graph->getAllDevices();
    if (devs.empty()) return 0.0;

    double total = 0.0;
    for (auto& entry : devs)
        total += entry.second->getRiskScore();

    return total / devs.size();
}

SecurityReport SecurityAnalyzer::generateReport() const {
    SecurityReport r;
    r.totalDevices    = 0;
    r.infectedCount   = 0;
    r.safeCount       = 0;
    r.protectedCount  = 0;
    r.vulnerableCount = 0;

    for (auto& entry : graph->getAllDevices()) {
        Device* dev = entry.second;
        r.totalDevices++;
        switch (dev->getStatus()) {
            case DeviceStatus::INFECTED:   r.infectedCount++;   break;
            case DeviceStatus::SAFE:       r.safeCount++;       break;
            case DeviceStatus::PROTECTED:  r.protectedCount++;  break;
            case DeviceStatus::VULNERABLE: r.vulnerableCount++; break;
        }
        if (dev->getRiskScore() > 70.0)
            r.highRiskIds.push_back(entry.first);
    }

    r.networkRiskScore = computeNetworkRisk();

    if      (r.networkRiskScore >= 75) r.riskLevel = "CRITICAL";
    else if (r.networkRiskScore >= 50) r.riskLevel = "HIGH";
    else if (r.networkRiskScore >= 25) r.riskLevel = "MEDIUM";
    else                               r.riskLevel = "LOW";

    std::time_t now = std::time(nullptr);
    char buf[32];
    std::strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", std::localtime(&now));
    r.timestamp = buf;

    return r;
}

void SecurityAnalyzer::saveReport(const SecurityReport& r, const std::string& filename) const {
    std::ofstream f("reports/" + filename);
    if (!f.is_open()) {
        std::cerr << "Warning: Could not open reports/" << filename << "\n";
        return;
    }

    f << "============================================================\n";
    f << "           VULNNET ANALYZER - SECURITY REPORT               \n";
    f << "============================================================\n";
    f << "Timestamp      : " << r.timestamp        << "\n";
    f << "Total Devices  : " << r.totalDevices     << "\n";
    f << "Infected       : " << r.infectedCount    << "\n";
    f << "Safe           : " << r.safeCount        << "\n";
    f << "Protected      : " << r.protectedCount   << "\n";
    f << "Vulnerable     : " << r.vulnerableCount  << "\n";
    f << "Network Risk   : " << std::fixed << std::setprecision(1)
                             << r.networkRiskScore << " / 100\n";
    f << "Risk Level     : " << r.riskLevel        << "\n";

    if (!r.highRiskIds.empty()) {
        f << "High-Risk IDs  : ";
        for (int id : r.highRiskIds) f << id << " ";
        f << "\n";
    }

    f << "------------------------------------------------------------\n";
    for (auto& entry : graph->getAllDevices()) {
        Device* dev = entry.second;
        f << "  [" << std::setw(3) << entry.first << "] "
          << std::left << std::setw(20) << dev->getName()
          << " | " << std::setw(10) << dev->getType()
          << " | " << std::setw(10) << dev->getStatusString()
          << " | Risk: " << std::fixed << std::setprecision(1)
          << dev->getRiskScore() << "\n";
    }
    f << "============================================================\n";

    std::cout << "\033[32m[+] Report saved to reports/" << filename << "\033[0m\n";
}

void SecurityAnalyzer::printReport(const SecurityReport& r) const {
    std::cout << "\n\033[36m";
    std::cout << "============================================================\n";
    std::cout << "           VULNNET ANALYZER - SECURITY REPORT               \n";
    std::cout << "============================================================\033[0m\n";
    std::cout << "  Timestamp      : " << r.timestamp        << "\n";
    std::cout << "  Total Devices  : " << r.totalDevices     << "\n";
    std::cout << "  \033[31mInfected       : " << r.infectedCount   << "\033[0m\n";
    std::cout << "  \033[32mSafe           : " << r.safeCount       << "\033[0m\n";
    std::cout << "  \033[34mProtected      : " << r.protectedCount  << "\033[0m\n";
    std::cout << "  \033[33mVulnerable     : " << r.vulnerableCount << "\033[0m\n";

    std::string riskColor = "\033[32m";
    if (r.riskLevel == "CRITICAL" || r.riskLevel == "HIGH") riskColor = "\033[31m";
    else if (r.riskLevel == "MEDIUM") riskColor = "\033[33m";

    std::cout << "  Network Risk   : " << r.networkRiskScore
              << " / 100  [" << riskColor << r.riskLevel << "\033[0m]\n";

    if (!r.highRiskIds.empty()) {
        std::cout << "  \033[33mHigh-Risk IDs  : ";
        for (int id : r.highRiskIds) std::cout << id << " ";
        std::cout << "\033[0m\n";
    }
    std::cout << "\033[36m============================================================\033[0m\n";
}

int SecurityAnalyzer::getMostVulnerableDevice() const {
    int worst = -1;
    double maxRisk = -1.0;
    for (auto& entry : graph->getAllDevices()) {
        Device* dev = entry.second;
        if (dev->getStatus() != DeviceStatus::PROTECTED
            && dev->getRiskScore() > maxRisk) {
            maxRisk = dev->getRiskScore();
            worst = entry.first;
        }
    }
    return worst;
}
