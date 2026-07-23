import { WebSocket } from "ws";
import Database from "better-sqlite3";

// Defines the hermes context logic for dealing with websocket commands
export class HermesAgentHandler {
  private db: Database.Database;
  private activeWorkers: number = 2;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public handleConnection(ws: WebSocket) {
    ws.send(JSON.stringify({ type: 'system', data: 'Connected to Hermes Backend. Authentication required...\r\n' }));
    
    // Auto authenticate for dev purposes
    setTimeout(() => {
      ws.send(JSON.stringify({ type: 'system', data: 'Authentication bypassed for dev.\r\nWelcome to Hermes Control Terminal.\r\nhermes> ' }));
    }, 500);

    ws.on('message', async (message) => {
      const data = message.toString().trim();
      if (!data) {
        ws.send(JSON.stringify({ type: 'response', data: '\r\nhermes> ' }));
        return;
      }
      
      console.log('Received from terminal:', data);
      
      const args = data.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      const cmd = args[0]?.toLowerCase();

      try {
        if (cmd === 'help') {
          ws.send(JSON.stringify({ 
            type: 'response', 
            data: '\r\nAvailable commands:\r\n  search "owner name" [state]\r\n  sql "SELECT * FROM scraped_records LIMIT 5"\r\n  scrape [state]\r\n  prepare-claim [id]\r\n  status\r\nhermes> ' 
          }));
        } else if (cmd === 'status') {
          const countStmt = this.db.prepare("SELECT COUNT(*) as count FROM scraped_records");
          const recordCount = countStmt.get() as { count: number };
          
          ws.send(JSON.stringify({ 
            type: 'response', 
            data: `\r\nHermes Agent Status: ONLINE\r\nActive Workers: ${this.activeWorkers}\r\nLocal Database Records: ${recordCount.count}\r\nPending Claims: 0\r\nhermes> ` 
          }));
        } else if (cmd === 'search') {
          const owner = args[1]?.replace(/"/g, '');
          const state = args[2]?.replace(/"/g, '');
          
          if (!owner) {
             ws.send(JSON.stringify({ type: 'response', data: '\r\nUsage: search "owner name" [state]\r\nhermes> ' }));
             return;
          }

          ws.send(JSON.stringify({ type: 'response', data: `\r\nInitiating registry scan for: ${owner}${state ? ` in ${state}` : ''}...\r\n` }));
          
          let query = "SELECT * FROM scraped_records WHERE (first_name || ' ' || last_name) LIKE ? OR company LIKE ?";
          let queryParams: any[] = [`%${owner}%`, `%${owner}%`];
          
          if (state) {
            query += " AND state = ?";
            queryParams.push(state.toUpperCase());
          }
          
          query += " LIMIT 5";
          
          setTimeout(() => {
            const results = this.db.prepare(query).all(...queryParams) as any[];
            if (results.length === 0) {
               ws.send(JSON.stringify({ type: 'response', data: 'Scan complete. No matches found.\r\nhermes> ' }));
            } else {
               let out = `Scan complete. Found ${results.length} matches (limited to 5):\r\n`;
               results.forEach(r => {
                 out += `  [ID: ${r.id}] ${r.first_name} ${r.last_name} | State: ${r.state} | Amount: $${r.amount} | Source: ${r.company}\r\n`;
               });
               ws.send(JSON.stringify({ type: 'response', data: out + 'hermes> ' }));
            }
          }, 800);
        } else if (cmd === 'sql') {
          const query = data.substring(4).trim().replace(/^"|"$/g, '');
          if (!query) {
             ws.send(JSON.stringify({ type: 'response', data: '\r\nUsage: sql "SELECT * FROM table"\r\nhermes> ' }));
             return;
          }
          ws.send(JSON.stringify({ type: 'response', data: `\r\nExecuting query...\r\n` }));
          
          setTimeout(() => {
             try {
                if (query.toUpperCase().startsWith("SELECT")) {
                  const results = this.db.prepare(query).all() as any[];
                  ws.send(JSON.stringify({ type: 'response', data: JSON.stringify(results.slice(0, 10), null, 2).replace(/\n/g, '\r\n') + '\r\n(Limited display to 10 rows)\r\nhermes> ' }));
                } else {
                  const result = this.db.prepare(query).run();
                  ws.send(JSON.stringify({ type: 'response', data: `Query executed. Changes: ${result.changes}\r\nhermes> ` }));
                }
             } catch (err: any) {
                ws.send(JSON.stringify({ type: 'response', data: `SQL Error: ${err.message}\r\nhermes> ` }));
             }
          }, 300);
        } else if (cmd === 'scrape') {
          const state = (args[1] || 'Unknown').replace(/"/g, '').toUpperCase();
          ws.send(JSON.stringify({ type: 'response', data: `\r\n[Worker] Initializing automated scraper for ${state} unclaimed property portal...\r\n` }));
          this.activeWorkers++;
          setTimeout(() => {
            ws.send(JSON.stringify({ type: 'system', data: `\r\n[Worker] Connecting to ${state} portal (Simulated)...\r\n` }));
          }, 1000);
          setTimeout(() => {
            ws.send(JSON.stringify({ type: 'system', data: `[Worker] Bypass complete. Navigating...\r\n` }));
          }, 2500);
          setTimeout(() => {
            this.activeWorkers--;
            ws.send(JSON.stringify({ type: 'system', data: `[Worker] Scrape failed: Rate limit detected. Retrying with proxy later.\r\nhermes> ` }));
          }, 4000);
        } else if (cmd === 'prepare-claim') {
           const id = args[1];
           if (!id) {
             ws.send(JSON.stringify({ type: 'response', data: '\r\nUsage: prepare-claim [id]\r\nhermes> ' }));
             return;
           }
           ws.send(JSON.stringify({ type: 'response', data: `\r\nGenerating claim package for record ID ${id}...\r\n` }));
           setTimeout(() => {
             ws.send(JSON.stringify({ type: 'response', data: `Claim package generation started. Check /admin/claims in 2 minutes.\r\nhermes> ` }));
           }, 1200);
        } else {
          ws.send(JSON.stringify({ type: 'response', data: `\r\nCommand not found: ${cmd}\r\nType 'help' for a list of commands.\r\nhermes> ` }));
        }
      } catch (err: any) {
        ws.send(JSON.stringify({ type: 'response', data: `\r\nError executing command: ${err.message}\r\nhermes> ` }));
      }
    });
  }
}
