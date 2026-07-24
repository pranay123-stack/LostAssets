import { useEffect, useState } from "react";
import { Download, LockKeyhole, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { insertBatchToBrowserDb, type AssetRecord } from "../lib/db";

type LiteRecord = {
  id: string;
  firstName: string;
  lastName: string;
  state: string;
  city: string;
  propertyType: string;
  amount: number;
  holder: string;
  source: string;
};

const LOADED_VERSION_KEY = "la_plus_lite_heir_bundle_version";

export function LiteDataAccess() {
  const [accessCode, setAccessCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loadedVersion, setLoadedVersion] = useState(() => localStorage.getItem(LOADED_VERSION_KEY));

  useEffect(() => {
    fetch("/api/auth/session").then((response) => response.json()).then((data) => setAuthenticated(data.authenticated === true)).catch(() => setMessage("Secure lite data is available from the Vercel deployment after its environment variables are set."));
  }, []);

  async function signIn() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessCode }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sign-in failed.");
      setAuthenticated(true);
      setAccessCode("");
      setMessage("Signed in. The lite bundle can now be loaded into this browser.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBundle() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/lite-records", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load the lite bundle.");
      const records: AssetRecord[] = (data.records as LiteRecord[]).map((record) => ({
        first_name: record.firstName,
        last_name: record.lastName,
        state: record.state,
        property_type: record.propertyType,
        amount: record.amount,
        company: record.holder,
        location: [record.city, record.state].filter(Boolean).join(", "),
        state_id: record.id,
        category_id: "1",
        category_title: "State Unclaimed Property",
        sub_type: record.propertyType,
        source: `Protected lite bundle · ${record.source}`,
      }));
      await insertBatchToBrowserDb(records);
      const version = String(data.version || "1");
      localStorage.setItem(LOADED_VERSION_KEY, version);
      setLoadedVersion(version);
      setMessage(`${records.length.toLocaleString()} protected lite records are now available in this browser's Asset DB and Database Explorer.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load the lite bundle.");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setAuthenticated(false);
    setMessage("Signed out. Existing browser data remains on this device until it is cleared in Database Explorer.");
  }

  return <div className="max-w-3xl space-y-6 animate-fade-in">
    <div className="border-b border-neutral-900 pb-5">
      <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-orange-400 uppercase mb-2">Protected source bundle</div>
      <h2 className="text-3xl font-bold tracking-tight">Lite heir-data access</h2>
      <p className="text-sm text-neutral-400 mt-2">Ranks 51–500: 450 records from the two supplied workbooks. The web bundle contains only name, city/state, holder, asset type, amount, and source file—not street address, ZIP, CUSIP, or SSN data.</p>
    </div>

    <Card className="border-neutral-800 bg-[#07131a] text-neutral-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Sign-in required</CardTitle>
        <CardDescription className="text-neutral-400">A valid session is held in an HttpOnly, same-site cookie for eight hours. Anyone who loads records into a browser can export that browser's local copy.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!authenticated ? <div className="flex flex-col sm:flex-row gap-3">
          <Input aria-label="Lite data access code" type="password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} onKeyDown={(event) => event.key === "Enter" && signIn()} placeholder="Enter the organization access code" className="bg-neutral-950 border-neutral-700 text-base h-12" />
          <Button onClick={signIn} disabled={loading || !accessCode} className="h-12 text-base"><LockKeyhole className="w-4 h-4 mr-2" />{loading ? "Checking…" : "Sign in"}</Button>
        </div> : <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={loadBundle} disabled={loading || Boolean(loadedVersion)} className="h-12 text-base"><Download className="w-4 h-4 mr-2" />{loading ? "Loading…" : loadedVersion ? "Lite bundle loaded" : "Load 450 records"}</Button>
          <Button onClick={signOut} variant="outline" className="h-12 text-base border-neutral-700"><LogOut className="w-4 h-4 mr-2" />Sign out</Button>
        </div>}
        {message && <p className="rounded-md border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-200">{message}</p>}
      </CardContent>
    </Card>
  </div>;
}
