#include "Dashboard.h"
#include <iostream>
#include <iomanip>
#include <string>
#include <limits>
#include <algorithm>
#include <vector>
#include <utility>

#ifdef _WIN32
  #include <windows.h>
  static void sleepMs(int ms) { Sleep(ms); }
#else
  #include <unistd.h>
  static void sleepMs(int ms) { usleep(ms * 1000); }
#endif

// ──────────────────────────── ANSI helpers ──────────────────────────────────
#define RESET   "\033[0m"
#define BOLD    "\033[1m"
#define RED     "\033[31m"
#define GREEN   "\033[32m"
#define YELLOW  "\033[33m"
#define BLUE    "\033[34m"
#define MAGENTA "\033[35m"
#define CYAN    "\033[36m"
#define WHITE   "\033[37m"

// ──────────────────────────── Constructor / Destructor ──────────────────────
Dashboard::Dashboard() {
    graph     = new NetworkGraph();
    simulator = new MalwareSimulator(graph);
    analyzer  = new SecurityAnalyzer(graph);
}

Dashboard::~Dashboard() {
    delete simulator;
    delete analyzer;
    delete graph;
}

// ──────────────────────────── UI helpers ────────────────────────────────────
void Dashboard::clearScreen() const {
#ifdef _WIN32
    system("cls");
#else
    system("clear");
#endif
}

void Dashboard::printSeparator(char c, int width) const {
    std::cout << CYAN;
    for (int i = 0; i < width; ++i) std::cout << c;
    std::cout << RESET << "\n";
}

void Dashboard::loadingAnimation(const std::string& msg, int ms) const {
    const char frames[] = {'|', '/', '-', '\\'};
    int steps = ms / 100;
    for (int i = 0; i < steps; ++i) {
        std::cout << "\r" << CYAN << "[" << frames[i % 4] << "] " << RESET << msg << std::flush;
        sleepMs(100);
    }
    std::cout << "\r" << GREEN << "[+] " << RESET << msg << " Done.\n";
}

void Dashboard::printBanner() const {
    std::cout << CYAN << BOLD;
    std::cout << "============================================================\n";
    std::cout << "  __   ___   _ _     _   _ _____ _____                     \n";
    std::cout << "  \\ \\ / / | | | |   | \\ | | ____|_   _|                    \n";
    std::cout << "   \\ V /| | | | |   |  \\| |  _|   | |                      \n";
    std::cout << "    | | | |_| | |___| |\\  | |___  | |                      \n";
    std::cout << "    |_|  \\___/|_____|_| \\_|_____| |_|                      \n";
    std::cout << "                                                            \n";
    std::cout << "         N E T   A N A L Y Z E R   v1.0                    \n";
    std::cout << "      Malware Propagation Simulation Tool                  \n";
    std::cout << "============================================================\n";
    std::cout << RESET;
}

void Dashboard::printDeviceTable() const {
    const auto& devs = graph->getAllDevices();
    if (devs.empty()) {
        std::cout << YELLOW << "  No devices in the network.\n" << RESET;
        return;
    }

    // Sort by id for stable display
    std::vector<std::pair<int, Device*> > sorted(devs.begin(), devs.end());
    std::sort(sorted.begin(), sorted.end(),
              [](const std::pair<int,Device*>& a, const std::pair<int,Device*>& b){
                  return a.first < b.first;
              });

    std::cout << "\n";
    printSeparator('-', 72);
    std::cout << BOLD
              << std::left
              << std::setw(6)  << "  ID"
              << std::setw(20) << "Name"
              << std::setw(12) << "Type"
              << std::setw(12) << "Status"
              << std::setw(8)  << "Conn."
              << std::setw(8)  << "Risk"
              << RESET << "\n";
    printSeparator('-', 72);

    for (size_t i = 0; i < sorted.size(); ++i) {
        int id = sorted[i].first;
        Device* dev = sorted[i].second;
        std::string color = dev->getStatusColor();
        std::cout << color
                  << std::left
                  << std::setw(6)  << ("  " + std::to_string(id))
                  << std::setw(20) << dev->getName()
                  << std::setw(12) << dev->getType()
                  << std::setw(12) << dev->getStatusString()
                  << std::setw(8)  << dev->getConnectionCount()
                  << std::fixed << std::setprecision(1)
                  << dev->getRiskScore()
                  << RESET << "\n";
    }
    printSeparator('-', 72);
    std::cout << "  Total devices: " << devs.size()
              << " | Connections: " << graph->connectionCount() << "\n\n";
}

void Dashboard::printConnectionList() const {
    const auto& devs = graph->getAllDevices();
    if (devs.empty()) { std::cout << YELLOW << "  No devices.\n" << RESET; return; }

    std::cout << BOLD << "\n  Network Connections:\n" << RESET;
    printSeparator('-', 50);

    bool any = false;
    for (auto& entry : devs) {
        int id = entry.first;
        Device* dev = entry.second;
        for (int nb : graph->getNeighbors(id)) {
            if (nb > id) {
                Device* nbDev = graph->getDevice(nb);
                std::cout << "  [" << id << "] " << dev->getName()
                          << " <---> [" << nb << "] "
                          << (nbDev ? nbDev->getName() : "?") << "\n";
                any = true;
            }
        }
    }
    if (!any) std::cout << YELLOW << "  No connections defined.\n" << RESET;
    printSeparator('-', 50);
}

// ──────────────────────────── Demo Network ──────────────────────────────────
void Dashboard::loadDemoNetwork() {
    loadingAnimation("Building demo network topology...", 1200);

    int fw  = graph->addDevice("Firewall-01",  "Firewall");
    int r1  = graph->addDevice("Router-Core",  "Router");
    int srv = graph->addDevice("WebServer-01", "Server");
    int db  = graph->addDevice("DB-Server",    "Server");
    int pc1 = graph->addDevice("PC-Alice",     "PC");
    int pc2 = graph->addDevice("PC-Bob",       "PC");
    int pc3 = graph->addDevice("PC-Charlie",   "PC");
    int iot = graph->addDevice("IoT-Sensor",   "IoT");

    graph->addConnection(fw,  r1);
    graph->addConnection(r1,  srv);
    graph->addConnection(r1,  db);
    graph->addConnection(r1,  pc1);
    graph->addConnection(r1,  pc2);
    graph->addConnection(srv, db);
    graph->addConnection(pc1, pc3);
    graph->addConnection(pc2, iot);
    graph->addConnection(iot, pc3);

    graph->getDevice(fw)->setStatus(DeviceStatus::PROTECTED);
    graph->getDevice(db)->setStatus(DeviceStatus::PROTECTED);
    graph->getDevice(iot)->setStatus(DeviceStatus::VULNERABLE);

    graph->refreshConnectionCounts();

    std::cout << GREEN << "\n[+] Demo network loaded: 8 devices, 9 connections.\n" << RESET;
    std::cout << YELLOW << "[!] Firewall-01 and DB-Server are PROTECTED.\n" << RESET;
    std::cout << YELLOW << "[!] IoT-Sensor is VULNERABLE.\n" << RESET;
}

// ──────────────────────────── Sub-menu: Devices ─────────────────────────────
void Dashboard::menuManageDevices() {
    while (true) {
        std::cout << "\n" << CYAN << BOLD << "  [ Device Management ]\n" << RESET;
        printSeparator('-', 40);
        std::cout << "  1. List all devices\n";
        std::cout << "  2. Add device\n";
        std::cout << "  3. Remove device\n";
        std::cout << "  4. Set device status\n";
        std::cout << "  0. Back\n";
        printSeparator('-', 40);
        std::cout << "  Choice: ";

        int choice;
        std::cin >> choice;
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

        if (choice == 0) break;

        if (choice == 1) {
            printDeviceTable();

        } else if (choice == 2) {
            std::string name, type;
            std::cout << "  Device name: "; std::getline(std::cin, name);
            std::cout << "  Device type (PC/Server/Router/IoT/Firewall): ";
            std::getline(std::cin, type);
            int id = graph->addDevice(name, type);
            std::cout << GREEN << "  [+] Added device ID " << id << ": " << name << RESET << "\n";

        } else if (choice == 3) {
            printDeviceTable();
            std::cout << "  Enter device ID to remove: ";
            int id; std::cin >> id;
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            if (graph->removeDevice(id))
                std::cout << GREEN << "  [+] Device " << id << " removed.\n" << RESET;
            else
                std::cout << RED << "  [-] Device not found.\n" << RESET;

        } else if (choice == 4) {
            printDeviceTable();
            std::cout << "  Device ID: ";
            int id; std::cin >> id;
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            Device* dev = graph->getDevice(id);
            if (!dev) { std::cout << RED << "  [-] Device not found.\n" << RESET; continue; }

            std::cout << "  Status options:\n";
            std::cout << "    1. SAFE\n    2. PROTECTED\n    3. VULNERABLE\n    4. INFECTED\n";
            std::cout << "  Choice: ";
            int s; std::cin >> s;
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            switch (s) {
                case 1: dev->setStatus(DeviceStatus::SAFE);      break;
                case 2: dev->setStatus(DeviceStatus::PROTECTED);  break;
                case 3: dev->setStatus(DeviceStatus::VULNERABLE); break;
                case 4: dev->setStatus(DeviceStatus::INFECTED);   break;
                default: std::cout << RED << "  Invalid.\n" << RESET; continue;
            }
            graph->refreshConnectionCounts();
            std::cout << GREEN << "  [+] Status updated.\n" << RESET;
        }
    }
}

// ──────────────────────────── Sub-menu: Connections ─────────────────────────
void Dashboard::menuManageConnections() {
    while (true) {
        std::cout << "\n" << CYAN << BOLD << "  [ Connection Management ]\n" << RESET;
        printSeparator('-', 40);
        std::cout << "  1. List all connections\n";
        std::cout << "  2. Add connection\n";
        std::cout << "  3. Remove connection\n";
        std::cout << "  4. Show BFS traversal\n";
        std::cout << "  5. Show DFS traversal\n";
        std::cout << "  6. Shortest infection path\n";
        std::cout << "  0. Back\n";
        printSeparator('-', 40);
        std::cout << "  Choice: ";

        int choice;
        std::cin >> choice;
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

        if (choice == 0) break;

        if (choice == 1) {
            printConnectionList();

        } else if (choice == 2) {
            printDeviceTable();
            std::cout << "  From device ID: ";
            int a; std::cin >> a;
            std::cout << "  To device ID  : ";
            int b; std::cin >> b;
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            if (graph->addConnection(a, b))
                std::cout << GREEN << "  [+] Connection " << a << " <--> " << b << " added.\n" << RESET;
            else
                std::cout << RED << "  [-] Failed. Check device IDs.\n" << RESET;

        } else if (choice == 3) {
            printConnectionList();
            std::cout << "  From device ID: ";
            int a; std::cin >> a;
            std::cout << "  To device ID  : ";
            int b; std::cin >> b;
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            if (graph->removeConnection(a, b))
                std::cout << GREEN << "  [+] Connection removed.\n" << RESET;
            else
                std::cout << RED << "  [-] Connection not found.\n" << RESET;

        } else if (choice == 4 || choice == 5) {
            printDeviceTable();
            std::cout << "  Start device ID: ";
            int src; std::cin >> src;
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            std::vector<int> order = (choice == 4) ? graph->bfs(src) : graph->dfs(src);
            if (order.empty()) { std::cout << RED << "  [-] Invalid device.\n" << RESET; continue; }

            std::cout << CYAN << ((choice == 4) ? "  BFS" : "  DFS") << " traversal order:\n" << RESET;
            for (int i = 0; i < (int)order.size(); ++i) {
                Device* d = graph->getDevice(order[i]);
                std::cout << "    Step " << (i+1) << ": [" << order[i] << "] "
                          << (d ? d->getName() : "?") << "\n";
            }

        } else if (choice == 6) {
            printDeviceTable();
            std::cout << "  Source device ID     : ";
            int src; std::cin >> src;
            std::cout << "  Destination device ID: ";
            int dst; std::cin >> dst;
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

            std::vector<int> path = graph->shortestPath(src, dst);
            if (path.empty()) {
                std::cout << RED << "  [-] No path found between " << src << " and " << dst << ".\n" << RESET;
            } else {
                std::cout << CYAN << "  Shortest infection path (" << (path.size()-1) << " hops):\n" << RESET;
                for (int i = 0; i < (int)path.size(); ++i) {
                    Device* d = graph->getDevice(path[i]);
                    std::cout << "    [" << path[i] << "] " << (d ? d->getName() : "?");
                    if (i + 1 < (int)path.size()) std::cout << "  -->  ";
                }
                std::cout << "\n";
            }
        }
    }
}

// ──────────────────────────── Sub-menu: Simulation ──────────────────────────
void Dashboard::menuSimulation() {
    while (true) {
        std::cout << "\n" << RED << BOLD << "  [ Malware Simulation ]\n" << RESET;
        printSeparator('-', 40);
        std::cout << "  1. Start infection (choose patient zero)\n";
        std::cout << "  2. Spread one BFS step\n";
        std::cout << "  3. Run full BFS spread (auto)\n";
        std::cout << "  4. Risk-based targeted attack step\n";
        std::cout << "  5. Show infection waves\n";
        std::cout << "  6. View network status\n";
        std::cout << "  7. Reset simulation (cure all devices)\n";
        std::cout << "  0. Back\n";
        printSeparator('-', 40);
        std::cout << "  Choice: ";

        int choice;
        std::cin >> choice;
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

        if (choice == 0) break;

        if (choice == 1) {
            printDeviceTable();
            std::cout << "  Select patient zero device ID: ";
            int id; std::cin >> id;
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

            if (simulator->startInfection(id)) {
                Device* d = graph->getDevice(id);
                std::string dname = d ? d->getName() : std::to_string(id);
                loadingAnimation("Deploying malware on " + dname + "...", 800);
                std::cout << RED << "  [!] INFECTION STARTED on device " << id << "!\n" << RESET;
            } else {
                std::cout << RED << "  [-] Cannot infect device. It may be PROTECTED or invalid.\n" << RESET;
            }

        } else if (choice == 2) {
            if (!simulator->isStarted()) {
                std::cout << YELLOW << "  [!] Start infection first (option 1).\n" << RESET;
                continue;
            }
            std::vector<int> wave = simulator->spreadStep();
            if (wave.empty()) {
                std::cout << YELLOW << "  [=] No new infections. Spread complete.\n" << RESET;
            } else {
                std::cout << RED << "  [!] Step " << simulator->getStepCount()
                          << " - Newly infected:\n" << RESET;
                for (int i = 0; i < (int)wave.size(); ++i) {
                    Device* d = graph->getDevice(wave[i]);
                    std::cout << "      -> [" << wave[i] << "] " << (d ? d->getName() : "?") << "\n";
                }
            }

        } else if (choice == 3) {
            if (!simulator->isStarted()) {
                std::cout << YELLOW << "  [!] Start infection first (option 1).\n" << RESET;
                continue;
            }
            loadingAnimation("Simulating full malware spread...", 1500);
            simulator->runFullSpread();
            std::cout << RED << "  [!] Spread complete in " << simulator->getStepCount()
                      << " steps.\n" << RESET;
            printDeviceTable();

        } else if (choice == 4) {
            if (!simulator->isStarted()) {
                std::cout << YELLOW << "  [!] Start infection first (option 1).\n" << RESET;
                continue;
            }
            std::vector<int> attacked = simulator->riskBasedAttackStep();
            if (attacked.empty()) {
                std::cout << YELLOW << "  [=] No vulnerable targets reachable.\n" << RESET;
            } else {
                for (int i = 0; i < (int)attacked.size(); ++i) {
                    Device* d = graph->getDevice(attacked[i]);
                    std::cout << RED << "  [!] High-risk attack: [" << attacked[i] << "] "
                              << (d ? d->getName() : "?") << " INFECTED!\n" << RESET;
                }
            }

        } else if (choice == 5) {
            const std::vector<std::vector<int> >& waves = simulator->getInfectionWaves();
            if (waves.empty()) {
                std::cout << YELLOW << "  No infection data yet.\n" << RESET;
            } else {
                std::cout << CYAN << "  Infection Wave Log:\n" << RESET;
                for (int w = 0; w < (int)waves.size(); ++w) {
                    std::cout << "  Wave " << w << ": ";
                    for (int i = 0; i < (int)waves[w].size(); ++i) {
                        int id = waves[w][i];
                        Device* d = graph->getDevice(id);
                        std::cout << "[" << id << "] " << (d ? d->getName() : "?") << "  ";
                    }
                    std::cout << "\n";
                }
            }

        } else if (choice == 6) {
            printDeviceTable();

        } else if (choice == 7) {
            for (auto& entry : graph->getAllDevices()) {
                if (entry.second->getStatus() == DeviceStatus::INFECTED)
                    entry.second->setStatus(DeviceStatus::SAFE);
            }
            simulator->reset();
            graph->refreshConnectionCounts();
            std::cout << GREEN << "  [+] All infected devices cured. Simulation reset.\n" << RESET;
        }
    }
}

// ──────────────────────────── Sub-menu: Analysis ────────────────────────────
void Dashboard::menuAnalysis() {
    while (true) {
        std::cout << "\n" << MAGENTA << BOLD << "  [ Security Analysis ]\n" << RESET;
        printSeparator('-', 40);
        std::cout << "  1. Analyze risks\n";
        std::cout << "  2. Generate & display report\n";
        std::cout << "  3. Save report to file\n";
        std::cout << "  4. Most vulnerable device\n";
        std::cout << "  0. Back\n";
        printSeparator('-', 40);
        std::cout << "  Choice: ";

        int choice;
        std::cin >> choice;
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

        if (choice == 0) break;

        if (choice == 1) {
            loadingAnimation("Scanning network for vulnerabilities...", 1000);
            analyzer->analyzeRisks();
            std::cout << GREEN << "  [+] Risk analysis complete.\n" << RESET;

        } else if (choice == 2) {
            analyzer->analyzeRisks();
            SecurityReport report = analyzer->generateReport();
            analyzer->printReport(report);
            printDeviceTable();

        } else if (choice == 3) {
            analyzer->analyzeRisks();
            SecurityReport report = analyzer->generateReport();
            std::string fname = "report_" + report.timestamp.substr(0, 10) + ".txt";
            for (size_t i = 0; i < fname.size(); ++i)
                if (fname[i] == ':' || fname[i] == ' ') fname[i] = '_';
            analyzer->saveReport(report, fname);

        } else if (choice == 4) {
            int id = analyzer->getMostVulnerableDevice();
            if (id == -1) {
                std::cout << GREEN << "  [+] No vulnerable devices found!\n" << RESET;
            } else {
                Device* d = graph->getDevice(id);
                std::cout << YELLOW << "  [!] Most vulnerable: [" << id << "] "
                          << (d ? d->getName() : "?")
                          << "  Risk: " << (d ? d->getRiskScore() : 0.0)
                          << "\n" << RESET;
            }
        }
    }
}

// ──────────────────────────── Main event loop ────────────────────────────────
void Dashboard::run() {
    clearScreen();
    printBanner();
    std::cout << "\n" << GREEN << "  Welcome to VulnNet Analyzer!\n" << RESET;
    std::cout << "  Simulate malware propagation across network devices.\n\n";

    while (true) {
        printSeparator('=', 60);
        std::cout << BOLD << CYAN << "  MAIN MENU\n" << RESET;
        printSeparator('-', 60);
        std::cout << "  1. " << GREEN   << "Load Demo Network"       << RESET << "\n";
        std::cout << "  2. " << CYAN    << "Manage Devices"          << RESET << "\n";
        std::cout << "  3. " << CYAN    << "Manage Connections"      << RESET << "\n";
        std::cout << "  4. " << RED     << "Run Malware Simulation"  << RESET << "\n";
        std::cout << "  5. " << MAGENTA << "Security Analysis"       << RESET << "\n";
        std::cout << "  6. " << WHITE   << "View Network Overview"   << RESET << "\n";
        std::cout << "  0. " << YELLOW  << "Exit"                    << RESET << "\n";
        printSeparator('=', 60);
        std::cout << "  Enter choice: ";

        int choice;
        if (!(std::cin >> choice)) {
            std::cin.clear();
            std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
            continue;
        }
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');

        switch (choice) {
            case 1: loadDemoNetwork();       break;
            case 2: menuManageDevices();     break;
            case 3: menuManageConnections(); break;
            case 4: menuSimulation();        break;
            case 5: menuAnalysis();          break;
            case 6:
                printDeviceTable();
                printConnectionList();
                break;
            case 0:
                std::cout << CYAN << "\n  Goodbye. Stay secure!\n" << RESET;
                return;
            default:
                std::cout << RED << "  Invalid option.\n" << RESET;
        }
    }
}
