import { useState, useEffect, useCallback, useRef } from 'react';

export type RoadData = {
  name: string;
  speed: number; // km/h
  density: number; // %
};

export type ChartDataPoint = {
  time: string;
  "Akyempim Speed": number;
  "Akyempim Density": number;
  "Atuabo Speed": number;
  "Atuabo Density": number;
  "Teberebie Speed": number;
  "Teberebie Density": number;
};

export type IncidentAlert = {
  id: string;
  type: "Blockage" | "Damaged Car" | "Red Light Run";
  address: string;
  road: string;
  delay: number; // minutes
  timestamp: string;
  isNew: boolean;
};

export type PenaltyRecord = {
  id: string;
  carNumber: string;
  type: string;
  location: string;
  timestamp: string;
  fineAmount: number;
};

export type AuditLogRecord = {
  id: string;
  date: string;
  timestamp: string;
  action: string;
  carNumber: string;
  details: string;
  hash: string;
};


const ROADS = ["Akyempim", "Atuabo", "Teberebie"];
const ROAD_ADDRESSES: Record<string, string[]> = {
  "Akyempim": ["Junction 1", "Market Area", "Central Route"],
  "Atuabo": ["North Gate", "Gas Plant Road", "Coastal Highway"],
  "Teberebie": ["Mine Access Road", "Village Square", "South Checkpoint"]
};

export function useTrafficSimulation() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [alerts, setAlerts] = useState<IncidentAlert[]>([]);
  const [globalStats, setGlobalStats] = useState({
    avgSpeed: 0,
    avgCongestion: 0,
    activeDelays: 0,
    totalIncidents: 0,
  });
  const [penalties, setPenalties] = useState<PenaltyRecord[]>([]);
  const [junctionCounts, setJunctionCounts] = useState<Record<string, number>>({
    "Akyempim": 150,
    "Atuabo": 320,
    "Teberebie": 85
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [simulatedTimeStr, setSimulatedTimeStr] = useState<string>("00:00:00");
  const simulatedTimeRef = useRef(new Date());

  const triggerIncident = useCallback((targetRoad?: string) => {
    const type = Math.random() > 0.5 ? "Blockage" : "Damaged Car";
    const delay = Math.floor(Math.random() * (45 - 10 + 1) + 10);
    const road = targetRoad || ROADS[Math.floor(Math.random() * ROADS.length)];
    const addresses = ROAD_ADDRESSES[road];
    const address = addresses[Math.floor(Math.random() * addresses.length)];
    const timestamp = simulatedTimeRef.current.toLocaleTimeString('en-US', { hour12: false });
    
    const newAlert: IncidentAlert = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      address,
      road,
      delay,
      timestamp,
      isNew: true
    };

    setAlerts(prev => {
      const updated = [newAlert, ...prev].slice(0, 5);
      
      setGlobalStats(gs => ({
        ...gs,
        totalIncidents: gs.totalIncidents + 1,
        activeDelays: Math.round((gs.activeDelays * prev.length + delay) / (prev.length + 1))
      }));
      
      return updated;
    });

    setTimeout(() => {
      setAlerts(currentAlerts => 
        currentAlerts.map(a => a.id === newAlert.id ? { ...a, isNew: false } : a)
      );
    }, 2000);
  }, []);

  const clearIncidents = useCallback(() => {
    setAlerts([]);
    setGlobalStats(gs => ({ ...gs, activeDelays: 0, totalIncidents: 0 }));
  }, []);

  useEffect(() => {
    // Initial data generation
    const initialChartData: ChartDataPoint[] = [];
    let initialAvgSpeed = 0;
    let initialAvgCongestion = 0;
    simulatedTimeRef.current = new Date();
    setSimulatedTimeStr(simulatedTimeRef.current.toLocaleTimeString('en-US', { hour12: false }));

    for (let i = 0; i < 10; i++) {
      // Go back i minutes
      const pastTime = new Date(simulatedTimeRef.current.getTime() - (10 - i) * 60000);
      const point: any = { time: pastTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) };
      let totalSpd = 0;
      let totalDen = 0;
      ROADS.forEach(road => {
        const speed = Math.floor(Math.random() * (80 - 20 + 1) + 20);
        const density = Math.floor(Math.random() * (95 - 10 + 1) + 10);
        point[`${road} Speed`] = speed;
        point[`${road} Density`] = density;
        totalSpd += speed;
        totalDen += density;
      });
      initialChartData.push(point as ChartDataPoint);
      if (i === 9) {
        initialAvgSpeed = totalSpd / ROADS.length;
        initialAvgCongestion = totalDen / ROADS.length;
      }
    }
    setChartData(initialChartData);
    setGlobalStats(prev => ({
      ...prev,
      avgSpeed: Math.round(initialAvgSpeed),
      avgCongestion: Math.round(initialAvgCongestion)
    }));

    // Simulation Loop (1 real second = 1 simulation minute)
    const interval = setInterval(() => {
      // Advance simulated time by 1 minute
      simulatedTimeRef.current = new Date(simulatedTimeRef.current.getTime() + 60000);
      const newTimeStr = simulatedTimeRef.current.toLocaleTimeString('en-US', { hour12: false });
      setSimulatedTimeStr(newTimeStr);

      // 1. Update Roads
      setChartData(prevData => {
        const nowFormatted = simulatedTimeRef.current.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const newPoint: any = { time: nowFormatted };
        
        let currentTotalSpd = 0;
        let currentTotalDen = 0;
        
        // We need the current alerts to affect speed in the simulation data
        setAlerts(currentAlerts => {
          ROADS.forEach(road => {
            const hasIncident = currentAlerts.some(a => a.road === road);
            const speed = hasIncident 
              ? Math.floor(Math.random() * 15)
              : Math.floor(Math.random() * (80 - 40 + 1) + 40);
            
            const density = hasIncident
              ? Math.floor(Math.random() * (95 - 80 + 1) + 80)
              : Math.floor(Math.random() * (50 - 10 + 1) + 10);
              
            newPoint[`${road} Speed`] = speed;
            newPoint[`${road} Density`] = density;
            currentTotalSpd += speed;
            currentTotalDen += density;
          });
          return currentAlerts;
        });

        setGlobalStats(prev => ({
          ...prev,
          avgSpeed: Math.round(currentTotalSpd / ROADS.length),
          avgCongestion: Math.round(currentTotalDen / ROADS.length)
        }));

        const newData = [...prevData, newPoint as ChartDataPoint];
        if (newData.length > 10) newData.shift();
        return newData;
      });

      // Update junction vehicle counts smoothly
      setJunctionCounts(prev => {
        const newCounts = { ...prev };
        ROADS.forEach(road => {
          // fluctuate count by -5 to +15 vehicles per minute
          const change = Math.floor(Math.random() * 20) - 5; 
          newCounts[road] = Math.max(0, newCounts[road] + change);
        });
        return newCounts;
      });

      // 2. Random Alerts (10% chance per simulation minute / real second)
      if (Math.random() < 0.10) {
        triggerIncident();
      }

      // 3. Random Penalties (5% chance per simulation minute)
      if (Math.random() < 0.05) {
        const timestamp = simulatedTimeRef.current.toLocaleTimeString('en-US', { hour12: false });
        const road = ROADS[Math.floor(Math.random() * ROADS.length)];
        const location = ROAD_ADDRESSES[road][Math.floor(Math.random() * ROAD_ADDRESSES[road].length)];
        // Generate random license plate e.g. ABC-1234
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const carNumber = `${letters.charAt(Math.floor(Math.random()*26))}${letters.charAt(Math.floor(Math.random()*26))}${letters.charAt(Math.floor(Math.random()*26))}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const newPenalty: PenaltyRecord = {
          id: Math.random().toString(36).substr(2, 9),
          carNumber,
          type: "Red Light Run",
          location,
          timestamp,
          fineAmount: 150
        };

        setPenalties(prev => [newPenalty, ...prev].slice(0, 50)); // Keep last 50

        // Create immutable audit log
        const generateFakeHash = () => {
          return '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
        };
        
        const newAuditLog: AuditLogRecord = {
          id: newPenalty.id,
          date: simulatedTimeRef.current.toLocaleDateString('en-US'),
          timestamp: timestamp,
          action: "PENALTY_ISSUED",
          carNumber: carNumber,
          details: `Red Light Violation @ ${location} - GHc ${newPenalty.fineAmount} Fine`,
          hash: generateFakeHash()
        };

        setAuditLogs(prev => [newAuditLog, ...prev]); // Never slice, immutable growing log

        // Also spawn a brief visual alert for it without adding to global stats 'totalIncidents'
        const newAlert: IncidentAlert = {
          id: newPenalty.id,
          type: "Red Light Run",
          address: newPenalty.location,
          road,
          delay: 0,
          timestamp,
          isNew: true
        };

        setAlerts(prev => {
          const updated = [newAlert, ...prev].slice(0, 5);
          return updated;
        });

        setTimeout(() => {
          setAlerts(currentAlerts => 
            currentAlerts.map(a => a.id === newAlert.id ? { ...a, isNew: false } : a)
          );
        }, 2000);
      }
    }, 1000); // Accelerated: Every 1 second

    return () => clearInterval(interval);
  }, [triggerIncident]);

  return { chartData, alerts, globalStats, roads: ROADS, triggerIncident, clearIncidents, simulatedTimeStr, penalties, junctionCounts, auditLogs };
}
