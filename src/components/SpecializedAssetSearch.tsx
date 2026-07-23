import React, { useRef, useState } from "react";
import { 
  Building2, 
  Landmark, 
  ShieldCheck, 
  FileText, 
  Briefcase, 
  KeyRound, 
  Coins, 
  Scale, 
  Pickaxe, 
  Award, 
  Zap, 
  Scroll, 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  FolderPlus, 
  AlertCircle, 
  Download, 
  ChevronRight, 
  Sparkles, 
  Info, 
  Layers, 
  CheckSquare, 
  Square, 
  Send, 
  FileCheck,
  UserCheck,
  ShieldAlert,
  HelpCircle,
  X,
  Database
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { cn } from "../lib/utils";
import { insertRecordToBrowserDb } from "../lib/db";

export interface SpecializedRecord {
  id: string;
  ownerName: string;
  decedentName?: string;
  categoryNumber: number;
  categoryTitle: string;
  subType: string;
  amount: number;
  state: string;
  custodianAgency: string;
  portalUrl: string;
  requiredDocuments: string[];
  recoveryProcess: string;
  finderRules: string;
  probabilityScore: number;
  stateIdRef?: string;
  ssnMatch?: string;
  source: string;
}

interface SpecializedAssetSearchProps {
  onSaveCase?: (newCase: {
    id: string;
    categoryName: string;
    status: string;
    createdAt: string;
    notes: string;
    assets: { description: string; amount: number; location: string }[];
    executors?: { name: string; email: string; phone: string; address: string }[];
  }) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ASSET_CATEGORIES_DATA = [
  {
    id: 1,
    title: "State Unclaimed Property (NAUPA)",
    shortName: "State Unclaimed",
    icon: Building2,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    recoveryProcess: "Search official state databases or MissingMoney.com portal (NAUPA). File claims online or by certified mail with state treasurer/controller. States review proof of ownership/heirship and remit directly.",
    requiredDocs: ["Government-issued Photo ID", "Proof of Address / SSN", "Death Certificate + Heir Documentation (if deceased)", "Original Account Statements / Corporate Records"],
    signupRules: "Free public search for owners/heirs. Finders need state-specific registration/licensing (e.g., IL application, fee, background check). Statutory fee caps apply (e.g. 10% max fee in CA).",
    dataStrategy: "Use MissingMoney.com and individual state controller portals. Build internal database from successful claims, public reports, and multi-state logs. Agentic workflows handle name/address variations."
  },
  {
    id: 2,
    title: "Abandoned Pensions / PBGC Benefits",
    shortName: "Pensions & PBGC",
    icon: Briefcase,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    recoveryProcess: "Search PBGC 'Find unclaimed retirement benefits' database (Name + last 4 SSN). Contact PBGC or ERISA plan administrator to verify vested accrued benefit.",
    requiredDocs: ["Identity Verification / ID", "Employment History / W-2 / Pay Stubs", "Plan Details (if known)", "Death Certificate + Beneficiary Proof (if applicable)"],
    signupRules: "Free public search. No special finder license required for searching, but fee arrangements must comply with general finder rules and ERISA guidelines.",
    dataStrategy: "PBGC provides searchable tools and downloadable plan lists. Maintain internal index of high-probability employer/plan combinations. Cross-reference with state unclaimed property."
  },
  {
    id: 3,
    title: "U.S. Savings Bonds (Matured / Unredeemed)",
    shortName: "Savings Bonds",
    icon: Landmark,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    recoveryProcess: "Search via Treasury Hunt / Treasury tools or state unclaimed property offices. File Treasury Form 1048 for lost/stolen bonds or manual Treasury search.",
    requiredDocs: ["Owner Name & SSN", "Approximate Issue Date / Series (Series E, EE, I)", "Proof of Ownership or Heirship", "Bond Serial Numbers (if known)"],
    signupRules: "Free public Treasury tools. Finders follow state unclaimed property rules when matured bonds have escheated to state custody.",
    dataStrategy: "Treasury Hunt and state portals. Build internal records of client/heir bond claims. Systematize searches with name/SSN variations under human oversight."
  },
  {
    id: 4,
    title: "Life Insurance Benefits & VA Policy Funds",
    shortName: "Life Insurance & VA",
    icon: ShieldCheck,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    recoveryProcess: "Search state unclaimed property, insurer lost-policy tools, and VA Unclaimed Funds Search. For VA policy funds, Form 29-541 (Certificate Showing Residence and Heirs) is required.",
    requiredDocs: ["Death Certificate", "VA Form 29-541", "Policy Number or Description", "Beneficiary Designation / Photo ID"],
    signupRules: "Free public searches (VA and state). No federal finder license for VA; state finder rules apply if funds are in state custody.",
    dataStrategy: "VA searchable tool + state databases + commercial lost-policy registries. Internal database of death records matched to potential policy indicators."
  },
  {
    id: 5,
    title: "Securities, Dividends & Brokerage Residuals",
    shortName: "Stocks & Dividends",
    icon: Coins,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    recoveryProcess: "Primarily through state unclaimed property (escheatment). Transfer agents (Computershare/AST) or SEC Fair Funds distribution administrators for harmed investor funds.",
    requiredDocs: ["Proof of Stock Ownership (Statements/Certificates)", "Identity / SSN", "SEC Case Claim Form (for Fair Funds)", "Corporate Entity Tax ID"],
    signupRules: "State finder rules apply for escheated stock. SEC distributions are open claims processes—no special finder registration beyond standard transparent disclosure.",
    dataStrategy: "State unclaimed property databases + SEC 'Distributions to Harmed Investors' page. Build internal tracking of open fair funds and corporate action remnants."
  },
  {
    id: 6,
    title: "Safe Deposit Box Contents (Tangible Property)",
    shortName: "Safe Deposit Vault",
    icon: KeyRound,
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    recoveryProcess: "Appears in state unclaimed property. Claim requires proof of box tenancy or heirship; states conduct vault inventories or remit net auction proceeds.",
    requiredDocs: ["Box Rental Lease / Key Receipt", "Government ID", "Death / Heir Documents", "Court Order for Disputed Heirship"],
    signupRules: "Same as general state unclaimed property finders. Written contract and state licensing compliance required.",
    dataStrategy: "State databases (flagged as 'safe deposit' or 'tangible'). Track high-value box inventories in internal system for case-by-case recovery."
  },
  {
    id: 7,
    title: "Tax Refunds & FHA/HUD Mortgage Refunds",
    shortName: "Tax & HUD Refunds",
    icon: FileText,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    recoveryProcess: "IRS 'Where's My Refund' for tax items; HUD database for FHA mortgage insurance premium refunds. Submit closing docs or tax return details.",
    requiredDocs: ["Tax Return Copies / W-2", "SSN / ITIN", "HUD-1 Settlement Statement / Closing Docs", "Direct Deposit Wire Info"],
    signupRules: "Free public tools. Limited finder role—claims are primarily owner-driven. Finders cannot charge fees for simple HUD refund lookups.",
    dataStrategy: "Official IRS/HUD tools. Internal matching of client tax or mortgage histories against federal overpayment ledgers."
  },
  {
    id: 8,
    title: "Class Action & Court / Bankruptcy Unclaimed",
    shortName: "Class Action & Courts",
    icon: Scale,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    recoveryProcess: "Search settlement administrator portals, court unclaimed funds ledgers, and U.S. Bankruptcy Court unclaimed funds. Submit Proof of Claim with court clerk.",
    requiredDocs: ["Proof of Class Membership / Purchase / Injury", "Identity Verification", "Signed Court Proof of Claim Form"],
    signupRules: "Open claims processes. Fee agreements must be transparent and compliant with local court rules.",
    dataStrategy: "Monitor major settlement administrator portals, bankruptcy court ledgers (PACER), and public notices. Build internal tracker of open distributions."
  },
  {
    id: 9,
    title: "Mineral Rights, Oil & Gas Royalties",
    shortName: "Mineral & Royalties",
    icon: Pickaxe,
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    recoveryProcess: "Title research in county recorder records, energy operator division order inquiries, state unclaimed property for accumulated royalties, and probate cure.",
    requiredDocs: ["Mineral Deed / Lease Copy", "Division Order Confirmation", "Probate Order / Heirship Affidavit", "Well API Identification Number"],
    signupRules: "No single national license; real estate/title and landman rules apply. Local landman licensing or bonding required in certain oil-producing states.",
    dataStrategy: "County clerk/recorder portals, state unclaimed property, commercial mineral databases. Build proprietary ownership and heir graph over time."
  },
  {
    id: 10,
    title: "VA Benefits & Veterans' Funds (Non-Insurance)",
    shortName: "VA Veterans' Funds",
    icon: Award,
    color: "text-red-400 bg-red-500/10 border-red-500/20",
    recoveryProcess: "VA-specific claims processes for accrued unpaid disability/pension benefits upon veteran death. Direct submission to VA Regional Offices.",
    requiredDocs: ["DD-214 Military Discharge Papers", "Death Certificate", "Marriage / Birth Relationship Proof", "VA Form 21P-530 (Burial Allowance)"],
    signupRules: "Free VA tools. VA accreditation (38 C.F.R.) required to represent claimants or charge fees for VA benefit claims.",
    dataStrategy: "VA portals + public military/death records. Internal matching of veteran records to accrued unpaid benefits."
  },
  {
    id: 11,
    title: "Utility Deposits & Corporate Overpayments",
    shortName: "Utility & Overpayments",
    icon: Zap,
    color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    recoveryProcess: "Usually via state unclaimed property or direct utility customer balance resolution. Straightforward verification and remittance.",
    requiredDocs: ["Service Address Utility Bill", "Corporate W-9 / Tax ID", "Invoice Credit Memo", "Identity Proof"],
    signupRules: "Standard state finder rules and statutory fee caps.",
    dataStrategy: "State databases. High volume, lower average value—ideal for automated screening and batch processing."
  },
  {
    id: 12,
    title: "Probate Residuals, Missing Heirs & Estates",
    shortName: "Probate & Heirs",
    icon: Scroll,
    color: "text-amber-300 bg-amber-500/15 border-amber-400/30",
    recoveryProcess: "Court probate dockets, unclaimed estate distribution registries, direct heir location, and non-recourse advances against expected distributions.",
    requiredDocs: ["Letters Testamentary / Administration", "Death Certificate of Decedent", "Certified Heirship Chart / Genealogy", "Probate Court Order"],
    signupRules: "Public court access. Heir locator contracts and non-recourse inheritance advances subject to state probate laws and consumer disclosure rules.",
    dataStrategy: "Public court dockets, genealogy databases, state unclaimed property. Build longitudinal database of estates, heirs, and non-recourse outcomes."
  }
];

export function SpecializedAssetSearch({ onSaveCase, onNavigateToTab }: SpecializedAssetSearchProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchPurpose, setSearchPurpose] = useState<"presearch" | "verified_case">("presearch");
  const [paperworkVerified, setPaperworkVerified] = useState(false);
  const [ownerName, setOwnerName] = useState<string>("Thomson Diggs");
  const [decedentName, setDecedentName] = useState<string>("");
  const [state, setState] = useState<string>("CA");
  const [ssnLast4, setSsnLast4] = useState<string>("");
  const [refNumber, setRefNumber] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("500");

  // Category-specific parameters
  const [catParam1, setCatParam1] = useState<string>("");
  const [catParam2, setCatParam2] = useState<string>("");

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [results, setResults] = useState<SpecializedRecord[]>([]);
  const [searchMessage, setSearchMessage] = useState<string>("");
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  // Modal State for Protocol & Details
  const [activeProtocolRecord, setActiveProtocolRecord] = useState<SpecializedRecord | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [savedSqliteIds, setSavedSqliteIds] = useState<string[]>([]);
  const [isSavingSqlite, setIsSavingSqlite] = useState<boolean>(false);

  const saveRecordToSqliteDb = async (record: SpecializedRecord) => {
    try {
      const parts = (record.ownerName || "").trim().split(" ");
      const fName = parts[0] || "";
      const lName = parts.slice(1).join(" ") || "";

      // Save to in-browser SQLite database (sql.js)
      await insertRecordToBrowserDb({
        first_name: fName,
        last_name: lName,
        state: record.state,
        property_type: record.subType,
        amount: record.amount,
        company: record.custodianAgency,
        location: `${record.state} | Agency: ${record.custodianAgency}`,
        state_id: record.stateIdRef || `SPEC-${record.id}`,
        category_id: String(record.categoryNumber),
        category_title: record.categoryTitle,
        sub_type: record.subType,
        decedent_name: record.decedentName || null,
        ssn_last4: record.ssnMatch ? record.ssnMatch.slice(-4) : null,
        source: record.source || "12-Category Asset Engine"
      });

      // Save to server endpoint
      await fetch("/api/sqlite/insert-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: fName,
          last_name: lName,
          state: record.state,
          property_type: record.subType,
          amount: record.amount,
          company: record.custodianAgency,
          location: `${record.state} | Agency: ${record.custodianAgency}`,
          state_id: record.stateIdRef || `SPEC-${record.id}`,
          category_id: String(record.categoryNumber),
          category_title: record.categoryTitle,
          sub_type: record.subType,
          decedent_name: record.decedentName || null,
          ssn_last4: record.ssnMatch ? record.ssnMatch.slice(-4) : null,
          source: record.source || "12-Category Asset Engine"
        })
      });
      return true;
    } catch (err) {
      console.error("SQLite insert failed:", err);
      return false;
    }
  };

  const handleSaveSingleToSQLite = async (record: SpecializedRecord) => {
    const success = await saveRecordToSqliteDb(record);
    if (success) {
      setSavedSqliteIds(prev => [...new Set([...prev, record.id])]);
      setSaveSuccessMessage(`Asset "${record.subType}" ($${record.amount.toLocaleString()}) persisted to local SQLite database!`);
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    }
  };

  const handleSaveSelectedToSQLite = async () => {
    const selectedList = results.filter(r => selectedRecordIds.includes(r.id));
    if (selectedList.length === 0) return;

    setIsSavingSqlite(true);
    let successCount = 0;
    const newSavedIds: string[] = [];

    for (const item of selectedList) {
      const ok = await saveRecordToSqliteDb(item);
      if (ok) {
        successCount++;
        newSavedIds.push(item.id);
      }
    }

    setIsSavingSqlite(false);
    if (successCount > 0) {
      setSavedSqliteIds(prev => [...new Set([...prev, ...newSavedIds])]);
      setSaveSuccessMessage(`Successfully saved ${successCount} asset records into SQLite database (data.sqlite)!`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    }
  };

  // Active Category Detail View for intelligence tab
  const [activeDetailCatId, setActiveDetailCatId] = useState<number | null>(1);

  const handleExecuteSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSearching) return;
    if (searchPurpose === "verified_case" && !paperworkVerified) {
      setHasSearched(true);
      setResults([]);
      setSearchMessage("Verified case search is locked until an operator confirms the required authority and paperwork have been reviewed.");
      return;
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsSearching(true);
    setResults([]);
    setSearchMessage("");
    setCategoryCounts({});
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => setElapsedSeconds(seconds => seconds + 1), 1000);

    try {
      const response = await fetch("/api/specialized-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName,
          decedentName,
          categoryId: selectedCategoryId,
          state,
          ssnLast4,
          refNumber,
          minAmount: parseFloat(minAmount) || 0,
          catParam1,
          catParam2
        }),
        signal: controller.signal
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.records)) {
        setResults(data.records);
        setSelectedRecordIds(data.records.map((r: SpecializedRecord) => r.id));
        setCategoryCounts(data.categoryCounts || {});
        setSearchMessage(searchPurpose === "presearch"
          ? `${data.message || "Search complete."} Pre-search results are estimates and leads, not a claim determination.`
          : data.message || "Verified case search complete.");
      } else {
        setSearchMessage(data.message || "The search could not be completed.");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Failed to run specialized search:", err);
      setSearchMessage("The local search service is unavailable. Please try again.");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      abortControllerRef.current = null;
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const handleStopSearch = () => {
    abortControllerRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    abortControllerRef.current = null;
    setIsSearching(false);
    setSearchMessage("Search stopped. No results were saved.");
  };

  const handleSaveSelectedToCRM = () => {
    const selectedList = results.filter(r => selectedRecordIds.includes(r.id));
    if (selectedList.length === 0) return;

    const totalVal = selectedList.reduce((sum, r) => sum + r.amount, 0);
    const batchDate = new Date().toISOString().slice(0, 10);
    const categoryLabel = selectedCategoryId === "all"
      ? "Verified local search"
      : selectedList[0]?.categoryTitle || "Specialized claim";
    const catName = `${ownerName.trim() || "Unknown owner"} · ${state} · ${categoryLabel} · ${batchDate}`;

    const newCase = {
      id: `SPEC-CRM-${Date.now().toString(36).toUpperCase()}`,
      categoryName: catName,
      status: "Lead",
      createdAt: new Date().toISOString(),
      notes: `Verified local-index batch: ${selectedList.length} record${selectedList.length === 1 ? "" : "s"}; target ${ownerName}; jurisdiction ${state}; total $${totalVal.toLocaleString()}.`,
      assets: selectedList.map(item => ({
        description: `[Category ${item.categoryNumber}] ${item.subType} - Ref: ${item.stateIdRef || 'N/A'} (${item.custodianAgency})`,
        amount: item.amount,
        location: `${item.state} | ${item.custodianAgency}`
      })),
      executors: decedentName ? [{
        name: ownerName,
        email: "heir.contact@investigation.internal",
        phone: "(555) 019-2834",
        address: `${state}, United States`
      }] : []
    };

    if (onSaveCase) {
      onSaveCase(newCase);
    }

    setSaveSuccessMessage(`Successfully saved ${selectedList.length} specialized leads totaling $${totalVal.toLocaleString()} to Saved Case CRM Folders!`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const toggleRecordSelection = (id: string) => {
    if (selectedRecordIds.includes(id)) {
      setSelectedRecordIds(selectedRecordIds.filter(i => i !== id));
    } else {
      setSelectedRecordIds([...selectedRecordIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRecordIds.length === results.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(results.map(r => r.id));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* 1. Header & Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-900 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-orange-400 text-xs font-mono font-bold uppercase bg-orange-400/10 px-2 py-0.5 rounded border border-orange-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              12-Field Asset Recovery Engine
            </span>
            <Badge variant="outline" className="border-neutral-800 bg-neutral-900 text-neutral-300 font-mono text-[10px]">
              Multi-Registry Search & CRM Integration
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 mt-2 flex items-center gap-2">
            Specialized Asset & Claim Investigation Hub
          </h1>
          <p className="text-neutral-400 text-xs mt-1 max-w-3xl">
            Unified multi-field search engine spanning state unclaimed property, abandoned PBGC pensions, U.S. savings bonds, VA life insurance, SEC fair funds, mineral royalties, class actions, and court probate residuals.
          </p>
        </div>

        {onNavigateToTab && (
          <Button
            onClick={() => onNavigateToTab("saved_cases")}
            variant="outline"
            size="sm"
            className="border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-orange-400" />
            View Saved Case Folders
          </Button>
        )}
      </div>

      {/* Save Success Alert Notification */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="flex-1 font-semibold">{saveSuccessMessage}</span>
          <button onClick={() => setSaveSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Search Query Controls */}
      <Card className="border-neutral-850 bg-neutral-950 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-orange-400" />
            <h2 className="text-xs font-mono uppercase font-bold tracking-wider text-neutral-200">
              Query Parameters & Target Search Profile
            </h2>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">
            Covers 12 NAUPA, PBGC, Treasury & Court Portals
          </span>
        </div>

        <form onSubmit={handleExecuteSearch} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-neutral-850 bg-neutral-900/30 p-3">
            <button type="button" onClick={() => setSearchPurpose("presearch")} className={cn("text-left rounded-lg border p-3 transition-colors", searchPurpose === "presearch" ? "border-orange-500/50 bg-orange-500/10" : "border-neutral-800 bg-neutral-950/40")}>
              <div className="text-xs font-semibold text-neutral-100">Pre-search estimate</div>
              <p className="text-[11px] text-neutral-500 mt-1">Use basic identity/context to rank local matches and create a 12-field research plan. No claim-ready conclusion.</p>
            </button>
            <button type="button" onClick={() => setSearchPurpose("verified_case")} className={cn("text-left rounded-lg border p-3 transition-colors", searchPurpose === "verified_case" ? "border-emerald-500/50 bg-emerald-500/10" : "border-neutral-800 bg-neutral-950/40")}>
              <div className="text-xs font-semibold text-neutral-100">Verified case search</div>
              <p className="text-[11px] text-neutral-500 mt-1">Use after authority, claimant paperwork, and source-specific privacy requirements are reviewed.</p>
            </button>
            {searchPurpose === "verified_case" && <label className="md:col-span-2 flex items-start gap-2 text-xs text-neutral-300"><input type="checkbox" checked={paperworkVerified} onChange={e => setPaperworkVerified(e.target.checked)} className="mt-0.5 accent-cyan-400" /> I confirm an operator reviewed required claim authority, identity/relationship evidence, and the source-specific privacy path. This does not authorize filing or outreach.</label>}
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3 text-[11px] text-neutral-400">
            <span className="font-semibold text-neutral-200">Source validation:</span> Field 1 can return verified matches from the local state-unclaimed-property index. Fields 2–12 produce a governed case checklist until an approved data import or source connector is available; identity-gated sources remain claimant/human-operated.
          </div>
          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Owner / Claimant Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-medium text-neutral-400 flex items-center justify-between">
                <span>Owner / Claimant Name *</span>
                <span className="text-neutral-600 text-[10px]">Primary</span>
              </label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Thomson Diggs"
                className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100 font-mono h-9 focus:border-orange-500/60"
                required
              />
            </div>

            {/* Decedent / Estate Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-medium text-neutral-400 flex items-center justify-between">
                <span>Decedent / Estate Name</span>
                <span className="text-neutral-600 text-[10px]">Optional</span>
              </label>
              <Input
                value={decedentName}
                onChange={(e) => setDecedentName(e.target.value)}
                placeholder="e.g. Diggs (Estate of)"
                className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100 font-mono h-9 focus:border-orange-500/60"
              />
            </div>

            {/* Jurisdiction State */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-medium text-neutral-400">Jurisdiction / State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 h-9 px-3 focus:border-orange-500/60 focus:outline-none"
              >
                {["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI", "NJ", "VA", "WA", "AZ", "MA", "ALL"].map(st => (
                  <option key={st} value={st}>{st === "ALL" ? "All US States & Territories" : `State of ${st}`}</option>
                ))}
              </select>
            </div>

            {/* SSN Last 4 / Tax ID */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-medium text-neutral-400 flex items-center justify-between">
                <span>SSN Last 4 / Tax ID</span>
                <span className="text-neutral-600 text-[10px]">For PBGC / IRS</span>
              </label>
              <Input
                value={ssnLast4}
                onChange={(e) => setSsnLast4(e.target.value)}
                placeholder="e.g. 4812"
                maxLength={4}
                className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100 font-mono h-9 focus:border-orange-500/60"
              />
            </div>

            {/* Reference Number / Policy / Docket */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-medium text-neutral-400">Policy # / Ref # / Docket #</label>
              <Input
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                placeholder="e.g. VA-29-541 or BK-2026"
                className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100 font-mono h-9 focus:border-orange-500/60"
              />
            </div>

            {/* Minimum Claim Amount Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-medium text-neutral-400">Min Claim Value ($)</label>
              <select
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 h-9 px-3 focus:border-orange-500/60 focus:outline-none"
              >
                <option value="0">Any Amount ($0+)</option>
                <option value="500">Above $500</option>
                <option value="1000">Above $1,000</option>
                <option value="2500">Above $2,500</option>
                <option value="5000">Above $5,000 (High-Value)</option>
                <option value="10000">Above $10,000 (Institutional)</option>
              </select>
            </div>

            {/* Target Asset Field Category */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-mono font-medium text-neutral-400 flex items-center justify-between">
                <span>Category Scope (12 Fields)</span>
                <span className="text-orange-400 text-[10px] font-semibold font-mono">
                  {selectedCategoryId === "all" ? "All 12 Recovery Fields Active" : `Field #${selectedCategoryId} Selected`}
                </span>
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 h-9 px-3 focus:border-orange-500/60 focus:outline-none"
              >
                <option value="all">⚡ Search ALL 12 Asset Recovery Fields Simultaneously</option>
                {ASSET_CATEGORIES_DATA.map(cat => (
                  <option key={cat.id} value={String(cat.id)}>
                    Field {cat.id}: {cat.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Category-Specific Specialized Inputs */}
          {selectedCategoryId !== "all" && (() => {
            const catNum = parseInt(selectedCategoryId);
            const catSpecs: Record<number, { p1Label: string; p1Placeholder: string; p2Label: string; p2Placeholder: string }> = {
              1: { p1Label: "NAUPA Property Type Code", p1Placeholder: "e.g. AC01 (Checking), CK01 (Cashier Check)", p2Label: "Original Remitter / Holder Name", p2Placeholder: "e.g. Wells Fargo / PacBell" },
              2: { p1Label: "Pension Plan / Employer Name", p1Placeholder: "e.g. General Motors Retirement Trust", p2Label: "W-2 Employer Tax ID (EIN)", p2Placeholder: "e.g. 95-1234567" },
              3: { p1Label: "Savings Bond Series", p1Placeholder: "e.g. Series E, Series EE, Series HH, Series I", p2Label: "Bond Issue Year Range", p2Placeholder: "e.g. 1975-1998" },
              4: { p1Label: "Insurer Name / Policy #", p1Placeholder: "e.g. Prudential / VA-29-541", p2Label: "VA Form 29-541 Heir Certificate ID", p2Placeholder: "e.g. VA-CERT-8841" },
              5: { p1Label: "Transfer Agent / Brokerage", p1Placeholder: "e.g. Computershare / AST Financial", p2Label: "Stock CUSIP / SEC Action ID", p2Placeholder: "e.g. SEC-3-18920" },
              6: { p1Label: "Bank / Vault Branch Location", p1Placeholder: "e.g. BofA Downtown Los Angeles", p2Label: "Safe Deposit Box # / Lease Ref", p2Placeholder: "e.g. Box #1408" },
              7: { p1Label: "FHA / HUD Case Number", p1Placeholder: "e.g. FHA-192-840192", p2Label: "IRS Tax Year / Return Ref", p2Placeholder: "e.g. Tax Year 2022" },
              8: { p1Label: "Bankruptcy Docket / Case Ref", p1Placeholder: "e.g. BK-22-10842-USBC", p2Label: "Class Settlement Administrator", p2Placeholder: "e.g. Epiq Systems / Kroll" },
              9: { p1Label: "Well API # / Lease Name", p1Placeholder: "e.g. API-42-301-12345", p2Label: "County Deed Book / Page #", p2Placeholder: "e.g. Book 412, Pg 98" },
              10: { p1Label: "DD-214 Military Service #", p1Placeholder: "e.g. USMC-7810-992", p2Label: "VA Claim File Number", p2Placeholder: "e.g. C-18492019" },
              11: { p1Label: "Utility Company Account #", p1Placeholder: "e.g. PG&E Account #99102-1", p2Label: "Service Location Address", p2Placeholder: "e.g. 1044 Market St, SF" },
              12: { p1Label: "Probate Court Docket #", p1Placeholder: "e.g. PR-2025-008912", p2Label: "Intestate Heir Affidavit Ref", p2Placeholder: "e.g. HEIR-AFF-2026-X" }
            };

            const spec = catSpecs[catNum] || { p1Label: "Specific Parameter 1", p1Placeholder: "Enter search value", p2Label: "Specific Parameter 2", p2Placeholder: "Enter search value" };

            return (
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 space-y-3 animate-in fade-in">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                    Field #{catNum} Category-Specific Query Controls
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-medium text-neutral-300">{spec.p1Label}</label>
                    <Input
                      value={catParam1}
                      onChange={(e) => setCatParam1(e.target.value)}
                      placeholder={spec.p1Placeholder}
                      className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100 font-mono h-9 focus:border-orange-500/60"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-medium text-neutral-300">{spec.p2Label}</label>
                    <Input
                      value={catParam2}
                      onChange={(e) => setCatParam2(e.target.value)}
                      placeholder={spec.p2Placeholder}
                      className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100 font-mono h-9 focus:border-orange-500/60"
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Category Filter Pills Grid */}
          <div className="pt-2 border-t border-neutral-900/80 space-y-2">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              Quick Category Filter
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategoryId("all")}
                className={cn(
                  "text-[10px] font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer flex items-center gap-1",
                  selectedCategoryId === "all"
                    ? "bg-orange-500 text-black border-orange-400 font-bold shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                    : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:bg-neutral-850"
                )}
              >
                <Layers className="w-3 h-3" />
                ALL 12 FIELDS
              </button>
              {ASSET_CATEGORIES_DATA.map(cat => {
                const IconComponent = cat.icon;
                const isSel = selectedCategoryId === String(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(String(cat.id))}
                    className={cn(
                      "text-[10px] font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer flex items-center gap-1.5",
                      isSel
                        ? "bg-neutral-800 text-orange-400 border-orange-500/60 font-bold shadow-sm"
                        : "bg-neutral-900/80 text-neutral-400 border-neutral-850 hover:text-neutral-200 hover:bg-neutral-900"
                    )}
                  >
                    <IconComponent className={cn("w-3 h-3", isSel ? "text-orange-400" : "text-neutral-500")} />
                    <span>#{cat.id} {cat.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Action Submit Button */}
          <div className="flex flex-wrap justify-end items-center gap-3 pt-2">
            {isSearching && (
              <div className="text-xs font-mono text-orange-300 rounded-lg border border-orange-500/25 bg-orange-500/10 px-3 py-2">
                {elapsedSeconds < 15
                  ? `Searching local index · estimated ${String(15 - elapsedSeconds).padStart(2, "0")}s remaining`
                  : `Finalizing query · ${elapsedSeconds}s elapsed`}
              </div>
            )}
            {isSearching && (
              <Button
                type="button"
                onClick={handleStopSearch}
                variant="outline"
                className="border-red-500/40 text-red-300 hover:bg-red-500/10 font-bold font-mono text-xs px-5 h-10 rounded-xl"
              >
                Stop Search
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSearching}
              className="bg-orange-500 hover:bg-orange-600 text-black font-bold font-mono text-xs px-6 h-10 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.25)] flex items-center gap-2 cursor-pointer transition-all"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Executing verified local search...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Execute Search
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. Search Results Section */}
      {hasSearched && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900/40 border border-neutral-850 p-4 rounded-xl">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-neutral-100 uppercase tracking-wider">
                  {results.length} Verified Local Match{results.length === 1 ? "" : "es"}
                </span>
                <span className="text-neutral-600">•</span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  Total Identified Value: ${results.reduce((sum, r) => sum + r.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-450 mt-0.5">
                Target: <strong className="text-neutral-200">{ownerName}</strong> {decedentName ? `(${decedentName})` : ''} | Jurisdiction: <strong className="text-neutral-200">{state}</strong>
              </p>
              {searchMessage && <p className="text-[11px] font-mono text-orange-300 mt-2">{searchMessage}</p>}
              {Object.keys(categoryCounts).length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 max-w-3xl">
                  {Object.entries(categoryCounts).map(([categoryId, count]) => (
                    <div key={categoryId} className="rounded border border-neutral-800 bg-neutral-950/60 px-2 py-1.5 text-[10px] font-mono text-neutral-400">
                      Field {categoryId}: <span className={count > 0 ? "text-emerald-400 font-bold" : "text-neutral-600"}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {results.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="h-8 border-neutral-800 bg-neutral-950 text-neutral-300 font-mono text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {selectedRecordIds.length === results.length ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-orange-400" />
                        Deselect All ({results.length})
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-neutral-400" />
                        Select All ({results.length})
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSaveSelectedToCRM}
                    disabled={selectedRecordIds.length === 0}
                    className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-40"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    Save Selected ({selectedRecordIds.length}) to CRM
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSaveSelectedToSQLite}
                    disabled={selectedRecordIds.length === 0 || isSavingSqlite}
                    className="h-8 bg-orange-500 hover:bg-orange-400 text-black font-bold font-mono text-xs flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-40"
                  >
                    {isSavingSqlite ? (
                      <>
                        <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Persisting...
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5" />
                        Sync to SQLite DB ({selectedRecordIds.length})
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          {results.length === 0 ? (
            <Card className="border-neutral-850 bg-neutral-950 p-12 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-neutral-600 mx-auto" />
              <h3 className="text-base font-bold text-neutral-200">No matching claims found</h3>
              <p className="text-xs text-neutral-450 max-w-md mx-auto">
                No unclaimed assets matched the criteria under threshold ${minAmount}. Try lowering the minimum value or searching all jurisdictions.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {results.map((rec) => {
                const isSelected = selectedRecordIds.includes(rec.id);
                const catMeta = ASSET_CATEGORIES_DATA.find(c => c.id === rec.categoryNumber);
                const IconComp = catMeta?.icon || Building2;

                return (
                  <Card
                    key={rec.id}
                    className={cn(
                      "border-neutral-850 bg-neutral-950 rounded-2xl overflow-hidden transition-all duration-200 hover:border-neutral-700",
                      isSelected && "border-orange-500/60 bg-[#061019] ring-1 ring-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                    )}
                  >
                    {/* Record Header */}
                    <div className="bg-neutral-900/60 border-b border-neutral-850 p-4 flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <button
                          type="button"
                          onClick={() => toggleRecordSelection(rec.id)}
                          className={cn(
                            "mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0",
                            isSelected
                              ? "bg-orange-500 border-orange-400 text-black shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                              : "border-neutral-700 bg-neutral-900 hover:border-neutral-500 text-transparent"
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <div>
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-orange-500/20 bg-orange-500/10 text-orange-400 flex items-center gap-1">
                              <IconComp className="w-3 h-3" />
                              Field #{rec.categoryNumber}: {rec.categoryTitle}
                            </span>
                            <Badge variant="outline" className="border-neutral-800 bg-neutral-900 text-neutral-300 font-mono text-[10px]">
                              {rec.state}
                            </Badge>
                          </div>

                          <h3 className="text-sm font-bold text-neutral-100 font-mono mt-1.5">
                            {rec.subType}
                          </h3>
                          <p className="text-[10px] font-mono text-neutral-450 mt-0.5">
                            Owner: <strong className="text-neutral-200">{rec.ownerName}</strong> {rec.decedentName ? `| Estate: ${rec.decedentName}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Claim Value */}
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold font-mono text-emerald-400">
                          ${rec.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500 block mt-0.5">
                          Match Score: {rec.probabilityScore}%
                        </span>
                      </div>
                    </div>

                    {/* Record Body */}
                    <CardContent className="p-4 space-y-4">
                      {/* Details Meta Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-neutral-900/30 border border-neutral-850 p-3 rounded-xl">
                        <div>
                          <span className="text-neutral-500 text-[10px] uppercase block">Custodian Agency</span>
                          <span className="text-neutral-200 font-medium truncate block">{rec.custodianAgency}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 text-[10px] uppercase block">Reference ID</span>
                          <span className="text-orange-400 font-semibold">{rec.stateIdRef || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Document Requirements Preview */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase text-neutral-400 font-semibold flex items-center gap-1">
                          <FileCheck className="w-3 h-3 text-orange-400" />
                          Required Claim Documentation:
                        </span>
                        <div className="grid grid-cols-1 gap-1 pl-1">
                          {rec.requiredDocuments.slice(0, 3).map((doc, dIdx) => (
                            <div key={dIdx} className="text-[11px] font-mono text-neutral-300 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                              <span className="truncate">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-neutral-900 flex items-center justify-between gap-2 flex-wrap">
                        <a
                          href={rec.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-mono text-neutral-400 hover:text-orange-400 flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Official Portal
                        </a>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveProtocolRecord(rec)}
                            className="h-7 px-2.5 border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Info className="w-3 h-3 text-orange-400" />
                            Recovery Guide
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savedSqliteIds.includes(rec.id)}
                            onClick={() => handleSaveSingleToSQLite(rec)}
                            className={cn(
                              "h-7 px-2.5 font-mono text-[10px] flex items-center gap-1 cursor-pointer transition-all",
                              savedSqliteIds.includes(rec.id)
                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                                : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-orange-300"
                            )}
                          >
                            <Database className="w-3 h-3" />
                            {savedSqliteIds.includes(rec.id) ? "Saved in SQLite" : "Save to SQLite"}
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => toggleRecordSelection(rec.id)}
                            className={cn(
                              "h-7 px-3 font-mono text-[10px] font-semibold cursor-pointer transition-all",
                              isSelected 
                                ? "bg-orange-500/20 border border-orange-500/40 text-orange-400" 
                                : "bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800"
                            )}
                          >
                            {isSelected ? "Selected" : "Select Lead"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Category Intelligence & Field Reference Guides (All 12 Categories) */}
      <div className="pt-6 border-t border-neutral-900 space-y-6">
        <div>
          <span className="text-orange-400 text-xs font-mono font-bold uppercase bg-orange-400/10 px-2 py-0.5 rounded border border-orange-500/20">
            Field Intelligence Reference
          </span>
          <h2 className="text-xl font-bold tracking-tight text-neutral-100 mt-2">
            12 Specialized Asset Recovery Field Protocols & Regulations
          </h2>
          <p className="text-neutral-400 text-xs mt-1">
            Comprehensive recovery process, required filing documentation, finder fee regulations, and database strategies for each asset class.
          </p>
        </div>

        {/* 12 Categories Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {ASSET_CATEGORIES_DATA.map((cat) => {
            const IconComp = cat.icon;
            const isActive = activeDetailCatId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveDetailCatId(cat.id)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2",
                  isActive
                    ? "bg-neutral-900 border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                    : "bg-neutral-950 border-neutral-850 hover:bg-neutral-900/50 hover:border-neutral-750"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-neutral-500">Field #{cat.id}</span>
                  <IconComp className={cn("w-4 h-4", isActive ? "text-orange-400" : "text-neutral-500")} />
                </div>
                <span className={cn("text-xs font-bold font-mono line-clamp-1", isActive ? "text-orange-400" : "text-neutral-300")}>
                  {cat.shortName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Comprehensive Intelligence Card */}
        {activeDetailCatId && (() => {
          const detailCat = ASSET_CATEGORIES_DATA.find(c => c.id === activeDetailCatId);
          if (!detailCat) return null;
          const DetailIcon = detailCat.icon;

          return (
            <Card className="border-neutral-850 bg-neutral-950 p-6 rounded-2xl space-y-6 shadow-xl animate-in fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-900 pb-4">
                <div className="flex items-center space-x-3">
                  <div className={cn("p-2.5 rounded-xl border", detailCat.color)}>
                    <DetailIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider block">
                      Asset Recovery Field #{detailCat.id}
                    </span>
                    <h3 className="text-lg font-bold text-neutral-100 font-mono">
                      {detailCat.title}
                    </h3>
                  </div>
                </div>

                <Badge variant="outline" className="border-neutral-800 bg-neutral-900 text-neutral-300 font-mono text-xs">
                  Active Field Protocol
                </Badge>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Recovery Process */}
                <div className="space-y-2 bg-neutral-900/40 border border-neutral-850 p-4 rounded-xl">
                  <span className="text-xs font-mono font-bold uppercase text-orange-400 flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4" />
                    Recovery Process
                  </span>
                  <p className="text-xs text-neutral-300 font-mono leading-relaxed">
                    {detailCat.recoveryProcess}
                  </p>
                </div>

                {/* 2. Documents Typically Required */}
                <div className="space-y-2 bg-neutral-900/40 border border-neutral-850 p-4 rounded-xl">
                  <span className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4" />
                    Documents Typically Required
                  </span>
                  <ul className="space-y-1">
                    {detailCat.requiredDocs.map((doc, idx) => (
                      <li key={idx} className="text-xs font-mono text-neutral-300 flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Sign-up / Access & Licensing Rules */}
                <div className="space-y-2 bg-neutral-900/40 border border-neutral-850 p-4 rounded-xl">
                  <span className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Sign-Up, Access & Licensing Rules
                  </span>
                  <p className="text-xs text-neutral-300 font-mono leading-relaxed">
                    {detailCat.signupRules}
                  </p>
                </div>

                {/* 4. Database & Data Strategy */}
                <div className="space-y-2 bg-neutral-900/40 border border-neutral-850 p-4 rounded-xl">
                  <span className="text-xs font-mono font-bold uppercase text-purple-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    Database & Data Strategy
                  </span>
                  <p className="text-xs text-neutral-300 font-mono leading-relaxed">
                    {detailCat.dataStrategy}
                  </p>
                </div>
              </div>
            </Card>
          );
        })()}
      </div>

      {/* 5. Recovery Protocol Dialog Modal */}
      {activeProtocolRecord && (
        <Dialog open={!!activeProtocolRecord} onOpenChange={() => setActiveProtocolRecord(null)}>
          <DialogContent className="bg-neutral-950 border-neutral-850 text-neutral-200 max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-orange-400 font-mono text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                Specialized Claim Protocol — Field #{activeProtocolRecord.categoryNumber}
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-xs font-mono mt-1">
                {activeProtocolRecord.categoryTitle} | Ref: {activeProtocolRecord.stateIdRef || 'N/A'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 text-xs font-mono mt-3">
              {/* Claim Summary Box */}
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block">Target Owner</span>
                  <span className="text-sm font-bold text-neutral-100">{activeProtocolRecord.ownerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 uppercase block">Claim Value</span>
                  <span className="text-base font-bold text-emerald-400">${activeProtocolRecord.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Step 1: Recovery Process */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-orange-400 uppercase text-[11px] flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  Step 1: Filing Procedure & Workflow
                </h4>
                <p className="text-neutral-300 leading-relaxed bg-neutral-900/50 p-3 rounded-lg border border-neutral-850">
                  {activeProtocolRecord.recoveryProcess}
                </p>
              </div>

              {/* Step 2: Required Documentation Checklist */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-emerald-400 uppercase text-[11px] flex items-center gap-1">
                  <FileCheck className="w-4 h-4" />
                  Step 2: Mandatory Documentation Checklist
                </h4>
                <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-850 space-y-2">
                  {activeProtocolRecord.requiredDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-neutral-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Finder Fee & Regulatory Compliance */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-cyan-400 uppercase text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  Step 3: Finder Fee & Regulatory Rules
                </h4>
                <p className="text-neutral-300 leading-relaxed bg-neutral-900/50 p-3 rounded-lg border border-neutral-850">
                  {activeProtocolRecord.finderRules}
                </p>
              </div>

              {/* Official Portal Access */}
              <div className="pt-2 flex justify-between items-center border-t border-neutral-900">
                <span className="text-[10px] text-neutral-500">
                  Custodian: {activeProtocolRecord.custodianAgency}
                </span>
                <a
                  href={activeProtocolRecord.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-orange-500 hover:bg-orange-600 text-black font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Official Registry Portal
                </a>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveProtocolRecord(null)}
                className="border-neutral-800 text-neutral-300 font-mono text-xs cursor-pointer"
              >
                Close Protocol Guide
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
