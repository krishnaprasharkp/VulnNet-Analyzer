#include "NetworkGraph.h"
#include <stack>
#include <queue>
#include <unordered_map>
#include <algorithm>

NetworkGraph::NetworkGraph() : nextId(1) {}

NetworkGraph::~NetworkGraph() {
    for (auto& entry : devices) delete entry.second;
}

int NetworkGraph::addDevice(const std::string& name, const std::string& type) {
    int id = nextId++;
    devices[id] = new Device(id, name, type);
    adjList[id] = std::unordered_set<int>();
    return id;
}

bool NetworkGraph::removeDevice(int id) {
    if (!deviceExists(id)) return false;

    for (auto& entry : adjList)
        entry.second.erase(id);

    adjList.erase(id);
    delete devices[id];
    devices.erase(id);
    refreshConnectionCounts();
    return true;
}

Device* NetworkGraph::getDevice(int id) {
    auto it = devices.find(id);
    return (it != devices.end()) ? it->second : nullptr;
}

const std::unordered_map<int, Device*>& NetworkGraph::getAllDevices() const {
    return devices;
}

bool NetworkGraph::addConnection(int from, int to) {
    if (!deviceExists(from) || !deviceExists(to)) return false;
    if (from == to) return false;
    adjList[from].insert(to);
    adjList[to].insert(from);
    refreshConnectionCounts();
    return true;
}

bool NetworkGraph::removeConnection(int from, int to) {
    if (!connectionExists(from, to)) return false;
    adjList[from].erase(to);
    adjList[to].erase(from);
    refreshConnectionCounts();
    return true;
}

bool NetworkGraph::connectionExists(int from, int to) const {
    auto it = adjList.find(from);
    if (it == adjList.end()) return false;
    return it->second.count(to) > 0;
}

std::vector<int> NetworkGraph::getNeighbors(int id) const {
    auto it = adjList.find(id);
    if (it == adjList.end()) return std::vector<int>();
    return std::vector<int>(it->second.begin(), it->second.end());
}

int NetworkGraph::deviceCount() const { return (int)devices.size(); }

int NetworkGraph::connectionCount() const {
    int total = 0;
    for (auto& entry : adjList) total += (int)entry.second.size();
    return total / 2;
}

bool NetworkGraph::deviceExists(int id) const {
    return devices.count(id) > 0;
}

void NetworkGraph::refreshConnectionCounts() {
    for (auto& entry : devices) {
        int id = entry.first;
        Device* dev = entry.second;
        dev->setConnectionCount((int)adjList[id].size());
        dev->calculateRiskScore();
    }
}

std::vector<int> NetworkGraph::bfs(int src) const {
    if (!deviceExists(src)) return std::vector<int>();

    std::vector<int> order;
    std::unordered_set<int> visited;
    std::queue<int> q;

    visited.insert(src);
    q.push(src);

    while (!q.empty()) {
        int cur = q.front(); q.pop();
        order.push_back(cur);
        const auto& neighbors = adjList.at(cur);
        for (auto nb = neighbors.begin(); nb != neighbors.end(); ++nb) {
            if (!visited.count(*nb)) {
                visited.insert(*nb);
                q.push(*nb);
            }
        }
    }
    return order;
}

std::vector<int> NetworkGraph::dfs(int src) const {
    if (!deviceExists(src)) return std::vector<int>();

    std::vector<int> order;
    std::unordered_set<int> visited;
    std::stack<int> stk;

    stk.push(src);

    while (!stk.empty()) {
        int cur = stk.top(); stk.pop();
        if (visited.count(cur)) continue;
        visited.insert(cur);
        order.push_back(cur);
        const auto& neighbors = adjList.at(cur);
        for (auto nb = neighbors.begin(); nb != neighbors.end(); ++nb)
            if (!visited.count(*nb)) stk.push(*nb);
    }
    return order;
}

std::vector<int> NetworkGraph::shortestPath(int src, int dst) const {
    if (!deviceExists(src) || !deviceExists(dst)) return std::vector<int>();
    if (src == dst) return std::vector<int>(1, src);

    std::unordered_map<int, int> parent;
    std::unordered_set<int> visited;
    std::queue<int> q;

    visited.insert(src);
    q.push(src);
    parent[src] = -1;

    while (!q.empty()) {
        int cur = q.front(); q.pop();
        if (cur == dst) {
            std::vector<int> path;
            for (int v = dst; v != -1; v = parent[v])
                path.push_back(v);
            std::reverse(path.begin(), path.end());
            return path;
        }
        const auto& neighbors = adjList.at(cur);
        for (auto nb = neighbors.begin(); nb != neighbors.end(); ++nb) {
            if (!visited.count(*nb)) {
                visited.insert(*nb);
                parent[*nb] = cur;
                q.push(*nb);
            }
        }
    }
    return std::vector<int>();
}
