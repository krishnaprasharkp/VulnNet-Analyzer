export const demoDevices = [
  { id: 1,  name: 'Gateway Router',   type: 'Router', status: 'SAFE',       riskScore: 0 },
  { id: 2,  name: 'Firewall',         type: 'Router', status: 'PROTECTED',  riskScore: 0 },
  { id: 3,  name: 'Web Server',       type: 'Server', status: 'SAFE',       riskScore: 0 },
  { id: 4,  name: 'Database Server',  type: 'Server', status: 'PROTECTED',  riskScore: 0 },
  { id: 5,  name: 'Mail Server',      type: 'Server', status: 'SAFE',       riskScore: 0 },
  { id: 6,  name: 'Admin Workstation',type: 'PC',     status: 'SAFE',       riskScore: 0 },
  { id: 7,  name: 'Dev Station 1',    type: 'PC',     status: 'SAFE',       riskScore: 0 },
  { id: 8,  name: 'Dev Station 2',    type: 'PC',     status: 'SAFE',       riskScore: 0 },
  { id: 9,  name: 'IoT Hub',          type: 'Router', status: 'VULNERABLE', riskScore: 0 },
  { id: 10, name: 'IoT Sensor A',     type: 'IoT',    status: 'VULNERABLE', riskScore: 0 },
  { id: 11, name: 'IoT Sensor B',     type: 'IoT',    status: 'SAFE',       riskScore: 0 },
  { id: 12, name: 'Backup Server',    type: 'Server', status: 'SAFE',       riskScore: 0 },
];

export const demoConnections = [
  { from: 1,  to: 2  },  // Gateway <-> Firewall
  { from: 2,  to: 3  },  // Firewall <-> Web Server
  { from: 2,  to: 5  },  // Firewall <-> Mail Server
  { from: 2,  to: 6  },  // Firewall <-> Admin
  { from: 3,  to: 4  },  // Web Server <-> Database
  { from: 6,  to: 7  },  // Admin <-> Dev 1
  { from: 6,  to: 8  },  // Admin <-> Dev 2
  { from: 7,  to: 8  },  // Dev 1 <-> Dev 2
  { from: 1,  to: 9  },  // Gateway <-> IoT Hub
  { from: 9,  to: 10 },  // IoT Hub <-> Sensor A
  { from: 9,  to: 11 },  // IoT Hub <-> Sensor B
  { from: 4,  to: 12 },  // Database <-> Backup
  { from: 5,  to: 12 },  // Mail Server <-> Backup
];
