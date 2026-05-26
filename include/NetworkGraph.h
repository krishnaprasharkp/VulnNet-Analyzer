#pragma once
#include "Device.h"
#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <string>

class NetworkGraph {
private:
    // adjacency list: device_id -> set of neighbor ids
    std::unordered_map<int, std::unordered_set<int>> adjList;

    // device store: id -> Device object
    std::unordered_map<int, Device*> devices;

    int nextId;  // auto-increment id counter

public:
    NetworkGraph();
    ~NetworkGraph();

    // Device management
    int  addDevice(const std::string& name, const std::string& type);
    bool removeDevice(int id);
    Device* getDevice(int id);
    const std::unordered_map<int, Device*>& getAllDevices() const;

    // Connection management
    bool addConnection(int from, int to);
    bool removeConnection(int from, int to);
    bool connectionExists(int from, int to) const;
    std::vector<int> getNeighbors(int id) const;

    // Graph info
    int deviceCount() const;
    int connectionCount() const;
    bool deviceExists(int id) const;

    // Update all connection counts on devices
    void refreshConnectionCounts();

    // BFS: returns visited order starting from src
    std::vector<int> bfs(int src) const;

    // DFS: returns visited order starting from src
    std::vector<int> dfs(int src) const;

    // Shortest path (BFS-based, unweighted)
    std::vector<int> shortestPath(int src, int dst) const;
};
