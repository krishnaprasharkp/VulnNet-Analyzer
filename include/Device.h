#pragma once
#include <string>

enum class DeviceStatus {
    SAFE,
    INFECTED,
    PROTECTED,
    VULNERABLE
};

class Device {
private:
    int id;
    std::string name;
    std::string type;       // e.g. "Server", "PC", "Router"
    DeviceStatus status;
    int connectionCount;    // updated by NetworkGraph
    double riskScore;

public:
    Device(int id, const std::string& name, const std::string& type);

    // Getters
    int getId() const;
    std::string getName() const;
    std::string getType() const;
    DeviceStatus getStatus() const;
    int getConnectionCount() const;
    double getRiskScore() const;

    // Setters / mutators
    void setStatus(DeviceStatus s);
    void setConnectionCount(int c);
    void calculateRiskScore();   // based on connections and status

    // Utility
    std::string getStatusString() const;
    std::string getStatusColor() const;  // ANSI color codes
};
