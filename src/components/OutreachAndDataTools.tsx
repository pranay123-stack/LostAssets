import { useState, useEffect } from "react";
import { 
  Megaphone, Mail, Send, Database, FileText, Upload, Globe, 
  CheckCircle2, Sparkles, Copy, Check, Info, Library, Loader2, ArrowRight,
  FileCheck, RefreshCw, AlertCircle, Sparkle, Search, Briefcase, UserCheck, Layers, ArrowDownToLine, Coins
} from "lucide-react";
import { cn } from "../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ASSET_CATEGORIES_DATA } from "./SpecializedAssetSearch";
import { insertBatchToBrowserDb, AssetRecord } from "../lib/db";
import JSZip from "jszip";
import { HermesTerminal } from "./HermesTerminal";

// Full multi-state registers
const REGISTRY_STATISTICS = [
  { state: "California (CA)", activeEscheat: "11.2 Billion", difficulty: "Moderate", notaryLimit: "Over $1,000", maxCommission: "10% max limit", timeline: "90 - 180 Days" },
  { state: "Texas (TX)", activeEscheat: "4.8 Billion", difficulty: "Low (Easy)", notaryLimit: "NA - Online ID", maxCommission: "10% limit", timeline: "30 - 60 Days" },
  { state: "Florida (FL)", activeEscheat: "3.2 Billion", difficulty: "Low (Easy)", notaryLimit: "Over $5,000", maxCommission: "20% limit", timeline: "45 - 90 Days" },
  { state: "New York (NY)", activeEscheat: "17.4 Billion", difficulty: "High (Hard)", notaryLimit: "Required-All", maxCommission: "15% max limit", timeline: "120 - 240 Days" },
  { state: "Delaware (DE)", activeEscheat: "3.1 Billion", difficulty: "Moderate", notaryLimit: "Required", maxCommission: "10% limit", timeline: "90 - 150 Days" }
];

const RAW_ASSET_CATALOG = [
  { id: "ast-01", owner: "THOMSON DIGGS COMPANY", amount: 245000.00, holder: "BANK OF AMERICA CORP", type: "Commercial Checking", state: "CA" },
  { id: "ast-02", owner: "ESTHER MARIE CHEVRON", amount: 62450.00, holder: "CHEVRON CORPORATION", type: "Stock Dividend", state: "CA" },
  { id: "ast-03", owner: "LAWRENCE H PINEDA", amount: 12450.00, holder: "WELLS FARGO ADVISORS", type: "Mutual Fund", state: "CA" },
  { id: "ast-04", owner: "RAND ALLOY CORP", amount: 95300.00, holder: "EXXON MOBIL CORP", type: "Corporate Dividends", state: "TX" },
  { id: "ast-05", owner: "ESTATE OF WINIFRED GALT", amount: 189400.00, holder: "UNION BANK TRUST", type: "Estate Custody Account", state: "CA" },
  { id: "ast-06", owner: "PATRICK MCKEE ESTATE", amount: 33400.00, holder: "JP MORGAN CHASE", type: "Saving Account Balance", state: "FL" },
  { id: "ast-07", owner: "HELLEN COOPER", amount: 1540.00, holder: "FLORIDA POWER & LIGHT", type: "Utility Refund", state: "FL" },
  { id: "ast-08", owner: "REDWOOD HORIZONS INC", amount: 38700.00, holder: "SILICON VALLEY BANK", type: "Corporate Escrow", state: "CA" },
  { id: "ast-09", owner: "VANDERBILT TRUSTS", amount: 771200.00, holder: "NY DEPT OF REVENUE", type: "State Bond Yields", state: "NY" }
];

interface OutreachAndDataToolsProps {
  toolType: "campaigns" | "multistate_search" | "hermes" | "asset_db" | "import_csv";
  savedCases?: any[];
  onImportRecords?: (newRecords: any[]) => void;
  onAddCaseToSaved?: (caseData: any) => void;
}

export function OutreachAndDataTools({ toolType, savedCases = [], onImportRecords, onAddCaseToSaved }: OutreachAndDataToolsProps) {
  
  // --- CAMPAIGNS STATE ---
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [campaignTemplate, setCampaignTemplate] = useState("Individual high-value postal outreach");
  const [campaignProgress, setCampaignProgress] = useState<number | null>(null);
  const [launchedReport, setLaunchedReport] = useState<any | null>(null);

  // --- HERMES STATE ---
  const [hermesOwner, setHermesOwner] = useState("THOMSON DIGGS COMPANY");
  const [hermesAmount, setHermesAmount] = useState("245000");
  const [hermesCustodian, setHermesCustodian] = useState("BANK OF AMERICA CORP");
  const [hermesStateRef, setHermesStateRef] = useState("CA-BS-951110");
  const [hermesCopied, setHermesCopied] = useState(false);

  // --- ASSET DB STATE ---
  const [dbSearch, setDbSearch] = useState("");
  const [minAmount, setMinAmount] = useState(500);
  const [maxAmount, setMaxAmount] = useState(1000000);
  const [selectedDbAssetIds, setSelectedDbAssetIds] = useState<string[]>([]);
  const [targetCrmCaseIdDb, setTargetCrmCaseIdDb] = useState("new_db_case");
  const [customNewDbCaseName, setCustomNewDbCaseName] = useState("");
  const [dbAssignedAgent, setDbAssignedAgent] = useState("Jeff");
  const [selectedForFuzzySearch, setSelectedForFuzzySearch] = useState<any | null>(null);

  // --- IMPORT CSV STATE ---
  const [rawCSVInput, setRawCSVInput] = useState("");
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [csvPreviewError, setCsvPreviewError] = useState("");
  const [selectedImportCategoryId, setSelectedImportCategoryId] = useState<string>("auto");
  const [isBatchInserting, setIsBatchInserting] = useState<boolean>(false);
  const [batchInsertResult, setBatchInsertResult] = useState<{
    insertedCount: number;
    totalValue: number;
    categoriesMap: Record<string, number>;
    message: string;
  } | null>(null);

  // --- SQLITE DB RECORDS STATE ---
  const [sqliteRecords, setSqliteRecords] = useState<any[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [sqliteStats, setSqliteStats] = useState<any | null>(null);
  const [dbViewMode, setDbViewMode] = useState<"visual" | "sql_studio">("visual");
  const [customSql, setCustomSql] = useState<string>("SELECT id, first_name, last_name, state, property_type, amount, company, location, category_id, scraped_at FROM scraped_records ORDER BY scraped_at DESC LIMIT 50;");
  const [sqlQueryResult, setSqlQueryResult] = useState<{ rowCount: number; rows: any[] } | null>(null);
  const [sqlQueryError, setSqlQueryError] = useState<string | null>(null);
  const [isExecutingSql, setIsExecutingSql] = useState<boolean>(false);

  // --- ZIP & CSV DRAG-AND-DROP STATE ---
  const [importTab, setImportTab] = useState<"zip" | "pasted">("zip");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const clearUploadStats = () => {
    setUploadResult(null);
    setUploadError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.toLowerCase();
      if (ext.endsWith(".csv")) {
        await uploadCsvFile(file);
      } else if (ext.endsWith(".zip")) {
        await uploadZipFile(file);
      } else {
        setUploadError("Invalid file type. Please upload a valid CSV (.csv) or ZIP (.zip) file.");
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.toLowerCase();
      if (ext.endsWith(".csv")) {
        await uploadCsvFile(file);
      } else if (ext.endsWith(".zip")) {
        await uploadZipFile(file);
      } else {
        setUploadError("Invalid file type. Please upload a valid CSV (.csv) or ZIP (.zip) file.");
      }
    }
  };

  const uploadCsvFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const csvText = await file.text();
      const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      if (lines.length === 0) {
        throw new Error("Uploaded CSV file is empty.");
      }

      const firstLineLower = lines[0].toLowerCase();
      const hasHeader = firstLineLower.includes("name") || firstLineLower.includes("amount") || firstLineLower.includes("state");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const parsedRecords: AssetRecord[] = [];
      dataLines.forEach((line, idx) => {
        const cols = parseCSVLine(line);
        if (cols.length < 2) return;

        const rawName = cols[0] || "Unknown Owner";
        const parts = rawName.trim().split(/\s+/);
        const firstName = parts[0] || "Unknown";
        const lastName = parts.slice(1).join(" ") || "Owner";

        const rawAmt = String(cols[1] || "0").replace(/[\$,]/g, "").trim();
        const amount = Number(rawAmt) || 0;
        const state = (cols[2] || "CA").trim().toUpperCase();
        const propertyType = (cols[3] || "Unclaimed Asset").trim();
        const company = (cols[4] || "Unknown Custodian").trim();
        const catIdCol = cols[5] ? cols[5].trim() : undefined;
        const location = cols[6] ? cols[6].trim() : `${state} | ${company}`;
        const stateId = cols[7] ? cols[7].trim() : `CSV-${Date.now()}-${idx + 1}`;

        const rawObj = {
          first_name: firstName,
          last_name: lastName,
          name: rawName,
          property_type: propertyType,
          company,
          amount,
          state,
          category_id: catIdCol
        };

        const resolvedCat = resolveCategoryForRecord(rawObj, selectedImportCategoryId);

        parsedRecords.push({
          first_name: firstName,
          last_name: lastName,
          state,
          property_type: propertyType,
          amount,
          company,
          location,
          state_id: stateId,
          category_id: resolvedCat.id,
          category_title: resolvedCat.title,
          sub_type: propertyType,
          source: `Uploaded CSV (${file.name})`
        });
      });

      if (parsedRecords.length === 0) {
        throw new Error("No valid records found in uploaded CSV file.");
      }

      // Insert into browser WASM SQLite database
      const clientInsertedCount = await insertBatchToBrowserDb(parsedRecords);

      // Attempt server sync
      let serverInserted = clientInsertedCount;
      let serverDuplicates = parsedRecords.length - clientInsertedCount;

      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload-csv", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          serverInserted = result.recordsInserted ?? clientInsertedCount;
          serverDuplicates = result.duplicateCount ?? serverDuplicates;
        }
      } catch (serverErr) {
        console.warn("Backend CSV sync notice (WASM browser SQLite database updated):", serverErr);
      }

      setUploadResult({
        success: true,
        totalFilesProcessed: 1,
        fileNames: [file.name],
        recordsParsed: parsedRecords.length,
        recordsInserted: Math.max(clientInsertedCount, serverInserted),
        duplicateCount: serverDuplicates
      });

      await fetchRecordsFromSQLite();
      await fetchSqliteStats();
    } catch (err: any) {
      console.error("CSV Upload error:", err);
      setUploadError(err.message || "Failed to process uploaded CSV file.");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadZipFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const zip = await JSZip.loadAsync(file);
      const fileNames: string[] = [];
      const allRecords: AssetRecord[] = [];
      let totalFilesProcessed = 0;

      for (const relativePath of Object.keys(zip.files)) {
        const zipEntry = zip.files[relativePath];
        if (zipEntry.dir) continue;

        const lowerName = relativePath.toLowerCase();
        if (lowerName.endsWith(".csv") || lowerName.endsWith(".txt")) {
          const textContent = await zipEntry.async("string");
          const lines = textContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          if (lines.length > 0) {
            const firstLineLower = lines[0].toLowerCase();
            const hasHeader = firstLineLower.includes("name") || firstLineLower.includes("amount") || firstLineLower.includes("state");
            const dataLines = hasHeader ? lines.slice(1) : lines;

            dataLines.forEach((line, idx) => {
              const cols = parseCSVLine(line);
              if (cols.length < 2) return;

              const rawName = cols[0] || "Unknown Owner";
              const parts = rawName.trim().split(/\s+/);
              const firstName = parts[0] || "Unknown";
              const lastName = parts.slice(1).join(" ") || "Owner";

              const rawAmt = String(cols[1] || "0").replace(/[\$,]/g, "").trim();
              const amount = Number(rawAmt) || 0;
              const state = (cols[2] || "CA").trim().toUpperCase();
              const propertyType = (cols[3] || "Unclaimed Asset").trim();
              const company = (cols[4] || "Unknown Custodian").trim();
              const catIdCol = cols[5] ? cols[5].trim() : undefined;
              const location = cols[6] ? cols[6].trim() : `${state} | ${company}`;
              const stateId = cols[7] ? cols[7].trim() : `ZIP-${Date.now()}-${allRecords.length + 1}`;

              const resolvedCat = resolveCategoryForRecord({
                first_name: firstName, last_name: lastName, name: rawName,
                property_type: propertyType, company, amount, state, category_id: catIdCol
              }, selectedImportCategoryId);

              allRecords.push({
                first_name: firstName,
                last_name: lastName,
                state,
                property_type: propertyType,
                amount,
                company,
                location,
                state_id: stateId,
                category_id: resolvedCat.id,
                category_title: resolvedCat.title,
                sub_type: propertyType,
                source: `ZIP Sync (${relativePath})`
              });
            });
            totalFilesProcessed++;
            fileNames.push(relativePath);
          }
        } else if (lowerName.endsWith(".json")) {
          const textContent = await zipEntry.async("string");
          try {
            const parsed = JSON.parse(textContent);
            const items = Array.isArray(parsed) ? parsed : (parsed.records || parsed.items || [parsed]);
            items.forEach((r: any) => {
              const rawName = r.name || `${r.first_name || r.firstName || ''} ${r.last_name || r.lastName || ''}`.trim() || "Unknown Owner";
              const parts = rawName.split(/\s+/);
              const firstName = r.first_name || r.firstName || parts[0] || "Unknown";
              const lastName = r.last_name || r.lastName || parts.slice(1).join(" ") || "Owner";
              const state = (r.state || "CA").toUpperCase();
              const propertyType = r.property_type || r.propertyType || r.type || "Unclaimed Asset";
              const amount = Number(r.amount) || 0;
              const company = r.company || r.holder || "Unknown Custodian";
              const location = r.location || `${state} | ${company}`;
              const stateId = r.state_id || r.stateId || `ZIP-JSON-${Date.now()}-${allRecords.length + 1}`;

              const resolvedCat = resolveCategoryForRecord({
                first_name: firstName, last_name: lastName, name: rawName,
                property_type: propertyType, company, amount, state, category_id: r.category_id || r.categoryId
              }, selectedImportCategoryId);

              allRecords.push({
                first_name: firstName,
                last_name: lastName,
                state,
                property_type: propertyType,
                amount,
                company,
                location,
                state_id: stateId,
                category_id: resolvedCat.id,
                category_title: resolvedCat.title,
                sub_type: propertyType,
                source: `ZIP Sync (${relativePath})`
              });
            });
            totalFilesProcessed++;
            fileNames.push(relativePath);
          } catch (jsonErr) {
            console.warn(`Failed to parse JSON file ${relativePath} inside ZIP:`, jsonErr);
          }
        }
      }

      if (totalFilesProcessed === 0 || allRecords.length === 0) {
        throw new Error("No valid .csv or .json files found inside uploaded ZIP archive.");
      }

      // Insert into browser WASM SQLite database
      const clientInsertedCount = await insertBatchToBrowserDb(allRecords);

      // Attempt server sync
      let serverInserted = clientInsertedCount;
      let serverDuplicates = allRecords.length - clientInsertedCount;

      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload-zip", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          serverInserted = result.recordsInserted ?? clientInsertedCount;
          serverDuplicates = result.duplicateCount ?? serverDuplicates;
        }
      } catch (serverErr) {
        console.warn("Backend ZIP sync notice (WASM browser SQLite database updated):", serverErr);
      }

      setUploadResult({
        success: true,
        totalFilesProcessed,
        fileNames,
        recordsParsed: allRecords.length,
        recordsInserted: Math.max(clientInsertedCount, serverInserted),
        duplicateCount: serverDuplicates
      });

      await fetchRecordsFromSQLite();
      await fetchSqliteStats();
    } catch (err: any) {
      console.error("ZIP Upload error:", err);
      setUploadError(err.message || "Failed to decompress and sync uploaded ZIP archive.");
    } finally {
      setIsUploading(false);
    }
  };

  const fetchRecordsFromSQLite = async () => {
    setIsLoadingRecords(true);
    try {
      const res = await fetch("/api/records");
      if (res.ok) {
        const data = await res.json();
        setSqliteRecords(data);
      }
    } catch (err) {
      console.error("Failed to load SQLite records:", err);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const fetchSqliteStats = async () => {
    try {
      const res = await fetch("/api/sqlite/stats");
      if (res.ok) {
        const data = await res.json();
        setSqliteStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch SQLite stats:", err);
    }
  };

  const handleExecuteCustomSql = async (sqlToRun?: string) => {
    const query = sqlToRun || customSql;
    setIsExecutingSql(true);
    setSqlQueryError(null);
    try {
      const res = await fetch("/api/sqlite/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: query })
      });
      const data = await res.json();
      if (data.success) {
        setSqlQueryResult({ rowCount: data.rowCount, rows: data.rows });
      } else {
        setSqlQueryError(data.error || "Query failed");
      }
    } catch (err: any) {
      setSqlQueryError(err.message || "Failed to execute query.");
    } finally {
      setIsExecutingSql(false);
    }
  };

  useEffect(() => {
    fetchRecordsFromSQLite();
    fetchSqliteStats();
  }, [toolType]);

  // Campaign Simulation
  const handleLaunchCampaign = () => {
    if (!selectedCaseId) {
      alert("Please select a target Lead Case folder, or create one in the Saved Cases Workbench.");
      return;
    }
    const targetCase = savedCases.find(c => c.id === selectedCaseId);
    const caseName = targetCase ? targetCase.categoryName : "Selected Case Portfolio";

    setCampaignProgress(0);
    setLaunchedReport(null);

    const interval = setInterval(() => {
      setCampaignProgress(prev => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          setLaunchedReport({
            id: `CAMP-${Math.floor(Math.random() * 90000) + 10000}`,
            dispatchedCount: targetCase ? targetCase.assets.length : 3,
            recipientCase: caseName,
            channel: campaignTemplate.includes("postal") ? "Postal Letter" : "Professional Email",
            date: new Date().toLocaleDateString()
          });
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // --- CSV PARSING & 12 ASSET CATEGORY RESOLUTION ---
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const resolveCategoryForRecord = (rawObj: any, selectedOverride: string) => {
    // 1. Check for explicit category column in CSV row (e.g., 1..12)
    const explicitVal = rawObj.category_id || rawObj.categoryId || rawObj.category || rawObj.Category;
    if (explicitVal) {
      const num = parseInt(String(explicitVal).replace(/\D/g, ""));
      if (num >= 1 && num <= 12) {
        const match = ASSET_CATEGORIES_DATA.find(c => c.id === num);
        if (match) return { id: String(match.id), title: match.title, shortName: match.shortName };
      }
    }

    // 2. User explicit dropdown selection (1..12)
    if (selectedOverride && selectedOverride !== "auto") {
      const num = parseInt(selectedOverride);
      const match = ASSET_CATEGORIES_DATA.find(c => c.id === num);
      if (match) return { id: String(match.id), title: match.title, shortName: match.shortName };
    }

    // 3. Keyword Auto-detection based on property type, company, or owner
    const text = `${rawObj.property_type || ''} ${rawObj.type || ''} ${rawObj.company || ''} ${rawObj.holderCompany || ''} ${rawObj.name || ''}`.toLowerCase();

    if (text.includes("pension") || text.includes("pbgc") || text.includes("retirement") || text.includes("erisa") || text.includes("401k") || text.includes("annuity")) {
      return { id: "2", title: "Abandoned Pensions / PBGC Benefits", shortName: "Pensions & PBGC" };
    }
    if (text.includes("bond") || text.includes("treasury") || text.includes("savings bond") || text.includes("series e") || text.includes("series ee")) {
      return { id: "3", title: "U.S. Savings Bonds (Matured / Unredeemed)", shortName: "Savings Bonds" };
    }
    if (text.includes("insurance") || text.includes("death benefit") || text.includes("policy") || text.includes("demutualization") || text.includes("prudential")) {
      return { id: "4", title: "Life Insurance Benefits & VA Policy Funds", shortName: "Life Insurance & VA" };
    }
    if (text.includes("stock") || text.includes("dividend") || text.includes("sec") || text.includes("brokerage") || text.includes("fair fund") || text.includes("share") || text.includes("mutual fund")) {
      return { id: "5", title: "Securities, Dividends & Brokerage Residuals", shortName: "Stocks & Dividends" };
    }
    if (text.includes("safe deposit") || text.includes("vault") || text.includes("tangible") || text.includes("box") || text.includes("coin") || text.includes("jewelry")) {
      return { id: "6", title: "Safe Deposit Box Contents (Tangible Property)", shortName: "Safe Deposit Vault" };
    }
    if (text.includes("tax") || text.includes("hud") || text.includes("fha") || text.includes("irs") || text.includes("mortgage refund") || text.includes("overpayment credit")) {
      return { id: "7", title: "Tax Refunds & FHA/HUD Mortgage Refunds", shortName: "Tax & HUD Refunds" };
    }
    if (text.includes("class action") || text.includes("court") || text.includes("bankruptcy") || text.includes("pacer") || text.includes("litigation") || text.includes("tort")) {
      return { id: "8", title: "Class Action & Court / Bankruptcy Unclaimed", shortName: "Class Action & Courts" };
    }
    if (text.includes("mineral") || text.includes("royalty") || text.includes("oil") || text.includes("gas") || text.includes("drilling") || text.includes("lease")) {
      return { id: "9", title: "Mineral Rights, Oil & Gas Royalties", shortName: "Mineral & Royalties" };
    }
    if (text.includes("veteran") || text.includes("va disability") || text.includes("va pension") || text.includes("burial") || text.includes("military")) {
      return { id: "10", title: "VA Benefits & Veterans' Funds (Non-Insurance)", shortName: "VA Veterans' Funds" };
    }
    if (text.includes("utility") || text.includes("deposit") || text.includes("electric") || text.includes("telecom") || text.includes("power") || text.includes("water")) {
      return { id: "11", title: "Utility Deposits & Corporate Overpayments", shortName: "Utility & Overpayments" };
    }
    if (text.includes("probate") || text.includes("estate") || text.includes("heir") || text.includes("decedent") || text.includes("intestate") || text.includes("surrogate")) {
      return { id: "12", title: "Probate Residuals, Missing Heirs & Estates", shortName: "Probate & Heirs" };
    }

    // Default to Category 1 State Unclaimed Property
    return { id: "1", title: "State Unclaimed Property (NAUPA)", shortName: "State Unclaimed" };
  };

  const handleLoadSampleCSV = (sampleType: "multi" | "pensions" | "probate" | "unclaimed" = "multi") => {
    setBatchInsertResult(null);
    setCsvPreviewError("");

    if (sampleType === "multi") {
      setRawCSVInput(`Name, Amount, State, AssetType, Custodian, CategoryId, Location, StateId
Arthur Pendelton, 54000.00, CA, PBGC Vested Pension, Boeing ERISA Plan, 2, Long Beach CA, PBGC-2026-9012
Chevron Corp Dividends, 125000.00, CA, Stock Dividend Residue, Computershare Trust, 5, San Francisco CA, SEC-2026-8812
Estate of Harold Jenkins, 184000.00, TX, Intestate Estate Surplus, Travis County Probate Court, 12, Austin TX, PRB-TX-5510
Winifred Miller, 15200.00, FL, Matured Series E Bond, US Treasury Dept, 3, Miami FL, TR-2026-4421
Occidental Petroleum, 92400.00, CA, Suspended Mineral Royalty, Kern County Clerk, 9, Bakersfield CA, MIN-CA-0012
Dr. Marcus Vance, 8400.00, CA, FHA Mortgage Premium, HUD Financial Ops, 7, Sacramento CA, HUD-2026-1102
Pacific Gas & Electric, 3200.00, CA, Commercial Security Deposit, PG&E Utility Escrow, 11, San Jose CA, UTL-2026-7841
Pineda Family Trust, 64000.00, FL, Unclaimed Life Insurance, Prudential Financial, 4, Tampa FL, VA-LIF-9920
Sgt. Thomas Sterling, 22500.00, CA, Accrued VA Disability Escrow, VA Regional Office, 10, San Diego CA, VA-DIS-1092
Equifax Harmed Investor Fund, 41200.00, NY, Class Settlement Residue, US District Court NY, 8, New York NY, CRT-2026-3390
Safe Deposit Box #402 Vault, 18900.00, CA, Gold Coin Inventory, CA State Controller Vault, 6, Sacramento CA, SDB-CA-4020
John Doe Claim, 12500.00, CA, Uncashed Payroll Check, Wells Fargo Bank, 1, Los Angeles CA, NAUPA-CA-1002`);
    } else if (sampleType === "pensions") {
      setRawCSVInput(`Name, Amount, State, AssetType, Custodian, CategoryId, Location
Arthur Pendelton, 54000.00, CA, PBGC Vested Pension, Boeing ERISA Plan Administrator, 2, Long Beach CA
Marsha Henderson, 82500.00, TX, Abandoned Vested Annuity, General Dynamics Pension Trust, 2, Fort Worth TX
Estate of Donald Hayes, 128000.00, IL, Deceased Worker Accrued Pension, Caterpillar Retirement Fund, 2, Chicago IL`);
    } else if (sampleType === "probate") {
      setRawCSVInput(`Name, Amount, State, AssetType, Custodian, CategoryId, Location
Estate of Eleanor Vance, 310000.00, CA, Intestate Probate Surplus, Los Angeles County Probate Court, 12, Los Angeles CA
Estate of James R Montgomery, 142000.00, TX, Missing Heir Court Holding, Harris County Probate Unit, 12, Houston TX
Estate of Clara Bow, 95000.00, NY, Public Administrator Escrow, New York Surrogate Court, 12, New York NY`);
    } else {
      setRawCSVInput(`Name, Amount, State, AssetType, Custodian, CategoryId
John Doe, 12500.00, CA, Bank Account Balance, Wells Fargo Bank, 1
Robert Smith Estate, 68000.00, TX, Uncashed Dividend Check, Alliance Corp, 1
Silverado Inc, 142000.00, CA, Corporate Escrow Credit, Chevron Corp, 1`);
    }
  };

  const handleParseCSV = () => {
    setCsvPreviewError("");
    setImportedRows([]);
    setBatchInsertResult(null);

    if (!rawCSVInput.trim()) {
      setCsvPreviewError("Please paste valid CSV records or click one of the sample dataset buttons above.");
      return;
    }

    try {
      const rawLines = rawCSVInput.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (rawLines.length === 0) {
        setCsvPreviewError("No non-empty lines found in CSV input.");
        return;
      }

      // Check header line
      const firstLineLower = rawLines[0].toLowerCase();
      const hasHeader = firstLineLower.includes("name") || firstLineLower.includes("amount") || firstLineLower.includes("state");
      const dataLines = hasHeader ? rawLines.slice(1) : rawLines;

      if (dataLines.length === 0) {
        setCsvPreviewError("CSV file contains a header line only. Please add data rows.");
        return;
      }

      const tempRows: any[] = [];

      dataLines.forEach((line, idx) => {
        const cols = parseCSVLine(line);
        if (cols.length < 2) return;

        const rawName = cols[0] || "Unknown Owner";
        const nameParts = rawName.trim().split(/\s+/);
        let firstName = nameParts[0] || "";
        let lastName = nameParts.slice(1).join(" ") || "";
        if (!lastName && nameParts.length === 1) {
          lastName = nameParts[0];
          firstName = "Unassigned";
        }

        const rawAmtStr = String(cols[1] || "0").replace(/[\$,]/g, "").trim();
        const floatAmount = parseFloat(rawAmtStr);
        if (isNaN(floatAmount)) {
          throw new Error(`Row ${idx + 1} ("${rawName}") has an invalid numeric amount: "${cols[1]}".`);
        }

        const stateStr = (cols[2] || "CA").trim().toUpperCase();
        const propertyType = (cols[3] || "Unclaimed Asset").trim();
        const companyStr = (cols[4] || "Unknown Custodian").trim();
        const catIdCol = cols[5] ? cols[5].trim() : undefined;
        const locationStr = cols[6] ? cols[6].trim() : `${stateStr} | ${companyStr}`;
        const stateIdStr = cols[7] ? cols[7].trim() : `CSV-SQL-${Date.now()}-${idx + 1}`;

        const rawRecordObj = {
          first_name: firstName,
          last_name: lastName,
          name: rawName,
          property_type: propertyType,
          type: propertyType,
          company: companyStr,
          holderCompany: companyStr,
          amount: floatAmount,
          state: stateStr,
          category_id: catIdCol,
          location: locationStr,
          state_id: stateIdStr
        };

        const resolvedCategory = resolveCategoryForRecord(rawRecordObj, selectedImportCategoryId);

        tempRows.push({
          id: `parsed-${Date.now()}-${idx}`,
          first_name: firstName,
          last_name: lastName,
          owner: rawName,
          name: rawName,
          amount: floatAmount,
          state: stateStr,
          property_type: propertyType,
          type: propertyType,
          company: companyStr,
          holderCompany: companyStr,
          location: locationStr,
          state_id: stateIdStr,
          category_id: resolvedCategory.id,
          category_title: resolvedCategory.title,
          category_shortName: resolvedCategory.shortName,
          source: "Batch CSV Import"
        });
      });

      if (tempRows.length === 0) {
        setCsvPreviewError("Could not extract any valid asset records from the CSV input.");
        return;
      }

      setImportedRows(tempRows);
    } catch (e: any) {
      setCsvPreviewError(e.message || "Formatting error encountered while parsing CSV records.");
    }
  };

  const handleBatchInsertToSqlite = async () => {
    if (importedRows.length === 0) return;

    setIsBatchInserting(true);
    setCsvPreviewError("");
    setBatchInsertResult(null);

    try {
      const batchToInsert: AssetRecord[] = importedRows.map(row => ({
        first_name: row.first_name,
        last_name: row.last_name,
        state: row.state,
        property_type: row.property_type,
        amount: row.amount,
        company: row.company,
        location: row.location || `${row.state} | ${row.company}`,
        state_id: row.state_id || `BATCH-SQL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        category_id: String(row.category_id || "1"),
        category_title: row.category_title || "State Unclaimed Property (NAUPA)",
        sub_type: row.property_type,
        source: "Batch CSV Import"
      }));

      // 1. Insert into browser WASM SQLite DB
      const clientInsertedCount = await insertBatchToBrowserDb(batchToInsert);

      // 2. Insert into server SQLite DB (data.sqlite) via API
      let serverInsertedCount = 0;
      try {
        const apiRes = await fetch("/api/sqlite/batch-insert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: batchToInsert })
        });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          serverInsertedCount = apiData.insertedCount || clientInsertedCount;
        }
      } catch (apiErr) {
        console.warn("Backend batch insert failed, client WASM SQLite database updated:", apiErr);
      }

      const totalCount = Math.max(clientInsertedCount, serverInsertedCount, importedRows.length);
      const totalVal = importedRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const catBreakdown: Record<string, number> = {};
      importedRows.forEach(r => {
        const key = `Cat ${r.category_id}: ${r.category_shortName || r.category_title}`;
        catBreakdown[key] = (catBreakdown[key] || 0) + 1;
      });

      setBatchInsertResult({
        insertedCount: totalCount,
        totalValue: totalVal,
        categoriesMap: catBreakdown,
        message: `Successfully batch inserted ${totalCount} records ($${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}) into SQLite Database!`
      });

      // 3. Callback trigger
      if (onImportRecords) {
        onImportRecords(importedRows);
      }

      // 4. Refresh live SQLite tables and stats
      await fetchRecordsFromSQLite();
      await fetchSqliteStats();

      // Reset CSV inputs
      setImportedRows([]);
      setRawCSVInput("");
    } catch (err: any) {
      console.error("Batch insert into SQLite failed:", err);
      setCsvPreviewError(`Batch INSERT failed: ${err.message || "Error writing to SQLite database"}`);
    } finally {
      setIsBatchInserting(false);
    }
  };

  const handleCopyHermesLetter = () => {
    const textEl = document.getElementById("hermes-letter-body");
    if (textEl) {
      navigator.clipboard.writeText(textEl.innerText || "");
      setHermesCopied(true);
      setTimeout(() => setHermesCopied(false), 2000);
    }
  };

  const combinedCatalog = [
    ...sqliteRecords.map(r => ({
      id: `sqlite-${r.id}`,
      owner: `${r.first_name || ""} ${r.last_name || ""}`.trim().toUpperCase() || "UNKNOWN CLAIMANT",
      amount: Number(r.amount) || 0,
      holder: r.company || "Unknown Custodian",
      type: r.property_type || "Uncashed Check",
      state: String(r.state || "CA").toUpperCase(),
      location: r.location || "",
      state_id: r.state_id || ""
    })),
    ...RAW_ASSET_CATALOG
  ];

  const filteredAssetsCatalog = combinedCatalog.filter(a => {
    const matchesSearch = !dbSearch || a.owner.toLowerCase().includes(dbSearch.toLowerCase()) || a.holder.toLowerCase().includes(dbSearch.toLowerCase());
    return matchesSearch && a.amount >= minAmount && a.amount <= maxAmount;
  });

  const findLikeMissingAssets = (record: any) => {
    if (!record) return [];
    const words = record.owner.split(/\s+/).filter((w: string) => {
      const x = w.toUpperCase();
      return x.length > 2 && !["INC", "CORP", "LTD", "TRUST", "THE", "AND", "LLC", "ESTATE", "COMPANY", "L.P.", "LP"].includes(x);
    });
    if (words.length === 0) return [];
    return combinedCatalog.filter(a => {
      if (a.id === record.id) return false;
      return words.some((term: string) => a.owner.toUpperCase().includes(term.toUpperCase()));
    });
  };

  const handleIncorporateToCrm = () => {
    const selectedRows = combinedCatalog.filter(row => selectedDbAssetIds.includes(row.id));
    if (selectedRows.length === 0) {
      alert("No records selected! Please check one or more asset rows in the table first.");
      return;
    }

    const assetsToInsert = selectedRows.map(row => ({
      id: row.id,
      name: row.owner,
      address: (row as any).location || "Escheated Property Registry Record",
      state: row.state,
      type: row.type as any,
      holderCompany: row.holder,
      amount: row.amount
    }));

    const totalInjectedVal = assetsToInsert.reduce((sum, a) => sum + a.amount, 0);

    if (targetCrmCaseIdDb === "new_db_case") {
      const primaryAgent = dbAssignedAgent || "Jeff";
      const folderName = (customNewDbCaseName.trim() || `${selectedRows[0].owner} ASSET CLUSTER`).toUpperCase();

      const newCase = {
        id: "sqlite-case-" + Date.now(),
        categoryName: folderName,
        query: { generalHighValue: true, targetState: selectedRows[0].state },
        assets: assetsToInsert,
        relatives: [],
        createdAt: Date.now(),
        status: "Lead" as any,
        claimantType: "Individual" as any,
        ownerName: selectedRows[0].owner,
        claimNumber: `${selectedRows[0].state}-${Math.floor(Math.random() * 89999) + 10000}`,
        agent: primaryAgent,
        notes: `Imported directly from master database records.\nAssigned to Representative Agent: ${primaryAgent} to run recovery.\nContains ${selectedRows.length} assets (Cumulative value: $${totalInjectedVal.toLocaleString()}).`,
        timeline: [
          { date: new Date().toLocaleDateString(), stage: "Lead Created", desc: `Record folder initialized from SQLite database. Process assigned to agent ${primaryAgent} to run the claim.` }
        ],
        tasks: [
          { id: "t1", text: `Verify eligibility for ${selectedRows[0].owner}`, done: false },
          { id: "t2", text: "Acquire Power of Attorney or corporate claim authority proof", done: false },
          { id: "t3", text: "Sign maximum legally binding agreement (max 10% statutory standard limit)", done: false },
          { id: "t4", text: `Formally submit files to ${selectedRows[0].state} Controller division`, done: false }
        ]
      };

      if (onAddCaseToSaved) {
        onAddCaseToSaved(newCase);
        alert(`SUCCESS: Created a new CRM lead folder "${folderName}" containing ${assetsToInsert.length} assets!\nAssigned to Agent: ${primaryAgent} to run the case.\nNavigate to the Saved Lead Folders tab to track progress.`);
        setSelectedDbAssetIds([]);
        setCustomNewDbCaseName("");
      }
    } else {
      const existing = savedCases.find(c => c.id === targetCrmCaseIdDb);
      if (!existing) {
        alert("Selected CRM Case folder was not found.");
        return;
      }

      const currentAssetIds = new Set(existing.assets.map(a => a.id));
      const newlyAddedAssets = assetsToInsert.filter(a => !currentAssetIds.has(a.id));

      if (newlyAddedAssets.length === 0) {
        alert("The selected CRM Case folder already contains all these selected claims.");
        return;
      }

      const updatedCase = {
        ...existing,
        assets: [...existing.assets, ...newlyAddedAssets],
        notes: (existing.notes || "") + `\n\n--- Appended ${newlyAddedAssets.length} records via Registry Sync on ${new Date().toLocaleDateString()} ---\nAssigned Agent: ${existing.agent || "Unassigned"}.\nAdded properties: ` + newlyAddedAssets.map(a => `${a.name} ($${a.amount})`).join(", "),
        timeline: [
          ...(existing.timeline || []),
          { date: new Date().toLocaleDateString(), stage: "Assets Appended", desc: `Injected ${newlyAddedAssets.length} newly selected database claims ($${newlyAddedAssets.reduce((sum, a) => sum + a.amount, 0).toLocaleString()} value) into Case file.` }
        ]
      };

      if (onAddCaseToSaved) {
        onAddCaseToSaved(updatedCase);
        alert(`SUCCESS: Appended ${newlyAddedAssets.length} newly selected claims into existing case "${existing.categoryName}"!\nTotal claim value is now $${(existing.assets.reduce((sum: number, a: any) => sum + a.amount, 0) + newlyAddedAssets.reduce((sum, a) => sum + a.amount, 0)).toLocaleString()}.`);
        setSelectedDbAssetIds([]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. CAMPAIGNS SUBPAGE */}
      {toolType === "campaigns" && (
        <div className="space-y-6">
          <div>
            <span className="text-orange-400 text-xs font-mono font-bold uppercase bg-orange-400/10 px-2 py-0.5 rounded border border-orange-500/20">
              Outreach Pipelines
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-2">Dispatched Campaigns</h2>
            <p className="text-neutral-400 text-sm">Automated mass correspondence queues for emailing or printing postal letters to qualified leads portfolios.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <Card className="border-neutral-800 bg-[#0e0e11] p-5 space-y-4">
                <h3 className="text-sm font-semibold text-neutral-300 flex items-center gap-1.5 border-b border-neutral-900 pb-3">
                  <Megaphone className="w-4 h-4 text-orange-500" /> New Mass Campaign Launch
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-neutral-450 block">1. Select Target Case Portfolio</label>
                      <select 
                        value={selectedCaseId}
                        onChange={e => setSelectedCaseId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus-visible:outline-none"
                      >
                        <option value="">-- Choose Case Folder --</option>
                        {savedCases.map(c => (
                          <option key={c.id} value={c.id}>{c.categoryName} ({c.assets.length} Claims)</option>
                        ))}
                      </select>
                      {savedCases.length === 0 && (
                        <p className="text-[10px] text-orange-400 mt-1">Please search and create a "Saved Case Category" first to use campaigns.</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-neutral-450 block">2. Campaign Outreach Template</label>
                      <select 
                        value={campaignTemplate}
                        onChange={e => setCampaignTemplate(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 focus-visible:outline-none"
                      >
                        <option value="Individual high-value postal outreach">Individual High-Value Postal Notice</option>
                        <option value="Corporate overpayment resolution">Corporate Overpayment Recovery Email</option>
                        <option value="Probate family estates warning">Probate/Executor Estate Notification</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button 
                      onClick={handleLaunchCampaign}
                      disabled={campaignProgress !== null && campaignProgress < 100}
                      className="bg-orange-500 hover:bg-orange-600 text-black font-semibold h-11 px-6 min-w-[200px]"
                    >
                      Launch Outreach Campaign
                    </Button>
                  </div>
                </div>

                {campaignProgress !== null && (
                  <div className="pt-4 border-t border-neutral-800 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-neutral-400">Campaign Dispatching Sequence...</span>
                      <span>{campaignProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                      <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${campaignProgress}%` }} />
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className="lg:col-span-4">
              {launchedReport ? (
                <Card className="border-emerald-500/30 bg-[#0c120f] p-5 space-y-4 shadow-xl animate-fade-in text-xs font-mono">
                  <div className="flex justify-between items-center pb-2 border-b border-emerald-500/10">
                    <span className="font-bold text-emerald-400">DISPATCHING REPORT COMPLETE</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase">Campaign Index Code</span>
                      <span className="text-neutral-100 font-bold">{launchedReport.id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase">Target Lead Folder</span>
                      <span className="text-orange-300">{launchedReport.recipientCase}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase">Dispatched Letters Code</span>
                      <span className="text-neutral-200">{launchedReport.dispatchedCount} Dispatches issued</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase">Medium Channel</span>
                      <span className="text-emerald-400">{launchedReport.channel}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase">Displacement Date</span>
                      <span className="text-neutral-300">{launchedReport.date}</span>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="border border-dashed border-neutral-800 rounded-xl p-8 text-center text-neutral-500 bg-neutral-900/10">
                  <Megaphone className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Campaign Dispatch Status</p>
                  <p className="text-xs text-neutral-500 mt-1">Ready to queue campaigns. Link a case folder on the left, then trigger automated letters sequence.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MULTI-STATE SEARCH SUBPAGE */}
      {toolType === "multistate_search" && (
        <div className="space-y-6">
          <div>
            <span className="text-orange-400 text-xs font-mono font-bold uppercase bg-orange-400/10 px-2 py-0.5 rounded border border-orange-500/20">
              National registries matrix
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-2">Combined State Registry Rules</h2>
            <p className="text-neutral-400 text-sm">Review of administrative complexity, limits, and timelines of principal state controllers.</p>
          </div>

          <Card className="border-neutral-800 bg-[#0e0e11] overflow-hidden">
            <Table>
              <TableHeader className="bg-neutral-900/50">
                <TableRow className="border-neutral-800">
                  <TableHead className="font-mono text-xs">Jurisdiction</TableHead>
                  <TableHead className="font-mono text-xs">Total Escheated Capital</TableHead>
                  <TableHead className="font-mono text-xs">Filing Complexity</TableHead>
                  <TableHead className="font-mono text-xs">Notary Threshholds</TableHead>
                  <TableHead className="font-mono text-xs">Maximum Permissible Commission</TableHead>
                  <TableHead className="font-mono text-xs">Average Claim Timeline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REGISTRY_STATISTICS.map((reg, idx) => (
                  <TableRow key={idx} className="border-neutral-800 hover:bg-neutral-900/30">
                    <TableCell className="font-mono font-bold text-neutral-200">{reg.state}</TableCell>
                    <TableCell className="text-emerald-400 font-mono font-semibold">${reg.activeEscheat}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={
                          reg.difficulty.includes("Easy") ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          reg.difficulty.includes("Moderate") ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }
                      >
                        {reg.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-neutral-400 font-mono">{reg.notaryLimit}</TableCell>
                    <TableCell className="text-xs text-orange-400 font-mono font-semibold">{reg.maxCommission}</TableCell>
                    <TableCell className="text-xs text-neutral-450 font-mono">{reg.timeline}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* 3. HERMES SUBPAGE */}
      {toolType === "hermes" && (
        <div className="space-y-6">
          <div>
            <span className="text-orange-400 text-xs font-mono font-bold uppercase bg-orange-400/10 px-2 py-0.5 rounded border border-orange-500/20">
              Automated Messenger
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-2">Hermes Outreach Letter Engine</h2>
            <p className="text-neutral-400 text-sm">Dynamical formal notices formatter with real-time variables injection. Print or paste to target files instantly.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Variables Left Card */}
            <div className="lg:col-span-4">
              <Card className="border-neutral-800 bg-[#0e0e11] p-5 space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-widest text-orange-400">Letter Parameters</h3>
                
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-neutral-450">Claimant Name</label>
                    <Input 
                      value={hermesOwner}
                      onChange={e => setHermesOwner(e.target.value)}
                      className="bg-neutral-950 border-neutral-800 text-xs text-neutral-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-neutral-450">Escheat Value ($)</label>
                    <Input 
                      value={hermesAmount}
                      onChange={e => setHermesAmount(e.target.value)}
                      className="bg-neutral-950 border-neutral-800 text-xs text-neutral-200 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-neutral-450">Losing Custodian</label>
                    <Input 
                      value={hermesCustodian}
                      onChange={e => setHermesCustodian(e.target.value)}
                      className="bg-neutral-950 border-neutral-800 text-xs text-neutral-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-neutral-450">Controller Record Ref ID</label>
                    <Input 
                      value={hermesStateRef}
                      onChange={e => setHermesStateRef(e.target.value)}
                      className="bg-neutral-950 border-neutral-800 text-xs text-neutral-200 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    onClick={handleCopyHermesLetter} 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black font-semibold text-xs"
                  >
                    {hermesCopied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                    {hermesCopied ? "Copied!" : "Copy Formatted Notice"}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Letter Frame Right Card */}
            <div className="lg:col-span-8">
              <Card className="border-neutral-800 bg-[#0e0e11] overflow-hidden">
                <div className="bg-neutral-900/60 p-3.5 border-b border-neutral-800 flex justify-between items-center text-xs font-mono">
                  <span className="text-neutral-400">Notice Preview frame (HTML printable)</span>
                  <span className="text-orange-400 animate-pulse font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Draft Live
                  </span>
                </div>
                
                <CardContent className="p-6 bg-neutral-950 text-neutral-200 font-sans text-xs leading-relaxed space-y-4">
                  <div id="hermes-letter-body" className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    <div className="text-center font-bold text-sm tracking-wider uppercase underline">
                      OFFICIAL NOTICE OF OUTSTANDING DISCOVERED PROPERTY LIENS & CASH
                    </div>
                    <div className="text-right text-[10px] text-neutral-400 font-mono">
                      Ref File: {hermesStateRef || "CA-REF-99"} <br />
                      Date Notice Issue: {new Date().toLocaleDateString()}
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold text-xs">ATTENTION OF INTENDED DEBTOR:</p>
                      <p className="font-mono text-orange-300 font-bold uppercase">{hermesOwner}</p>
                    </div>

                    <p>
                      This communications serves to inform you that our audit bureau has uncovered a sum of 
                      <strong className="text-emerald-400 font-mono text-sm ml-1">
                        ${(parseFloat(hermesAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </strong> in unclaimed, inactive capital assets transferred from custodian <span className="font-semibold">{hermesCustodian}</span> to safe state escrow custody.
                    </p>

                    <p>
                      Pursuant to statutory administrative rules, you are authorized to recover this balance. Our agency manages the entire documentation pipeline for a standard finder rate of 10% payable purely upon success disbursement.
                    </p>

                    <div className="p-3 bg-neutral-900 rounded-xl space-y-1 text-[11px] font-mono border border-neutral-850">
                      <p className="font-bold border-b border-neutral-800 pb-1 text-orange-400">SUMMARY DATA LIENS:</p>
                      <p>Unified Record Ref: {hermesStateRef}</p>
                      <p>Unclaimed Funds Val: ${parseFloat(hermesAmount).toLocaleString()}</p>
                      <p>State Legal Custody: California Controller Bureau</p>
                    </div>

                    <p>
                      To proceed with filing, please sign and return the enclosed agency contract authorization sheet at your earliest convenience to avoid regulatory holding fees.
                    </p>

                    <div className="pt-4 border-t border-neutral-900 flex justify-between">
                      <div>
                        <p className="font-bold">Sovereign Recovery Desk</p>
                        <p className="text-[10px] text-neutral-500">Authorized Skip Trace Locator</p>
                      </div>
                      <div className="border-b border-neutral-700 w-32 h-8 text-center text-[9px] text-neutral-600 self-end font-sans">
                        Authorized Signature
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="pt-6 border-t border-neutral-800">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-100 mt-2">Hermes Control Terminal</h2>
              <p className="text-neutral-400 text-sm mb-4">Direct WebSocket CLI connection to the backend Hermes Agent.</p>
            </div>
            <div className="h-[500px]">
              <HermesTerminal />
            </div>
          </div>
        </div>
      )}

      {/* 4. ASSET DATABASE CATALOG SUBPAGE */}
      {toolType === "asset_db" && (() => {
        const allIdsOnPage = filteredAssetsCatalog.map(r => r.id);
        const isAllSelected = allIdsOnPage.length > 0 && allIdsOnPage.every(id => selectedDbAssetIds.includes(id));
        
        const toggleSelectAll = () => {
          if (isAllSelected) {
            setSelectedDbAssetIds(prev => prev.filter(id => !allIdsOnPage.includes(id)));
          } else {
            setSelectedDbAssetIds(prev => {
              const unique = new Set([...prev, ...allIdsOnPage]);
              return Array.from(unique);
            });
          }
        };

        const toggleSelectIndividual = (id: string) => {
          setSelectedDbAssetIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
          );
        };

        const similarMissing = selectedForFuzzySearch ? findLikeMissingAssets(selectedForFuzzySearch) : [];

        // Calculate selected stats
        const selectedCount = selectedDbAssetIds.length;
        const selectedValue = combinedCatalog
          .filter(r => selectedDbAssetIds.includes(r.id))
          .reduce((sum, r) => sum + r.amount, 0);

        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-orange-400 text-xs font-mono font-bold uppercase bg-orange-400/10 px-2 py-0.5 rounded border border-orange-500/20 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    SQLite Browser & 12-Category Database
                  </span>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">
                    data.sqlite Active
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-2">Combined State Records & Asset Database</h2>
                <p className="text-neutral-400 text-sm">Persistent SQLite engine storing California unclaimed property, 12-category asset search logs, and scraped ZIP/CSV imports.</p>
              </div>

              {/* View Mode & Export Controls */}
              <div className="flex items-center flex-wrap gap-2">
                <a
                  href="/api/sqlite/export?format=csv"
                  download="ca_assets_sqlite_export.csv"
                  className="h-8 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5 text-orange-400" />
                  Export CSV
                </a>

                <div className="flex bg-neutral-900 border border-neutral-850 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDbViewMode("visual")}
                    className={cn(
                      "px-3 py-1 rounded-lg font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5",
                      dbViewMode === "visual"
                        ? "bg-orange-500 text-black font-bold shadow-sm"
                        : "text-neutral-400 hover:text-neutral-200"
                    )}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Visual Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setDbViewMode("sql_studio")}
                    className={cn(
                      "px-3 py-1 rounded-lg font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5",
                      dbViewMode === "sql_studio"
                        ? "bg-orange-500 text-black font-bold shadow-sm"
                        : "text-neutral-400 hover:text-neutral-200"
                    )}
                  >
                    <Database className="w-3.5 h-3.5" />
                    Custom SQL Studio
                  </button>
                </div>
              </div>
            </div>

            {/* SQLite Live Metrics Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-neutral-850 bg-neutral-950 p-4 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Total Database Records</span>
                <div className="text-xl font-bold font-mono text-neutral-100 mt-1 flex items-center justify-between">
                  <span>{sqliteStats ? sqliteStats.totalRecords.toLocaleString() : sqliteRecords.length}</span>
                  <Database className="w-5 h-5 text-orange-400/80" />
                </div>
                <span className="text-[10px] font-mono text-neutral-450 mt-1 block">Persisted in local data.sqlite</span>
              </Card>

              <Card className="border-neutral-850 bg-neutral-950 p-4 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">California (CA) Assets</span>
                <div className="text-xl font-bold font-mono text-orange-400 mt-1 flex items-center justify-between">
                  <span>{sqliteStats ? sqliteStats.caRecordsCount.toLocaleString() : combinedCatalog.filter(c => c.state === 'CA').length}</span>
                  <span className="text-xs bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded text-orange-400">CA Focus</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-450 mt-1 block">CA Unclaimed Property Logs</span>
              </Card>

              <Card className="border-neutral-850 bg-neutral-950 p-4 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Total Asset Portfolio Value</span>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center justify-between">
                  <span>${sqliteStats ? (sqliteStats.totalValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) : combinedCatalog.reduce((s, c) => s + c.amount, 0).toLocaleString()}</span>
                  <Coins className="w-5 h-5 text-emerald-400/80" />
                </div>
                <span className="text-[10px] font-mono text-neutral-450 mt-1 block">Indexed Recoverable Capital</span>
              </Card>

              <Card className="border-neutral-850 bg-neutral-950 p-4 rounded-xl">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">12-Category Coverage</span>
                <div className="text-xl font-bold font-mono text-indigo-400 mt-1 flex items-center justify-between">
                  <span>12 / 12 Fields</span>
                  <Sparkles className="w-5 h-5 text-indigo-400/80" />
                </div>
                <span className="text-[10px] font-mono text-neutral-450 mt-1 block">NAUPA, PBGC, Bonds, Probate</span>
              </Card>
            </div>

            {/* SQL STUDIO MODE TERMINAL */}
            {dbViewMode === "sql_studio" && (
              <Card className="border-neutral-800 bg-[#0a0a0d] p-5 rounded-2xl space-y-4 shadow-2xl animate-in fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-900 pb-3">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-orange-400 flex items-center gap-2">
                      <Database className="w-4 h-4 text-orange-400" />
                      Browser SQL Terminal & Direct Query Console
                    </h3>
                    <p className="text-xs text-neutral-450 mt-0.5 font-mono">
                      Execute custom SELECT queries against table <code className="text-orange-300">scraped_records</code> in <code className="text-orange-300">data.sqlite</code>.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleExecuteCustomSql()}
                      disabled={isExecutingSql}
                      className="bg-orange-500 hover:bg-orange-600 text-black font-bold font-mono text-xs px-4 h-8 cursor-pointer"
                    >
                      {isExecutingSql ? (
                        <>
                          <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin mr-1.5" />
                          Executing SQL...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 mr-1.5" />
                          Run Query
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Preset SQL Statements Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 block">Preset SQL Queries:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const q = "SELECT id, first_name, last_name, state, property_type, amount, company, location, scraped_at FROM scraped_records WHERE UPPER(state)='CA' ORDER BY amount DESC LIMIT 50;";
                        setCustomSql(q);
                        handleExecuteCustomSql(q);
                      }}
                      className="text-[10px] font-mono px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-orange-300 hover:border-orange-500/40 cursor-pointer"
                    >
                      CA High Value Assets
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const q = "SELECT category_id, category_title, COUNT(*) as count, SUM(amount) as total_val FROM scraped_records GROUP BY category_id ORDER BY total_val DESC;";
                        setCustomSql(q);
                        handleExecuteCustomSql(q);
                      }}
                      className="text-[10px] font-mono px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-orange-300 hover:border-orange-500/40 cursor-pointer"
                    >
                      12-Category Aggregates
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const q = "SELECT id, first_name, last_name, amount, company, source, scraped_at FROM scraped_records ORDER BY id DESC LIMIT 50;";
                        setCustomSql(q);
                        handleExecuteCustomSql(q);
                      }}
                      className="text-[10px] font-mono px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-orange-300 hover:border-orange-500/40 cursor-pointer"
                    >
                      Latest 50 Inserted Records
                    </button>
                  </div>
                </div>

                {/* SQL Input Box */}
                <textarea
                  value={customSql}
                  onChange={(e) => setCustomSql(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-950 font-mono text-xs border border-neutral-850 rounded-xl p-3 text-orange-300 focus:outline-none focus:ring-1 focus:ring-orange-500 leading-relaxed"
                  placeholder="SELECT * FROM scraped_records WHERE amount > 50000;"
                />

                {sqlQueryError && (
                  <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>SQL Error: {sqlQueryError}</span>
                  </div>
                )}

                {/* SQL Query Results Table */}
                {sqlQueryResult && (
                  <div className="space-y-2 pt-2 border-t border-neutral-900">
                    <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
                      <span>Execution Result: <strong className="text-emerald-400">{sqlQueryResult.rowCount} rows</strong> returned</span>
                      <span className="text-[10px] text-neutral-500">Read-Only Safety Sandbox</span>
                    </div>

                    <div className="border border-neutral-850 rounded-xl overflow-x-auto max-h-72 overflow-y-auto">
                      {sqlQueryResult.rows.length === 0 ? (
                        <div className="p-6 text-center text-xs font-mono text-neutral-500">Query returned 0 rows.</div>
                      ) : (
                        <Table>
                          <TableHeader className="bg-neutral-950 sticky top-0 z-10">
                            <TableRow className="border-neutral-850">
                              {Object.keys(sqlQueryResult.rows[0]).map((col) => (
                                <TableHead key={col} className="font-mono text-[11px] text-orange-400 py-2 uppercase">
                                  {col}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sqlQueryResult.rows.map((row, rIdx) => (
                              <TableRow key={rIdx} className="border-neutral-900 hover:bg-neutral-900/50">
                                {Object.values(row).map((val, cIdx) => (
                                  <TableCell key={cIdx} className="font-mono text-xs py-2 text-neutral-300">
                                    {val !== null && val !== undefined ? String(val) : <span className="text-neutral-600 italic">null</span>}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Range Search & Keywords Filter Bar */}
            <div className="bg-neutral-900/40 p-5 border border-neutral-900 rounded-xl space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block border-b border-neutral-900 pb-2">
                Unified Search and Dollar Amount Range Limits
              </span>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Keywords input */}
                <div className="lg:col-span-4 space-y-1.5">
                  <label className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase block">Search Owner or Holder</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                    <Input 
                      placeholder="e.g. Thomson Diggs, Est...."
                      value={dbSearch}
                      onChange={e => setDbSearch(e.target.value)}
                      className="bg-neutral-950 border-neutral-850 text-xs text-neutral-300 pl-8 h-8.5"
                    />
                  </div>
                </div>

                {/* Min Amount */}
                <div className="lg:col-span-4 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase block">Minimum Escheated value</label>
                    <span className="text-xs font-mono text-emerald-450 font-bold">${minAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={minAmount}
                      onChange={e => setMinAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-neutral-950 border-neutral-850 text-xs font-mono text-neutral-350 w-24 h-8.5"
                    />
                    <input 
                      type="range"
                      min="0"
                      max="100000"
                      step="500"
                      value={Math.min(minAmount, 100000)}
                      onChange={e => setMinAmount(parseInt(e.target.value) || 0)}
                      className="accent-orange-500 flex-1 h-1 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Max Amount */}
                <div className="lg:col-span-4 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase block">Maximum Escheated value</label>
                    <span className="text-xs font-mono text-emerald-450 font-bold">${maxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={maxAmount}
                      onChange={e => setMaxAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-neutral-950 border-neutral-850 text-xs font-mono text-neutral-350 w-28 h-8.5"
                    />
                    <input 
                      type="range"
                      min="500"
                      max="1000000"
                      step="5000"
                      value={Math.min(maxAmount, 1000000)}
                      onChange={e => setMaxAmount(parseInt(e.target.value) || 0)}
                      className="accent-orange-500 flex-1 h-1 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* FUZZY MATCHES SIMILAR PANELS (MISSING ASSETS SCANNER) */}
            {selectedForFuzzySearch && (
              <Card className="border-orange-500/30 bg-[#0c0c0e] p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-start border-b border-neutral-900 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-orange-550/15 text-orange-400 border border-orange-500/20">
                      <Sparkle className="w-4 h-4 animate-spin-slow" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold tracking-wider text-orange-400 uppercase">Beneficiary Like/Missing Assets Scanner</h4>
                      <p className="text-[11px] text-neutral-450 mt-1">Found potentially connected unclaimed holdings for: <strong className="text-neutral-200">{selectedForFuzzySearch.owner}</strong></p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="h-6 px-2 text-neutral-500 hover:text-neutral-200 text-[10px] font-mono border border-neutral-850" 
                    onClick={() => setSelectedForFuzzySearch(null)}
                  >
                    Hide Scanner
                  </Button>
                </div>
                
                {similarMissing.length === 0 ? (
                  <div className="text-center py-4 text-xs text-neutral-500 font-mono">
                    No additional assets matching claimant surname/token tokens were discovered.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-450 leading-relaxed">
                      We scanned the master repositories and discovered <span className="text-orange-400 font-bold font-mono">{similarMissing.length}</span> other unclaimed files belonging to similar or matching owners. Check files below to merge them into your selection desk.
                    </p>
                    <div className="overflow-x-auto border border-neutral-900 rounded-lg max-h-48 overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-neutral-950">
                          <TableRow className="border-neutral-900">
                            <TableHead className="w-10 py-1.5 px-3"></TableHead>
                            <TableHead className="font-mono text-xs py-1.5 px-2">Discovered Owner</TableHead>
                            <TableHead className="font-mono text-xs py-1.5 px-2">Escheated Cash</TableHead>
                            <TableHead className="font-mono text-xs py-1.5 px-2">Custodian</TableHead>
                            <TableHead className="font-mono text-xs py-1.5 px-2">State</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {similarMissing.map((sim) => {
                            const isChecked = selectedDbAssetIds.includes(sim.id);
                            return (
                              <TableRow key={sim.id} className="border-neutral-900 hover:bg-neutral-900/40">
                                <TableCell className="py-2 px-3">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => toggleSelectIndividual(sim.id)}
                                    className="rounded border-neutral-800 bg-neutral-950 text-orange-500 accent-orange-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                </TableCell>
                                <TableCell className="font-mono text-xs text-white font-bold py-2 px-2">{sim.owner}</TableCell>
                                <TableCell className="font-mono text-xs font-semibold text-emerald-450 py-2 px-2">${sim.amount.toLocaleString()}</TableCell>
                                <TableCell className="text-[11px] text-neutral-400 py-2 px-2">{sim.holder}</TableCell>
                                <TableCell className="text-[11px] text-orange-400 font-mono py-2 px-2">{sim.state}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* MASTER DATABASE TABLE */}
            <div className="border border-neutral-850 rounded-xl bg-[#08080a] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-neutral-900 bg-neutral-900/10">
                <span className="text-[11px] font-mono text-neutral-450">Displaying <strong className="text-orange-400">{filteredAssetsCatalog.length}</strong> matching files inside catalog indexes</span>
                {selectedCount > 0 && (
                  <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono text-[10px] leading-none py-1 px-2">
                    {selectedCount} Selected
                  </Badge>
                )}
              </div>
              <Table>
                <TableHeader className="bg-neutral-900/40">
                  <TableRow className="border-neutral-900">
                    <TableHead className="w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-neutral-800 bg-neutral-950 text-orange-500 accent-orange-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="font-mono text-xs">Record Owner Surname</TableHead>
                    <TableHead className="font-mono text-xs">Escheated Amount</TableHead>
                    <TableHead className="font-mono text-xs">Custodian</TableHead>
                    <TableHead className="font-mono text-xs">Property Category</TableHead>
                    <TableHead className="font-mono text-xs">Origin State</TableHead>
                    <TableHead className="font-mono text-xs text-right pr-6">Similar Scanner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssetsCatalog.map((row) => {
                    const isChecked = selectedDbAssetIds.includes(row.id);
                    return (
                      <TableRow key={row.id} className={cn("border-neutral-900 hover:bg-neutral-900/30 transition-all", isChecked && "bg-orange-500/5")}>
                        <TableCell className="text-center py-3">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleSelectIndividual(row.id)}
                            className="rounded border-neutral-800 bg-neutral-950 text-orange-500 accent-orange-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs text-neutral-100 py-3">{row.owner}</TableCell>
                        <TableCell className="text-emerald-400 font-mono font-semibold text-[13px] py-3">${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-xs text-neutral-400 py-3">{row.holder}</TableCell>
                        <TableCell className="text-xs text-neutral-450 py-3">{row.type}</TableCell>
                        <TableCell className="text-xs text-orange-400 font-mono font-semibold py-3">{row.state}</TableCell>
                        <TableCell className="text-right py-3 pr-6">
                          <Button
                            variant="outline"
                            className="h-7 px-3 border-orange-500/15 hover:border-orange-500/30 text-orange-400 text-[10px] font-mono hover:bg-orange-500/5 gap-1 rounded-md cursor-pointer"
                            onClick={() => setSelectedForFuzzySearch(row)}
                          >
                            <Sparkles className="w-3 h-3 text-orange-400/80" />
                            Scan Similar Unclaimed
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredAssetsCatalog.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-neutral-500 font-mono animate-pulse">
                        No assets found matching the specified dollar parameters filter bounds.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* DIRECT CRM DROPPER & ASSIGNMENT FOR SAVING SELECTION */}
            {selectedCount > 0 && (
              <Card className="border-neutral-800 bg-gradient-to-b from-[#0a0a0d] to-neutral-950 rounded-xl overflow-hidden shadow-xl animate-fade-in border border-orange-500/10">
                <CardHeader className="bg-neutral-900/30 border-b border-neutral-900 py-4 px-6 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-mono font-bold tracking-wider text-neutral-300 uppercase">
                      Incorporate Ingested Records into active CRM Case File
                    </CardTitle>
                    <CardDescription className="text-[11px] text-neutral-500">
                      Instantly merge {selectedCount} selected state files and assign them to an active agent to run.
                    </CardDescription>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono text-xs px-2.5 py-1">
                    Total Value: ${selectedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Badge>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                    
                    {/* CRM Target Case dropdown */}
                    <div className="lg:col-span-4 space-y-1.5">
                      <label className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase block">Target CRM Case File</label>
                      <select
                        value={targetCrmCaseIdDb}
                        onChange={e => setTargetCrmCaseIdDb(e.target.value)}
                        className="h-9 w-full rounded-md border border-neutral-850 bg-[#070709] px-3 py-1 text-xs text-neutral-300 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                      >
                        <option value="new_db_case">🆕 Create fresh Case Assignment file...</option>
                        {savedCases.map(c => (
                          <option key={c.id} value={c.id}>Append to Case: {c.categoryName}</option>
                        ))}
                      </select>
                    </div>

                    {/* New Case Details section OR Appender explanation */}
                    {targetCrmCaseIdDb === "new_db_case" ? (
                      <>
                        {/* Custom New Case Name */}
                        <div className="lg:col-span-4 space-y-1.5">
                          <label className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase block">New CRM Folder Name</label>
                          <Input 
                            value={customNewDbCaseName}
                            onChange={e => setCustomNewDbCaseName(e.target.value)}
                            placeholder="e.g. COOPER ESTATE CLUSTER"
                            className="bg-neutral-950 border-neutral-850 text-xs h-9 font-mono text-neutral-200"
                          />
                        </div>

                        {/* Representative Agent */}
                        <div className="lg:col-span-2 space-y-1.5">
                          <label className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase block">Assign Investigation Agent</label>
                          <select
                            value={dbAssignedAgent}
                            onChange={e => setDbAssignedAgent(e.target.value)}
                            className="h-9 w-full rounded-md border border-neutral-850 bg-[#070709] px-2 text-xs text-orange-400 font-semibold font-mono focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                          >
                            {["Jeff", "Pankay", "Dhru", "AJ", "Owen"].map(rep => (
                              <option key={rep} value={rep}>{rep}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <div className="lg:col-span-6 bg-neutral-900/30 p-2 px-3.5 border border-dashed border-neutral-850 rounded text-xs text-neutral-450 font-mono flex items-center h-9">
                        These selected claims will be seamlessly merged into the existing folder with historical log updates.
                      </div>
                    )}

                    {/* Submit Dropper Button */}
                    <div className="lg:col-span-2">
                      <Button 
                        onClick={handleIncorporateToCrm}
                        className="w-full h-9 bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs tracking-wide uppercase flex justify-center items-center gap-1.5 rounded-lg font-mono cursor-pointer"
                      >
                        <ArrowDownToLine className="w-4 h-4" />
                        Incorporate
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        );
      })()}

      {/* 5. IMPORT CSV SUBPAGE */}
      {toolType === "import_csv" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-orange-400 text-xs font-mono font-bold uppercase bg-orange-400/10 px-2 py-0.5 rounded border border-orange-500/20">
                Bulk ingestion
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-2">Dynamic Data Ingestion Registry</h2>
              <p className="text-neutral-400 text-sm">Synchronize unclaimed properties bulk files into the local server SQLite system database.</p>
            </div>

            {/* Ingestion Mode Tab Switcher */}
            <div className="flex space-x-1 p-1 bg-neutral-900/60 border border-neutral-850 rounded-lg self-start md:self-auto">
              <button
                type="button"
                onClick={() => { setImportTab("zip"); clearUploadStats(); }}
                className={cn(
                  "px-4 py-1.5 text-xs font-mono font-medium rounded-md transition-all",
                  importTab === "zip" ? "bg-orange-500 text-black font-semibold shadow-md" : "text-neutral-400 hover:text-neutral-200"
                )}
              >
                SQLite ZIP / CSV Sync
              </button>
              <button
                type="button"
                onClick={() => { setImportTab("pasted"); }}
                className={cn(
                  "px-4 py-1.5 text-xs font-mono font-medium rounded-md transition-all",
                  importTab === "pasted" ? "bg-orange-500 text-black font-semibold shadow-md" : "text-neutral-400 hover:text-neutral-200"
                )}
              >
                Client CSV Paste
              </button>
            </div>
          </div>

          {importTab === "zip" ? (
            <div className="space-y-6">
              {/* ZIP/CSV upload drag zone */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-4">
                  <Card className="border-neutral-850 bg-[#0e0e11] p-6 space-y-5">
                    <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
                        <Database className="w-4 h-4" /> SQLite Database Sync
                      </h3>
                      <Badge variant="outline" className="border-neutral-800 text-neutral-400 font-mono text-[10px]">
                        Target table: scraped_records
                      </Badge>
                    </div>

                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[220px]",
                        isDragging ? "border-orange-500 bg-orange-500/5 animate-pulse" : "border-neutral-800 bg-neutral-950/40 hover:border-neutral-700",
                        isUploading ? "pointer-events-none opacity-60" : "cursor-pointer"
                      )}
                    >
                      <input 
                        type="file" 
                        accept=".zip,.csv" 
                        onChange={handleFileSelect}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        title=""
                      />
                      
                      {isUploading ? (
                        <div className="space-y-4 animate-pulse">
                          <Loader2 className="w-12 h-12 text-orange-500 mx-auto animate-spin" />
                          <div>
                            <p className="text-sm font-semibold text-neutral-200 font-mono">EXTRACTING & SYNCHRONIZING FILE TO SQLITE...</p>
                            <p className="text-xs text-neutral-500 mt-1">Sieving data schemas and validating database constraints</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 pointer-events-none">
                          <div className="mx-auto w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-200">Drag & drop your ZIP archive or CSV file here</p>
                            <p className="text-xs text-neutral-500 mt-1">or click this workspace box to select from system file tree</p>
                          </div>
                          <p className="text-[10px] text-neutral-600 font-mono max-w-sm mx-auto leading-relaxed">
                            Directly upload individual .csv sheets or compressed .zip files containing .csv/.json lists. Duplicate records are cross-referenced with SQLite state_id / checksum tables and discarded automatically.
                          </p>
                        </div>
                      )}
                    </div>

                    {uploadError && (
                      <div className="p-3.5 bg-rose-950/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-400 text-xs font-mono">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold">DEDUPLICATION OR UPLOAD ERROR</p>
                          <p className="text-[11px] text-rose-500/90 mt-1">{uploadError}</p>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Duplication & holding information stats block */}
                <div className="lg:col-span-5">
                  {uploadResult ? (
                    <Card className="border-emerald-500/20 bg-[#0c120f] p-5 space-y-4 shadow-2xl animate-fade-in font-mono text-xs text-neutral-300">
                      <div className="pb-2 border-b border-emerald-500/20 flex justify-between items-center text-emerald-400">
                        <span className="font-bold text-xs uppercase tracking-wider">SQLite SYNCHRONIZATION COMPLETE</span>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 pt-1">
                        <div className="bg-[#050907] border border-emerald-500/10 p-3 rounded-lg">
                          <span className="text-[10px] text-neutral-500 uppercase block">Files Extracted</span>
                          <span className="text-lg font-bold text-neutral-200">{uploadResult.totalFilesProcessed}</span>
                        </div>
                        <div className="bg-[#050907] border border-emerald-500/10 p-3 rounded-lg">
                          <span className="text-[10px] text-neutral-500 uppercase block">Total Rows Read</span>
                          <span className="text-lg font-bold text-neutral-200">{uploadResult.recordsParsed}</span>
                        </div>
                        <div className="bg-[#050907] border border-emerald-500/10 p-3 rounded-lg">
                          <span className="text-[10px] text-neutral-500 uppercase block text-emerald-400">Synced (New)</span>
                          <span className="text-lg font-bold text-emerald-400">+{uploadResult.recordsInserted}</span>
                        </div>
                        <div className="bg-[#050907] border border-emerald-500/10 p-3 rounded-lg">
                          <span className="text-[10px] text-neutral-500 uppercase block text-amber-400">Duplicates Skipped</span>
                          <span className="text-lg font-bold text-amber-400">{uploadResult.duplicateCount}</span>
                        </div>
                      </div>

                      {uploadResult.fileNames && uploadResult.fileNames.length > 0 && (
                        <div className="space-y-1 pt-2 border-t border-emerald-500/10">
                          <span className="text-[10px] text-neutral-500 uppercase block">Extracted Package Manifest</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {uploadResult.fileNames.map((name: string, i: number) => (
                              <Badge key={i} className="bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-300 border-emerald-500/20 px-2 py-0.5 text-[10px] rounded-md">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] text-neutral-500 leading-relaxed pt-2 border-t border-emerald-500/10 bg-emerald-950/5 p-2 rounded border border-emerald-500/5">
                        <span className="text-emerald-400 font-bold block mb-0.5">DEDUPLICATION POLICY ACTIVE</span>
                        Checks unique state identifiers (e.g. state_id values) and matches (first_name, last_name, state, company, amount) combinations to ensure SQLite database is 100% clean and free of redundancies.
                      </div>

                      <div className="pt-2">
                        <Button 
                          onClick={clearUploadStats}
                          className="w-full bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-500/20 text-emerald-200 text-xs font-mono h-9"
                        >
                          Clear Sync Report
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card className="border-neutral-850 bg-[#0e0e11] p-5 space-y-4">
                      <h4 className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Ingestion Operations Manual</h4>
                      
                      <div className="space-y-3.5 text-xs text-neutral-400">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                            1
                          </div>
                          <p className="leading-relaxed">Create a ZIP containing individual <strong>JSON</strong> or <strong>CSV</strong> sheets representing unclaimed state records.</p>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                            2
                          </div>
                          <p className="leading-relaxed">Drag or upload the ZIP file. The backend decompresses it, parses matching indexes, and parses columns.</p>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                            3
                          </div>
                          <p className="leading-relaxed">Records are added to <strong>SQLite</strong>. When executing name checks in the <strong>Search Workbench</strong>, matched database entries are resolved instantly!</p>
                        </div>
                      </div>

                      <div className="pt-3.5 border-t border-neutral-900 flex justify-between items-center text-[11px] font-mono text-neutral-500">
                        <span>Local SQLite Capacity:</span>
                        <span className="text-orange-400 font-bold">{sqliteRecords.length} Active Records cached</span>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Batch Insert Result Notification Card */}
              {batchInsertResult && (
                <Card className="border-emerald-500/30 bg-[#07130c] p-5 space-y-4 shadow-2xl animate-fade-in font-mono">
                  <div className="pb-3 border-b border-emerald-500/20 flex justify-between items-center text-emerald-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-xs uppercase tracking-wider">SQLite BATCH INSERT COMPLETED SUCCESSFULLY</span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                      {batchInsertResult.insertedCount} Records Written
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#030805] border border-emerald-500/20 p-3.5 rounded-lg">
                      <span className="text-[10px] text-neutral-400 uppercase block">Total Rows Inserted</span>
                      <span className="text-xl font-bold text-emerald-400">{batchInsertResult.insertedCount}</span>
                    </div>
                    <div className="bg-[#030805] border border-emerald-500/20 p-3.5 rounded-lg">
                      <span className="text-[10px] text-neutral-400 uppercase block">Total Asset Value</span>
                      <span className="text-xl font-bold text-emerald-400">${batchInsertResult.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-[#030805] border border-emerald-500/20 p-3.5 rounded-lg">
                      <span className="text-[10px] text-neutral-400 uppercase block">Database Storage Engine</span>
                      <span className="text-xs font-bold text-orange-400 mt-1 block">In-Browser WASM SQLite + server data.sqlite</span>
                    </div>
                  </div>

                  {batchInsertResult.categoriesMap && Object.keys(batchInsertResult.categoriesMap).length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                      <span className="text-[10px] text-neutral-400 uppercase block">12 Asset Categories Distribution:</span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(batchInsertResult.categoriesMap).map(([catLabel, count], idx) => (
                          <Badge key={idx} className="bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[10px] py-1 px-2.5">
                            {catLabel} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button 
                      onClick={() => setBatchInsertResult(null)}
                      className="bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-500/30 text-xs px-4 h-8 font-mono"
                    >
                      Dismiss Report
                    </Button>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 space-y-4">
                  <Card className="border-neutral-800 bg-[#0e0e11] p-5 space-y-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-850">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-orange-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">CSV Import & Ingestion Terminal</h3>
                      </div>
                      <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] font-mono self-start sm:self-auto">
                        12 Categories Supported
                      </Badge>
                    </div>

                    {/* Category Selection Target */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-neutral-400 font-semibold block">
                        Assign Target Asset Category:
                      </label>
                      <select
                        value={selectedImportCategoryId}
                        onChange={e => setSelectedImportCategoryId(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-md text-xs p-2.5 font-mono focus:border-orange-500 focus:outline-none"
                      >
                        <option value="auto">⚡ Auto-Detect Category (Keywords & Col Index)</option>
                        {ASSET_CATEGORIES_DATA.map(cat => (
                          <option key={cat.id} value={String(cat.id)}>
                            Cat {cat.id}: {cat.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quick Load Sample CSV Buttons */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block">Load Preset Sample CSV Data:</span>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={() => handleLoadSampleCSV("multi")}
                          className="border-neutral-800 hover:bg-neutral-900 text-[10px] h-7 px-2 font-mono text-neutral-300 justify-start"
                        >
                          🌐 12-Category Portfolio
                        </Button>
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={() => handleLoadSampleCSV("pensions")}
                          className="border-neutral-800 hover:bg-neutral-900 text-[10px] h-7 px-2 font-mono text-neutral-300 justify-start"
                        >
                          🏦 Cat 2: Pensions / PBGC
                        </Button>
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={() => handleLoadSampleCSV("probate")}
                          className="border-neutral-800 hover:bg-neutral-900 text-[10px] h-7 px-2 font-mono text-neutral-300 justify-start"
                        >
                          ⚖️ Cat 12: Probate Heirs
                        </Button>
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={() => handleLoadSampleCSV("unclaimed")}
                          className="border-neutral-800 hover:bg-neutral-900 text-[10px] h-7 px-2 font-mono text-neutral-300 justify-start"
                        >
                          📜 Cat 1: State Unclaimed
                        </Button>
                      </div>
                    </div>

                    <div className="text-[10px] text-neutral-400 font-mono leading-relaxed bg-neutral-950 p-2.5 rounded border border-neutral-850">
                      Expected Column Header Order: <br />
                      <span className="text-orange-400">Name, Amount, State, AssetType, Custodian, CategoryId, Location, StateId</span>
                    </div>

                    <textarea
                      value={rawCSVInput}
                      onChange={e => setRawCSVInput(e.target.value)}
                      placeholder="Paste comma-separated rows or click a sample preset above..."
                      rows={8}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-orange-500 focus:ring-0 rounded-md font-mono text-xs text-neutral-200 p-3 leading-relaxed"
                    />

                    {csvPreviewError && (
                      <div className="p-2.5 bg-rose-950/20 border border-rose-500/30 rounded text-rose-400 text-xs font-mono">
                        ⚠️ {csvPreviewError}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <Button 
                        type="button"
                        onClick={handleParseCSV} 
                        className="bg-orange-600 hover:bg-orange-700 text-neutral-100 text-xs font-mono h-9 px-4"
                      >
                        Parse & Validate Rows
                      </Button>
                    </div>
                  </Card>
                </div>

                <div className="lg:col-span-7">
                  {importedRows.length > 0 ? (
                    <Card className="border-neutral-800 bg-[#0e0e11] p-5 space-y-4 shadow-xl animate-fade-in">
                      <div className="pb-3 border-b border-neutral-800 flex justify-between items-center">
                        <div>
                          <span className="text-xs font-mono font-bold text-emerald-400 block uppercase">PARSED SPREADSHEET PREVIEW</span>
                          <span className="text-[10px] text-neutral-500 font-mono">Ready for SQLite Batch Insertion across 12 categories</span>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono text-xs">
                          {importedRows.length} Rows Parsed
                        </Badge>
                      </div>

                      {/* Total Portfolio Metric */}
                      <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-850 font-mono">
                        <div>
                          <span className="text-[9px] uppercase text-neutral-500 block">Total Asset Value</span>
                          <span className="text-base font-bold text-emerald-400">
                            ${importedRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-neutral-500 block">Unique Categories</span>
                          <span className="text-base font-bold text-orange-400">
                            {new Set(importedRows.map(r => r.category_id)).size} / 12 Categories
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-72 border border-neutral-850 rounded">
                        <Table>
                          <TableHeader className="bg-neutral-950">
                            <TableRow className="border-neutral-850 hover:bg-transparent">
                              <TableHead className="font-mono text-[9px] uppercase px-2 py-1.5">Owner Name</TableHead>
                              <TableHead className="font-mono text-[9px] uppercase px-2 py-1.5 text-right">Amount</TableHead>
                              <TableHead className="font-mono text-[9px] uppercase px-2 py-1.5">State</TableHead>
                              <TableHead className="font-mono text-[9px] uppercase px-2 py-1.5">Asset Type / Custodian</TableHead>
                              <TableHead className="font-mono text-[9px] uppercase px-2 py-1.5">Category Tag</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importedRows.map((row, idx) => (
                              <TableRow key={idx} className="border-neutral-850 hover:bg-neutral-950/40 text-[11px]">
                                <TableCell className="px-2 py-1.5 font-medium text-neutral-200">{row.owner || `${row.first_name} ${row.last_name}`}</TableCell>
                                <TableCell className="text-right px-2 py-1.5 font-mono text-emerald-400 font-bold">${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="px-2 py-1.5 font-mono text-orange-400 font-bold">{row.state}</TableCell>
                                <TableCell className="px-2 py-1.5 text-neutral-400 text-[10px]">
                                  <div>{row.property_type}</div>
                                  <div className="text-neutral-500 font-mono">{row.company}</div>
                                </TableCell>
                                <TableCell className="px-2 py-1.5">
                                  <Badge className="bg-orange-500/10 text-orange-300 border-orange-500/20 text-[9px] font-mono py-0.5 px-1.5 whitespace-nowrap">
                                    Cat {row.category_id}: {row.category_shortName}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="pt-3 border-t border-neutral-800 flex justify-between items-center gap-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => setImportedRows([])}
                          className="text-neutral-400 text-xs h-9"
                        >
                          Discard
                        </Button>

                        <Button 
                          type="button"
                          onClick={handleBatchInsertToSqlite}
                          disabled={isBatchInserting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-neutral-100 text-xs font-mono h-9 px-4 flex items-center gap-2 shadow-lg"
                        >
                          {isBatchInserting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Inserting into SQLite DB...
                            </>
                          ) : (
                            <>
                              <Database className="w-4 h-4" />
                              Batch INSERT into SQLite Database ({importedRows.length} Rows)
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <div className="border border-dashed border-neutral-800 rounded-xl p-10 text-center text-neutral-500 bg-neutral-900/10 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-300 font-mono">12 Asset Category Ingestion Pipeline</p>
                        <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto leading-relaxed">
                          Paste your CSV data on the left or choose a sample preset, then click <strong>Parse & Validate Rows</strong> to review category mappings before performing an atomic batch INSERT into the SQLite database.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
