#pragma once
#include "NetworkGraph.h"
#include "MalwareSimulator.h"
#include "SecurityAnalyzer.h"
#include <string>

class Dashboard {
private:
    NetworkGraph* graph;
    MalwareSimulator* simulator;
    SecurityAnalyzer* analyzer;

    // UI helpers
    void printBanner() const;
    void printSeparator(char c = '-', int width = 60) const;
    void printDeviceTable() const;
    void printConnectionList() const;
    void clearScreen() const;
    void loadingAnimation(const std::string& msg, int ms = 800) const;

    // Sub-menus
    void menuManageDevices();
    void menuManageConnections();
    void menuSimulation();
    void menuAnalysis();

    // Demo
    void loadDemoNetwork();

public:
    Dashboard();
    ~Dashboard();

    void run();  // main event loop
};

