import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Card } from "./ui/card";
import { Terminal as TerminalIcon, Wifi, WifiOff } from "lucide-react";

export function HermesTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [currentInput, setCurrentInput] = useState("");

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#0a0a0a',
        foreground: '#10b981', // emerald-500
        cursor: '#10b981',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[1;32mInitialize Hermes Terminal Environment...\x1b[0m');

    // Handle Window Resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    // Initialize WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/hermes`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      term.writeln('\x1b[38;5;208m[System] WebSocket connection established.\x1b[0m');
    };

    ws.onclose = () => {
      setIsConnected(false);
      term.writeln('\n\x1b[31m[System] Connection lost. Reconnect manually.\x1b[0m');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'system' || msg.type === 'response') {
          term.write(msg.data);
        }
      } catch (e) {
        term.write(event.data);
      }
    };

    // Terminal Input Handling
    term.onData(data => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const code = data.charCodeAt(0);
      if (code === 13) { // Enter
        wsRef.current.send(currentInput);
        setCurrentInput("");
      } else if (code === 127) { // Backspace
        if (currentInput.length > 0) {
          setCurrentInput(prev => prev.slice(0, -1));
          term.write('\b \b');
        }
      } else if (code < 32 || code === 127) {
        // Ignore other control characters for simple demo
      } else {
        setCurrentInput(prev => prev + data);
        term.write(data);
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, []); // Only run once on mount

  return (
    <Card className="border-neutral-800 bg-[#0e0e11] overflow-hidden shadow-2xl flex flex-col h-full min-h-[500px]">
      <div className="bg-[#1a1a1f] px-4 py-2.5 border-b border-neutral-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-mono font-bold text-neutral-300 tracking-wider">HERMES AGENT TERMINAL</span>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400 uppercase">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
              <WifiOff className="w-3 h-3 text-rose-400" />
              <span className="text-[10px] font-mono text-rose-400 uppercase">Disconnected</span>
            </div>
          )}
        </div>
      </div>
      
      <div 
        ref={terminalRef} 
        className="flex-grow w-full bg-[#0a0a0a] p-2"
        style={{ height: 'calc(100% - 45px)' }}
      />
    </Card>
  );
}
