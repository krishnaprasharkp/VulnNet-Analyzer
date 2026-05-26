<h1 align="center" style="font-family:Montserrat; font-size:120px; font-weight:700; color:white;">
  VulnNet Analyzer
</h1>

<h3 align="center">
  <img 
    src="https://readme-typing-svg.herokuapp.com?font=Montserrat&weight=500&size=28&duration=3000&pause=1000&color=FFFFFF&center=true&vCenter=true&width=800&lines=Cybersecurity+Network+Simulation+Platform" 
    alt="Typing SVG" 
  />
</h3>

---

*C++ malware propagation engine · React real-time dashboard · Graph algorithms*

---

## What Is This?

VulnNet Analyzer models how malware spreads across a network of interconnected
devices — the same way real worms like WannaCry propagate hop-by-hop through
vulnerable machines.

It has two independently functional layers:

| Layer | What it does |
|---|---|
| **C++ CLI Engine** | Builds a network graph, runs BFS/DFS/risk-based infection algorithms, scores device risk, generates reports |
| **React Dashboard** | Full browser UI — login screen, live network graph, simulation, threat intelligence, security terminal |

> Built as a portfolio project demonstrating practical **Data Structures & Algorithms**, **OOP**, and **full-stack development** in a cybersecurity context.

---

## Highlights

- **Graph-based network model** — adjacency list with `unordered_map`/`unordered_set` for O(1) lookups
- **Three infection modes** — BFS wave spread, DFS traversal, and priority-queue risk-based targeting
- **Interactive React UI** — draggable SVG network graph, live fake IDS/firewall log stream, donut and bar charts, cybersecurity-style login screen
- **Zero extra dependencies** — charts built with raw SVG, force layout in pure JS, no D3 or recharts

---

## Features

### C++ Core Engine

| Feature | Details |
|---|---|
| Device management | Add/remove PCs, Servers, Routers, IoT devices dynamically |
| Connection management | Undirected graph edges; duplicate prevention |
| BFS infection spread | Wave-by-wave malware propagation using a queue |
| DFS traversal | Iterative depth-first search with an explicit stack |
| Risk-based attack | Max-heap priority queue targets the highest-risk neighbor first |
| Protected devices | Firewall/protected nodes permanently block infection |
| Shortest path | BFS-based unweighted shortest infection path between any two devices |
| Risk scoring | Per-device score based on connection degree and vulnerability status |
| Security report | Full summary (counts, risk level, high-risk list) saved to `reports/` |
| Demo network | One-command 12-device pre-built topology |
| Color terminal UI | ANSI-colored menus, progress indicators, loading animations |

### React Dashboard

| Feature | Details |
|---|---|
| Login screen | Boot terminal typing animation → credential form → "ACCESS GRANTED" |
| Dashboard | Stat cards, threat meter (0–100), status breakdown, alert feed |
| Network Health Chart | SVG donut chart — Safe / Protected / Vulnerable / Infected split |
| Device Risk Chart | Ranked bar chart of top device risk scores |
| Threat Intelligence | Active infection count, primary vector, most exposed device, spread paths |
| Network Graph | SVG force-directed layout — **draggable nodes**, animated infection dots, hover tooltips |
| Simulation | BFS and risk-based modes, step-by-step or auto-run with adjustable speed |
| Spread Timeline | Mini sparkline chart tracking infection count per simulation step |
| Security Terminal | Live fake IDS/IPS/firewall log stream — filter by type, pause/resume |
| Device Manager | Add/remove devices, mark protected or vulnerable, manage connections |
| Security Report | Risk analysis with exportable `.txt` report |

---

## Tech Stack

| Area | Technology | Why |
|---|---|---|
| **Core engine** | C++14 | Low-level control, demonstrates systems programming and DSA |
| **UI framework** | React 18 | Component model fits the graph+state update pattern cleanly |
| **Build tool** | Vite 4 | Fast HMR, minimal config |
| **Styling** | Tailwind CSS 3 | Utility-first — rapid dark-theme iteration without custom CSS bloat |
| **Icons** | Lucide React | Consistent, tree-shakeable icon set |
| **Charts** | Pure SVG | Zero extra dependencies; full control over animations |
| **Graph layout** | Custom JS force simulation | O(n²) repulsion + spring edges — no D3 needed at this node count |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VulnNet Analyzer                      │
│                                                          │
│  ┌──────────────────────┐   ┌────────────────────────┐  │
│  │   C++ CLI Engine      │   │   React Dashboard       │  │
│  │  (native binary)      │   │  (browser, localhost)   │  │
│  │                       │   │                         │  │
│  │  NetworkGraph         │   │  LoginScreen            │  │
│  │  ├─ adjList (hashmap) │   │  Dashboard              │  │
│  │  └─ devices (hashmap) │   │  ├─ DonutChart (SVG)    │  │
│  │                       │   │  ├─ RiskBarChart (SVG)  │  │
│  │  MalwareSimulator     │   │  └─ ThreatIntelPanel    │  │
│  │  ├─ BFS (queue)       │   │  NetworkGraph (SVG)     │  │
│  │  └─ PQ (max-heap)     │   │  ├─ Force layout (JS)   │  │
│  │                       │   │  └─ Drag & drop nodes   │  │
│  │  SecurityAnalyzer     │   │  SimulationPanel        │  │
│  │  └─ Risk scoring      │   │  └─ SpreadTimeline      │  │
│  │                       │   │  TerminalPanel          │  │
│  │  Dashboard (TUI)      │   │  └─ Live fake IDS logs  │  │
│  └──────────────────────┘   └────────────────────────┘  │
│                                                          │
│  Both layers implement the same algorithms independently  │
│  (JS port in frontend/src/utils/)                        │
└─────────────────────────────────────────────────────────┘
```

---

## DSA Concepts Demonstrated

| Concept | Implementation | File |
|---|---|---|
| **Graph (Adjacency List)** | `unordered_map<int, unordered_set<int>>` — undirected, O(1) edge check | `NetworkGraph.h/cpp` |
| **BFS (Queue)** | Malware wave spread + shortest path | `MalwareSimulator.cpp`, `NetworkGraph.cpp` |
| **DFS (Stack)** | Iterative depth-first traversal | `NetworkGraph.cpp` |
| **Priority Queue (Max-Heap)** | Risk-based attack always targets the highest-risk uninfected neighbor | `MalwareSimulator.cpp` |
| **Hash Map** | `unordered_map` — O(1) device lookup by ID | `NetworkGraph.h` |
| **Hash Set** | `unordered_set` — O(1) neighbor lookup, visited tracking in BFS/DFS | `NetworkGraph.h` |
| **Force-Directed Graph** | O(n²) spring-repulsion simulation for SVG layout | `NetworkGraph.jsx` |

---

## OOP Principles

| Principle | Where |
|---|---|
| **Encapsulation** | All classes expose clean public interfaces; internals are private |
| **Abstraction** | `NetworkGraph` hides adjacency-list details behind `addDevice`, `bfs`, etc. |
| **Composition** | `Dashboard` owns `NetworkGraph`, `MalwareSimulator`, `SecurityAnalyzer` |
| **Enum class** | `DeviceStatus` — scoped, type-safe device states |
| **RAII** | `NetworkGraph` and `Dashboard` destructors clean up heap-allocated `Device*` objects |

---

## Project Structure

```
VulnNet/
│
├── src/                        # C++ source files
│   ├── main.cpp                # Entry point
│   ├── Device.cpp
│   ├── NetworkGraph.cpp        # Graph data structure
│   ├── MalwareSimulator.cpp    # BFS + priority-queue infection engine
│   ├── SecurityAnalyzer.cpp    # Risk scoring + report generation
│   └── Dashboard.cpp           # Terminal UI / main controller
│
├── include/                    # C++ headers
│   ├── Device.h
│   ├── NetworkGraph.h
│   ├── MalwareSimulator.h
│   ├── SecurityAnalyzer.h
│   └── Dashboard.h
│
├── frontend/                   # React dashboard
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx             # Root state, routing, simulation loop
│       ├── main.jsx
│       ├── index.css           # Global styles + CSS animations
│       ├── components/
│       │   ├── LoginScreen.jsx     # Boot animation + auth UI
│       │   ├── Sidebar.jsx         # Navigation + live risk indicator
│       │   ├── Dashboard.jsx       # Stat cards + charts + threat intel
│       │   ├── NetworkGraph.jsx    # Draggable SVG force-directed graph
│       │   ├── SimulationPanel.jsx # Sim controls + timeline chart + log
│       │   ├── TerminalPanel.jsx   # Live fake IDS/firewall log stream
│       │   ├── DeviceManager.jsx   # Device/connection CRUD
│       │   └── SecurityReport.jsx  # Risk report + .txt export
│       ├── data/
│       │   └── demoNetwork.js      # 12-device pre-built topology
│       └── utils/
│           ├── malwareSimulation.js  # JS port of C++ BFS/risk spread
│           └── riskAnalysis.js       # JS port of C++ risk scoring
│
├── reports/                    # Auto-generated security reports (git-ignored)
│   └── .gitkeep
│
├── docs/
│   └── screenshots/            # Add screenshots here
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| g++ / MinGW | GCC 6+ | Windows: [MinGW-w64](https://winlibs.com/) · Linux: `sudo apt install g++` |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| npm | 8+ | Comes with Node.js |
| Git | Any | [git-scm.com](https://git-scm.com/) |

---

### 1 · Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/VulnNet.git
cd VulnNet
```

---

### 2 · Build & run the C++ engine

```bash
# Compile (C++14 required)
g++ src/*.cpp -Iinclude -std=c++14 -o VulnNetAnalyzer

# Run
./VulnNetAnalyzer          # Linux / macOS
VulnNetAnalyzer.exe        # Windows
```

**Quick start inside the CLI:**
```
1 → Load Demo Network       (builds a 12-device topology)
4 → Run Malware Simulation  (pick a patient-zero device)
   → Start Infection
   → Spread Step (repeat to watch it propagate)
5 → Security Analysis       (view risk scores + generate report)
```

---

### 3 · Run the React dashboard

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

```
1. Click "Load Demo Network" in the header
2. Explore the Dashboard — charts update as infection spreads
3. Go to Network Graph — drag nodes, watch animated infection dots
4. Open Simulation — pick patient zero, choose BFS or Risk-Based, hit Run
5. Visit Security Terminal for the live IDS/firewall log stream
6. Check Security Report and export as .txt
```

---

## Sample CLI Session

```
══════════════════════════════════════
        VULNNET ANALYZER v1.0
══════════════════════════════════════

  MAIN MENU
  1. Load Demo Network
  2. Manage Devices
  3. Manage Connections
  4. Run Malware Simulation
  5. Security Analysis
  0. Exit

  Enter choice: 1
  [+] Building demo network topology... Done.
  [+] Demo loaded: 12 devices, 13 connections.

  Enter choice: 4
  ── MALWARE SIMULATION ──
  Select patient zero: 9 (IoT Hub)
  [!] INFECTION STARTED on IoT Hub

  → Spread step 1
  [!] Newly infected: IoT Sensor A, IoT Sensor B

  → Spread step 2
  [!] Newly infected: Gateway Router

  → Spread step 3
  [!] Newly infected: Web Server, Mail Server, Admin Workstation

  [✓] Firewall (PROTECTED) — blocked.
  [✓] Database Server (PROTECTED) — blocked.
```

---

## Future Improvements

- [ ] **Weighted edges** — model network bandwidth / link reliability
- [ ] **Dijkstra's algorithm** — shortest weighted path for targeted attacks
- [ ] **Live network scanning** — integrate with real topology data (read-only)
- [ ] **Animated infection replay** — record and replay a spread sequence
- [ ] **Export graph as JSON** — save/load custom network topologies
- [ ] **Multi-vector attack** — multiple patient-zero nodes simultaneously
- [ ] **Dark/light theme toggle** in the React dashboard
- [ ] **Unit tests** — Google Test for C++ engine; Vitest for React components
- [ ] **CI/CD** — GitHub Actions: compile C++, build frontend, run lint

---

## Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Author

<div align="center">

Built by **krishnaprasharkp** and **Namya Dutta** as an educational portfolio project.  
Demonstrates C++ · OOP · Practical DSA · React · Full-stack development.

*If this helped you — ⭐ a star is appreciated!*

</div>
