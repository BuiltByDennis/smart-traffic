"use client";

import { useState, useEffect } from "react";
import { 
  Activity, 
  BarChart3, 
  Car, 
  Settings, 
  AlertTriangle, 
  Clock,
  Menu,
  ActivitySquare,
  Siren,
  Route,
  Play,
  XCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTrafficSimulation, IncidentAlert } from "@/hooks/useTrafficSimulation";

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const ROAD_STYLES = [
  { id: "Main Street", color: "bg-green-500", name: "Main St" },
  { id: "Ring Road Highway", color: "bg-blue-500", name: "Ring Rd" },
  { id: "Independence Avenue", color: "bg-orange-500", name: "Ind Ave" },
];

function LiveSimulationView({ 
  alerts, 
  triggerIncident, 
  clearIncidents 
}: { 
  alerts: IncidentAlert[], 
  triggerIncident: (road?: string) => void,
  clearIncidents: () => void 
}) {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Live Network Visualization</h2>
          <p className="text-muted-foreground text-sm">Real-time simulation of traffic flow and incidents across active routes.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => triggerIncident()}
            className="flex items-center px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors font-medium text-sm shadow-sm"
          >
            <Siren className="h-4 w-4 mr-2" />
            Trigger Blockage
          </button>
          <button 
            onClick={clearIncidents}
            className="flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors font-medium text-sm shadow-sm border border-border"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Clear All
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-muted/20 border border-border rounded-xl p-4 sm:p-8 relative overflow-hidden flex flex-col justify-around min-h-[500px]">
        {ROAD_STYLES.map((road) => {
          const hasIncident = alerts.some(a => a.road === road.id);
          return (
            <div key={road.id} className="relative w-full h-32 flex items-center group">
              {/* Road surface */}
              <div className={`absolute w-full h-full border-t-2 border-b-2 border-dashed transition-all duration-1000 ${
                hasIncident ? 'border-destructive bg-destructive/10' : 'border-border bg-card/40'
              }`}></div>
              
              {/* Road Label */}
              <div className="absolute left-4 top-2 text-xs font-mono font-bold text-muted-foreground group-hover:text-foreground transition-colors z-30 bg-background/90 px-3 py-1.5 rounded border border-border shadow-sm">
                {road.name}
              </div>

              {/* Accident Marker */}
              {hasIncident && (
                <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-destructive flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.8)] border-2 border-background">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}

              {/* Cars container */}
              <div className="absolute w-full h-full overflow-hidden">
                 {/* CSS animated cars - Forward lane */}
                 {[...Array(6)].map((_, i) => (
                   <div 
                     key={i}
                     className={`absolute h-3 w-8 rounded-[2px] shadow-sm ${road.color} top-[calc(50%-16px)] z-10 transition-all duration-700`}
                     style={{
                       left: `-50px`,
                       animation: `drive ${hasIncident ? 30 : 10 + Math.random() * 5}s linear infinite`,
                       animationDelay: `${i * (1.5 + Math.random() * 1.5)}s`,
                       animationPlayState: hasIncident ? 'paused' : 'running'
                     }}
                   ></div>
                 ))}
                 
                 {/* Opposite direction lane cars */}
                 {[...Array(6)].map((_, i) => (
                   <div 
                     key={`opp-${i}`}
                     className={`absolute h-3 w-8 rounded-[2px] shadow-sm bg-foreground/20 top-[calc(50%+4px)] z-10 transition-all duration-700`}
                     style={{
                       right: `-50px`,
                       animation: `driveReverse ${hasIncident ? 35 : 12 + Math.random() * 5}s linear infinite`,
                       animationDelay: `${i * (1.5 + Math.random() * 1.5)}s`,
                       animationPlayState: hasIncident ? 'paused' : 'running'
                     }}
                   ></div>
                 ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "live">("dashboard");
  const { chartData, alerts, globalStats, triggerIncident, clearIncidents, simulatedTimeStr } = useTrafficSimulation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <ActivitySquare className="h-6 w-6 text-accent mr-3" />
          <span className="font-mono font-bold text-lg tracking-wider uppercase">iTraffic OS</span>
        </div>
        <nav className="flex-1 py-4 space-y-2 px-3 overflow-y-auto">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center px-3 py-2.5 rounded-md font-medium text-sm transition-colors ${
              activeTab === "dashboard" 
                ? "bg-secondary text-secondary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <BarChart3 className="mr-3 h-5 w-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("live")}
            className={`w-full flex items-center px-3 py-2.5 rounded-md font-medium text-sm transition-colors ${
              activeTab === "live" 
                ? "bg-secondary text-secondary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <Route className="mr-3 h-5 w-5" />
            Live Simulation
          </button>
          <button className="w-full flex items-center px-3 py-2.5 text-muted-foreground hover:bg-secondary/50 hover:text-foreground rounded-md font-medium text-sm transition-colors">
            <Car className="mr-3 h-5 w-5" />
            Fleet Tracking
          </button>
          <button className="w-full flex items-center px-3 py-2.5 text-muted-foreground hover:bg-secondary/50 hover:text-foreground rounded-md font-medium text-sm transition-colors">
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </button>
        </nav>
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex items-center px-3 py-2 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            System Online
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold tracking-tight truncate">Command Center</h1>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="hidden sm:flex space-x-4 text-sm font-mono text-muted-foreground">
              <div className="flex items-center bg-card px-3 py-1.5 rounded-full border border-border">
                <span className="text-accent font-bold mr-2">3</span> Active Roads
              </div>
              <div className="flex items-center bg-card px-3 py-1.5 rounded-full border border-border">
                <span className="text-destructive font-bold mr-2">{globalStats.totalIncidents}</span> Total Incidents
              </div>
            </div>
            <div className="flex items-center text-sm font-mono bg-secondary px-3 py-1.5 rounded-md text-foreground border border-border">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground hidden sm:block" />
              {simulatedTimeStr} SYS
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {activeTab === "live" ? (
            <LiveSimulationView 
              alerts={alerts} 
              triggerIncident={triggerIncident} 
              clearIncidents={clearIncidents} 
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* KPI Metrics & Chart Column */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* Top 3 KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Avg Traffic Speed</CardTitle>
                      <Car className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold font-mono">{globalStats.avgSpeed || 0} <span className="text-lg text-muted-foreground">km/h</span></div>
                      <p className="text-xs text-accent font-medium mt-1">
                        Live Network Average
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow border-t-2 border-t-destructive">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Road Congestion</CardTitle>
                      <Activity className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold font-mono text-destructive">{globalStats.avgCongestion || 0}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg Density Across Nodes
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Avg Route Delay</CardTitle>
                      <Clock className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold font-mono">{globalStats.activeDelays || 0} <span className="text-lg text-muted-foreground">min</span></div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on active incidents
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Chart Area */}
                <Card className="min-h-[400px]">
                  <CardHeader>
                    <CardTitle>Live Traffic Speed Matrix</CardTitle>
                    <p className="text-sm text-muted-foreground">Real-time simulation of km/h across major network arteries.</p>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#272f42" vertical={false} />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickMargin={10} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                          itemStyle={{ fontFamily: 'var(--font-mono)' }}
                          labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="Main Street Speed" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Ring Road Highway Speed" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Independence Avenue Speed" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

              </div>

              {/* Instant Incident Alerts Column */}
              <div className="xl:col-span-1">
                <Card className="h-full border-t-4 border-t-destructive flex flex-col max-h-[calc(100vh-8rem)]">
                  <CardHeader className="shrink-0">
                    <div className="flex items-center space-x-2">
                      <Siren className="h-5 w-5 text-destructive animate-pulse" />
                      <CardTitle>Instant Incident Alerts</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto pr-4 -mr-4">
                    <div className="space-y-4">
                      {alerts.length === 0 ? (
                        <div className="p-4 flex flex-col items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-lg mt-6">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-ping mb-3"></div>
                          Waiting for incoming alerts...
                        </div>
                      ) : (
                        alerts.map(alert => (
                          <div 
                            key={alert.id}
                            className={`p-4 rounded-lg relative overflow-hidden border transition-all duration-500 ease-in-out ${
                              alert.isNew 
                                ? 'bg-destructive/30 border-destructive shadow-[0_0_15px_rgba(239,68,68,0.5)] scale-[1.02]' 
                                : alert.type === 'Blockage' 
                                  ? 'bg-destructive/10 border-destructive/20' 
                                  : 'bg-orange-500/10 border-orange-500/20'
                            }`}
                          >
                            <div className={`absolute top-0 left-0 w-1 h-full ${alert.type === 'Blockage' ? 'bg-destructive' : 'bg-orange-500'}`}></div>
                            <div className="flex justify-between items-start mb-1">
                              <span className={`font-semibold text-sm flex items-center ${alert.type === 'Blockage' ? 'text-destructive' : 'text-orange-500'}`}>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {alert.type}
                              </span>
                              <span className="text-xs font-mono text-muted-foreground">{alert.timestamp} SYS</span>
                            </div>
                            <p className="text-sm font-medium text-foreground">{alert.address}</p>
                            <div className="mt-3 flex items-center text-xs">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold mr-2 ${
                                alert.type === 'Blockage' 
                                  ? 'bg-destructive/20 text-destructive' 
                                  : 'bg-orange-500/20 text-orange-500'
                              }`}>
                                +{alert.delay} min delay
                              </span>
                              <span className="text-muted-foreground">Rerouting active</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
