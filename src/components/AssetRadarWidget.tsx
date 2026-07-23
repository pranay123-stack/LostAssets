import { useEffect, useState, useRef } from "react";
import { Radar, Shield, TrendingUp, Cpu, Award } from "lucide-react";

interface RadarPing {
  id: number;
  x: number; // radius fraction 0..1
  y: number; // angle in radians
  name: string;
  amount: number;
  state: string;
  timestamp: string;
  active: boolean;
}

const SAMPLE_PINGS = [
  { name: "Chevron Corp Dividend", amount: 45210, state: "CA" },
  { name: "Unclaimed Bank Deposit", amount: 125000, state: "NY" },
  { name: "Escheated Trust Funds", amount: 64200, state: "TX" },
  { name: "Abandoned Safe Deposit", amount: 18500, state: "FL" },
  { name: "Uncashed Stock Escrow", amount: 98000, state: "DE" },
  { name: "Treasury Bond Interest", amount: 35400, state: "NV" },
];

export function AssetRadarWidget() {
  const [pings, setPings] = useState<RadarPing[]>([]);
  const [sweepAngle, setSweepAngle] = useState(0);
  const [activeConsoleLog, setActiveConsoleLog] = useState<string[]>([]);
  const requestRef = useRef<number | null>(null);

  // Initialize randomized pings in circle
  useEffect(() => {
    const initialPings = SAMPLE_PINGS.map((sample, idx) => {
      return {
        id: idx,
        x: 0.3 + Math.random() * 0.5, // radius fraction
        y: Math.random() * Math.PI * 2, // angle
        name: sample.name,
        amount: sample.amount,
        state: sample.state,
        timestamp: new Date().toLocaleTimeString(),
        active: false,
      };
    });
    setPings(initialPings);

    // Initial console log
    setActiveConsoleLog([
      `[${new Date().toLocaleTimeString()}] RECLAIMIQ RADAR SCANNER ENGINE INITIALIZED`,
      `[${new Date().toLocaleTimeString()}] SWEEPING REGISTRY CORES...`,
    ]);
  }, []);

  // Frame tick for the scanning sweep rotation
  useEffect(() => {
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      setSweepAngle((prev) => {
        const next = (prev + (delta * 0.05)) % 360;
        
        // Check if we hit or swept over any pings
        const sweepRad = (next * Math.PI) / 180;
        
        setPings((currentPings) =>
          currentPings.map((p) => {
            // Calculate angle difference
            let diff = Math.abs(p.y - sweepRad);
            // Wrap angle difference
            if (diff > Math.PI) diff = Math.PI * 2 - diff;

            // If sweep line is close, trigger hit
            if (diff < 0.15 && !p.active) {
              // Add to terminal log
              setActiveConsoleLog((logs) => [
                `[${new Date().toLocaleTimeString()}] DETECTED: ${p.name} ($${p.amount.toLocaleString()}) in ${p.state}`,
                ...logs.slice(0, 5),
              ]);
              return { ...p, active: true, timestamp: new Date().toLocaleTimeString() };
            }
            // Fade out after sweep passes
            if (diff > 1.2 && p.active) {
              return { ...p, active: false };
            }
            return p;
          })
        );

        return next;
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800 backdrop-blur-md">
      
      {/* Left Text details matching the beautiful layout */}
      <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
        <div className="space-y-2">
          {/* LOST ASSETS */}
          <h1 className="font-serif text-3xl md:text-4xl font-semibold uppercase tracking-widest text-gold-500">
            LOST ASSETS
          </h1>
          {/* A DIVISION OF RECLAIMIQ */}
          <div className="text-[11px] font-mono font-bold tracking-widest text-orange-400 uppercase">
            A DIVISION OF RECLAIMIQ
          </div>
          
          {/* Gold horizontal separator line */}
          <div className="h-[2px] bg-gold-500/40 w-24 my-3" />
        </div>

        {/* Proprietary Tech for Asset Recovery */}
        <h2 className="font-serif text-2xl md:text-3xl text-neutral-100 font-medium leading-tight">
          Proprietary Tech<br />
          for Asset Recovery.
        </h2>

        <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
          ReclaimIQ monitors state databases, treasury reserves, and court registries in real-time, matching unclaimed property with corporate claimants using automated entity cross-referencing.
        </p>

        {/* Dynamic status feed log */}
        <div className="bg-neutral-950/80 p-4 rounded-lg border border-neutral-850/80 font-mono text-[10px] space-y-1 text-orange-400/80 h-32 overflow-y-hidden">
          <div className="flex items-center justify-between border-b border-neutral-850 pb-1 mb-1 text-[9px] uppercase tracking-wider text-neutral-500 font-bold">
            <span>Core Registry Telemetry</span>
            <span className="text-emerald-400 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ACTIVE SCAN
            </span>
          </div>
          {activeConsoleLog.map((log, idx) => (
            <div key={idx} className="truncate select-none">
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Right Circular Radar Scope Component */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center py-4 relative">
        <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-full border border-neutral-800 bg-[#010e17]/80 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(0,229,242,0.04)]">
          
          {/* Fine Grid Pattern backdrop */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ 
                 backgroundImage: "radial-gradient(circle, #00e5f2 1px, transparent 1px)", 
                 backgroundSize: "16px 16px" 
               }} 
          />

          {/* Concentric rings */}
          <div className="absolute w-[80%] h-[80%] rounded-full border border-neutral-800/60" />
          <div className="absolute w-[60%] h-[60%] rounded-full border border-neutral-800/40" />
          <div className="absolute w-[40%] h-[40%] rounded-full border border-neutral-800/30" />
          <div className="absolute w-[20%] h-[20%] rounded-full border border-neutral-800/20" />

          {/* Crosshair lines */}
          <div className="absolute w-full h-[1px] bg-neutral-800/50" />
          <div className="absolute h-full w-[1px] bg-neutral-800/50" />
          
          {/* Diagonals */}
          <div className="absolute w-full h-[1px] bg-neutral-800/20 rotate-45" />
          <div className="absolute w-full h-[1px] bg-neutral-800/20 -rotate-45" />

          {/* Rotating sweep line */}
          <div 
            className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent to-orange-400/80 origin-left pointer-events-none"
            style={{ transform: `rotate(${sweepAngle - 90}deg)` }}
          >
            {/* Glowing sweep end point */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_10px_#00e5f2]" />
          </div>

          {/* Radar target ping dots */}
          {pings.map((ping) => {
            // Polar coordinates to Cartesian relative to center
            const radX = 140 * ping.x * Math.cos(ping.y);
            const radY = 140 * ping.x * Math.sin(ping.y);

            return (
              <div
                key={ping.id}
                className="absolute transition-opacity duration-300 pointer-events-auto cursor-pointer group"
                style={{
                  transform: `translate(${radX}px, ${radY}px)`,
                }}
              >
                {/* Ping Hit point (gold box/aqua dot combination matching image style) */}
                <div className={`relative w-2.5 h-2.5 flex items-center justify-center transition-all ${
                  ping.active ? "scale-125" : "scale-100"
                }`}>
                  {/* Outer coordinate tracking box if active */}
                  <div className={`absolute w-4 h-4 border transition-all ${
                    ping.active 
                      ? "border-orange-500/80 scale-100 animate-spin" 
                      : "border-neutral-700/0 scale-50 group-hover:border-orange-500/40"
                  }`} 
                       style={{ animationDuration: "3s" }} 
                  />
                  
                  {/* Small gold dot core */}
                  <div className={`w-1.5 h-1.5 rounded-sm transition-all ${
                    ping.active 
                      ? "bg-orange-400 shadow-[0_0_8px_#00e5f2] scale-110" 
                      : "bg-neutral-600 group-hover:bg-orange-300"
                  }`} />
                </div>

                {/* Popover Hover tooltip details */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-neutral-950/95 border border-neutral-800 text-[10px] rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
                  <div className="font-bold text-neutral-100">{ping.name}</div>
                  <div className="flex items-center justify-between gap-4 mt-0.5 font-mono text-orange-400">
                    <span>${ping.amount.toLocaleString()}</span>
                    <span className="text-neutral-500">[{ping.state}]</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Center glowing transponder core */}
          <div className="absolute w-3.5 h-3.5 rounded-full bg-orange-500 border border-neutral-900 shadow-[0_0_12px_#00e5f2]" />
        </div>

        {/* Active telemetry badge */}
        <div className="mt-4 flex items-center gap-4 text-[10px] font-mono text-neutral-400 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
            <span>Telemetry Locked</span>
          </div>
          <div>•</div>
          <div>6 Direct Matches Located</div>
        </div>
      </div>

    </div>
  );
}
