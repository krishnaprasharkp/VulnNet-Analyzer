#include "Device.h"
#include <algorithm>

Device::Device(int id, const std::string& name, const std::string& type)
    : id(id), name(name), type(type),
      status(DeviceStatus::SAFE), connectionCount(0), riskScore(0.0) {}

int Device::getId() const { return id; }
std::string Device::getName() const { return name; }
std::string Device::getType() const { return type; }
DeviceStatus Device::getStatus() const { return status; }
int Device::getConnectionCount() const { return connectionCount; }
double Device::getRiskScore() const { return riskScore; }

void Device::setStatus(DeviceStatus s) { status = s; }
void Device::setConnectionCount(int c) { connectionCount = c; }

void Device::calculateRiskScore() {
    // Base risk from connection count (more connections = higher exposure)
    double base = std::min(connectionCount * 10.0, 60.0);

    // Status modifiers
    if (status == DeviceStatus::INFECTED)   base += 40.0;
    else if (status == DeviceStatus::VULNERABLE) base += 20.0;
    else if (status == DeviceStatus::PROTECTED)  base -= 30.0;

    riskScore = std::max(0.0, std::min(base, 100.0));
}

std::string Device::getStatusString() const {
    switch (status) {
        case DeviceStatus::SAFE:        return "SAFE";
        case DeviceStatus::INFECTED:    return "INFECTED";
        case DeviceStatus::PROTECTED:   return "PROTECTED";
        case DeviceStatus::VULNERABLE:  return "VULNERABLE";
    }
    return "UNKNOWN";
}

std::string Device::getStatusColor() const {
    // ANSI escape codes
    switch (status) {
        case DeviceStatus::SAFE:        return "\033[32m"; // green
        case DeviceStatus::INFECTED:    return "\033[31m"; // red
        case DeviceStatus::PROTECTED:   return "\033[34m"; // blue
        case DeviceStatus::VULNERABLE:  return "\033[33m"; // yellow
    }
    return "\033[0m";
}
