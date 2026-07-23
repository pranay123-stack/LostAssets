import initSqlJs, { Database, SqlJsStatic } from "sql.js";

export interface AssetRecord {
  id?: number;
  first_name?: string;
  last_name?: string;
  state?: string;
  property_type?: string;
  amount?: number;
  company?: string;
  location?: string;
  state_id?: string;
  category_id?: string;
  category_title?: string;
  sub_type?: string;
  decedent_name?: string;
  ssn_last4?: string;
  source?: string;
  scraped_at?: string;
}

export interface SqliteStats {
  totalRecords: number;
  totalValue: number;
  caRecordsCount: number;
  caTotalValue: number;
  categoryCounts: { category_id: string; count: number }[];
  lastUpdated: string | null;
  dbName: string;
  status: string;
}

const STORAGE_KEY = "ca_assets_sqlite_db_bytes";

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

/**
 * Initialize sql.js and create / restore SQLite database instance in the browser.
 */
export async function getBrowserDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!SQL) {
        SQL = await initSqlJs({
          locateFile: (file) => `https://sql.js.org/dist/${file}`,
        });
      }

      // Restore existing DB from localStorage if saved
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const binaryString = atob(savedData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          dbInstance = new SQL.Database(bytes);
        } catch (err) {
          console.warn("Failed to parse saved SQLite bytes from localStorage, creating fresh DB:", err);
          dbInstance = new SQL.Database();
        }
      } else {
        dbInstance = new SQL.Database();
      }

      // Initialize table schemas
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS scraped_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT,
          last_name TEXT,
          state TEXT,
          property_type TEXT,
          amount REAL,
          company TEXT,
          location TEXT,
          state_id TEXT,
          category_id TEXT,
          category_title TEXT,
          sub_type TEXT,
          decedent_name TEXT,
          ssn_last4 TEXT,
          source TEXT,
          scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS asset_search_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          query TEXT,
          category_filter TEXT,
          results_count INTEGER,
          searched_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Persist initial schema setup
      saveDbToStorage();
      return dbInstance;
    } catch (err) {
      console.error("Failed to initialize sql.js database:", err);
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Persist SQLite binary database to localStorage so records survive browser reloads
 */
export function saveDbToStorage(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    let binary = "";
    const len = data.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(data[i]);
    }
    const base64 = btoa(binary);
    localStorage.setItem(STORAGE_KEY, base64);
  } catch (err) {
    console.error("Failed to persist SQLite database to localStorage:", err);
  }
}

/**
 * Insert a single asset search / scraped record into in-browser SQLite DB
 */
export async function insertRecordToBrowserDb(record: AssetRecord): Promise<number> {
  const db = await getBrowserDb();
  
  const stmt = db.prepare(`
    INSERT INTO scraped_records (
      first_name, last_name, state, property_type, amount,
      company, location, state_id, category_id, category_title,
      sub_type, decedent_name, ssn_last4, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    record.first_name || "",
    record.last_name || "",
    (record.state || "CA").toUpperCase(),
    record.property_type || "Unclaimed Asset",
    Number(record.amount) || 0,
    record.company || "Unknown Custodian",
    record.location || "",
    record.state_id || `CLIENT-SQL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    record.category_id ? String(record.category_id) : "1",
    record.category_title || "State Unclaimed Property",
    record.sub_type || "Direct Asset Record",
    record.decedent_name || null,
    record.ssn_last4 || null,
    record.source || "In-Browser SQLite Hub"
  ]);

  stmt.free();

  // Retrieve last inserted row id
  const res = db.exec("SELECT last_insert_rowid() as id");
  const insertedId = res[0]?.values[0]?.[0] as number || 0;

  saveDbToStorage();
  return insertedId;
}

/**
 * Insert a batch of records into in-browser SQLite DB
 */
export async function insertBatchToBrowserDb(records: AssetRecord[]): Promise<number> {
  if (!records || records.length === 0) return 0;
  const db = await getBrowserDb();

  db.run("BEGIN TRANSACTION;");
  
  const stmt = db.prepare(`
    INSERT INTO scraped_records (
      first_name, last_name, state, property_type, amount,
      company, location, state_id, category_id, category_title,
      sub_type, decedent_name, ssn_last4, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const record of records) {
    stmt.run([
      record.first_name || "",
      record.last_name || "",
      (record.state || "CA").toUpperCase(),
      record.property_type || "Unclaimed Asset",
      Number(record.amount) || 0,
      record.company || "Unknown Custodian",
      record.location || "",
      record.state_id || `CLIENT-SQL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      record.category_id ? String(record.category_id) : "1",
      record.category_title || "State Unclaimed Property",
      record.sub_type || "Direct Asset Record",
      record.decedent_name || null,
      record.ssn_last4 || null,
      record.source || "In-Browser SQLite Hub"
    ]);
    count++;
  }

  stmt.free();
  db.run("COMMIT;");

  saveDbToStorage();
  return count;
}

/**
 * Fetch records from in-browser SQLite DB with optional filters
 */
export async function getBrowserRecords(options?: {
  state?: string;
  categoryId?: string;
  limit?: number;
  search?: string;
}): Promise<AssetRecord[]> {
  const db = await getBrowserDb();
  let sql = "SELECT * FROM scraped_records WHERE 1=1";
  const params: any[] = [];

  if (options?.state) {
    sql += " AND UPPER(state) = ?";
    params.push(options.state.toUpperCase());
  }

  if (options?.categoryId) {
    sql += " AND category_id = ?";
    params.push(String(options.categoryId));
  }

  if (options?.search) {
    sql += " AND (first_name LIKE ? OR last_name LIKE ? OR company LIKE ? OR property_type LIKE ? OR location LIKE ?)";
    const term = `%${options.search}%`;
    params.push(term, term, term, term, term);
  }

  sql += " ORDER BY id DESC";

  if (options?.limit) {
    sql += " LIMIT ?";
    params.push(options.limit);
  } else {
    sql += " LIMIT 500";
  }

  const res = db.exec(sql, params);
  if (res.length === 0) return [];

  const columns = res[0].columns;
  const values = res[0].values;

  return values.map((row) => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as AssetRecord;
  });
}

/**
 * Compute database stats from in-browser SQLite DB
 */
export async function getBrowserDbStats(): Promise<SqliteStats> {
  const db = await getBrowserDb();

  const totalRes = db.exec("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as totalValue FROM scraped_records");
  const totalCount = (totalRes[0]?.values[0]?.[0] as number) || 0;
  const totalValue = (totalRes[0]?.values[0]?.[1] as number) || 0;

  const caRes = db.exec("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as totalValue FROM scraped_records WHERE UPPER(state) = 'CA'");
  const caRecordsCount = (caRes[0]?.values[0]?.[0] as number) || 0;
  const caTotalValue = (caRes[0]?.values[0]?.[1] as number) || 0;

  const catRes = db.exec("SELECT category_id, COUNT(*) as count FROM scraped_records WHERE category_id IS NOT NULL GROUP BY category_id");
  const categoryCounts: { category_id: string; count: number }[] = [];

  if (catRes.length > 0) {
    catRes[0].values.forEach((row) => {
      categoryCounts.push({
        category_id: String(row[0]),
        count: Number(row[1])
      });
    });
  }

  const latestRes = db.exec("SELECT scraped_at FROM scraped_records ORDER BY id DESC LIMIT 1");
  const lastUpdated = latestRes[0]?.values[0]?.[0] ? String(latestRes[0].values[0][0]) : null;

  return {
    totalRecords: totalCount,
    totalValue,
    caRecordsCount,
    caTotalValue,
    categoryCounts,
    lastUpdated,
    dbName: "In-Browser SQLite (sql.js WASM)",
    status: "Active & Persisted"
  };
}

/**
 * Execute custom SQL query against in-browser SQLite DB (SELECT / PRAGMA)
 */
export async function executeBrowserSqlQuery(sql: string): Promise<{ rowCount: number; rows: any[] }> {
  const db = await getBrowserDb();
  const trimmed = sql.trim();

  if (!trimmed.toUpperCase().startsWith("SELECT") && !trimmed.toUpperCase().startsWith("PRAGMA")) {
    throw new Error("Only SELECT and PRAGMA read queries are permitted in client SQL console.");
  }

  const res = db.exec(trimmed);
  if (res.length === 0) {
    return { rowCount: 0, rows: [] };
  }

  const columns = res[0].columns;
  const values = res[0].values;
  const rows = values.map((row) => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });

  return {
    rowCount: rows.length,
    rows
  };
}

/**
 * Delete a record by ID from in-browser SQLite DB
 */
export async function deleteRecordFromBrowserDb(id: number): Promise<boolean> {
  const db = await getBrowserDb();
  db.run("DELETE FROM scraped_records WHERE id = ?", [id]);
  saveDbToStorage();
  return true;
}

/**
 * Log asset search query into asset_search_logs table
 */
export async function logSearchToBrowserDb(query: string, categoryFilter: string, resultsCount: number): Promise<void> {
  const db = await getBrowserDb();
  db.run(
    "INSERT INTO asset_search_logs (query, category_filter, results_count) VALUES (?, ?, ?)",
    [query, categoryFilter, resultsCount]
  );
  saveDbToStorage();
}

/**
 * Export all records in browser SQLite DB as CSV string
 */
export async function exportBrowserDbAsCSV(): Promise<string> {
  const records = await getBrowserRecords({ limit: 10000 });
  if (records.length === 0) {
    return "id,first_name,last_name,state,property_type,amount,company,location,state_id,category_id,scraped_at";
  }

  const headers = Object.keys(records[0]).join(",");
  const csvLines = records.map((r: any) =>
    Object.values(r)
      .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );

  return [headers, ...csvLines].join("\n");
}

/**
 * Reset / Clear the in-browser SQLite DB
 */
export async function resetBrowserDb(): Promise<void> {
  const db = await getBrowserDb();
  db.run("DELETE FROM scraped_records; DELETE FROM asset_search_logs;");
  localStorage.removeItem(STORAGE_KEY);
  saveDbToStorage();
}
