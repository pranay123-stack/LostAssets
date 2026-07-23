import { useEffect, useMemo, useState } from "react";
import { Bot, BriefcaseBusiness, CheckCircle2, Database, LockKeyhole, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { scoreProbateAdvance } from "../lib/probateRisk";
import { CaseWorkflowBuilder } from "./CaseWorkflowBuilder";
import { FamilyAssetIntelligence } from "./FamilyAssetIntelligence";
import { HeirIntelligence } from "./HeirIntelligence";

type ReclaimSummary = { totalCases: number; privacyReadyCases: number; agentReadyCases: number };

export function ReclaimIQ({ onOpenHermes }: { onOpenHermes: () => void }) {
  const [privacyAuthorized, setPrivacyAuthorized] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerState, setOwnerState] = useState("CA");
  const [ssnLast4, setSsnLast4] = useState("");
  const [vaultReference, setVaultReference] = useState("");
  const [summary, setSummary] = useState<ReclaimSummary>({ totalCases: 0, privacyReadyCases: 0, agentReadyCases: 0 });
  const [sidecarOnline, setSidecarOnline] = useState(false);
  const [message, setMessage] = useState("");
  const [underwriting, setUnderwriting] = useState({ heirEvidence: 80, assetLiquidity: 75, liabilityCertainty: 70, contestRisk: 20, stateComplexity: 35, dataFreshnessDays: 14, expectedNetShare: 100000, requestedAdvance: 20000, timelineMonths: 12, estateConcentrationPct: 10 });
  const score = useMemo(() => scoreProbateAdvance(underwriting), [underwriting]);
  const changeNumber = (field: keyof typeof underwriting, value: string) => setUnderwriting(current => ({ ...current, [field]: Number(value) || 0 }));

  const loadSummary = async () => {
    const response = await fetch("/api/reclaim-iq/summary");
    if (response.ok) setSummary(await response.json());
  };

  useEffect(() => {
    void loadSummary();
    fetch("/api/sidecar/status").then(response => response.json()).then(data => setSidecarOnline(data.online === true)).catch(() => setSidecarOnline(false));
  }, []);

  const saveQueueItem = async () => {
    if (!ownerName.trim()) { setMessage("Add the participant or decedent name before saving a queue item."); return; }
    const response = await fetch("/api/reclaim-iq/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerName, ownerState, ssnLast4, vaultReference, privacyAuthorized })
    });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Could not save the queue item."); return; }
    setMessage(`Saved ${data.caseId}. ${privacyAuthorized ? "Privacy-gated planning is enabled." : "Agent planning remains locked."}`);
    setOwnerName(""); setSsnLast4(""); setVaultReference("");
    await loadSummary();
  };

  return (
    <div className="space-y-7 animate-fade-in pb-16">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono font-bold tracking-[0.18em] text-orange-400 uppercase mb-2"><BriefcaseBusiness className="w-4 h-4" /> High-value recovery <span className={`normal-case tracking-normal rounded border px-2 py-0.5 ${sidecarOnline ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-neutral-700 bg-neutral-900 text-neutral-500"}`}>Realtime sidecar: {sidecarOnline ? "local online" : "offline"}</span></div>
          <h1 className="text-3xl font-semibold text-neutral-50">Reclaim IQ</h1>
          <p className="text-sm text-neutral-400 mt-2 max-w-3xl">A controlled retirement, pension, and abandoned-plan recovery engine for verified high-value work.</p>
        </div>
        <Button onClick={onOpenHermes} variant="outline" className="border-neutral-800"><Bot className="w-4 h-4 mr-2" /> Open Hermes queue</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ["Queue records", summary.totalCases, Database],
          ["Privacy-ready", summary.privacyReadyCases, ShieldCheck],
          ["Agent-ready", summary.agentReadyCases, Bot],
        ].map(([label, count, Icon]) => {
          const MetricIcon = Icon as typeof Database;
          return <Card key={label as string} className="border-neutral-850 bg-[#07131a] text-neutral-100"><CardContent className="p-5 flex items-center justify-between"><div><div className="text-3xl font-semibold">{count as number}</div><div className="text-xs text-neutral-500 mt-1">{label as string}</div></div><MetricIcon className="w-6 h-6 text-orange-400" /></CardContent></Card>;
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <Card className="xl:col-span-3 border-neutral-850 bg-[#07131a] text-neutral-100">
          <CardHeader><CardTitle className="text-lg">Retirement recovery queue</CardTitle><CardDescription className="text-neutral-500">Create a high-value research record. Full SSNs are intentionally not accepted or stored here.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Participant or decedent name</Label><Input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Full legal name" className="bg-neutral-950 border-neutral-800" /></div>
            <div className="space-y-2"><Label>Last known state</Label><Input value={ownerState} maxLength={2} onChange={e => setOwnerState(e.target.value.toUpperCase())} className="bg-neutral-950 border-neutral-800" /></div>
            <div className="space-y-2"><Label>SSN last four (optional)</Label><Input value={ssnLast4} maxLength={4} inputMode="numeric" onChange={e => setSsnLast4(e.target.value.replace(/\D/g, ""))} placeholder="Never enter a full SSN" className="bg-neutral-950 border-neutral-800" /></div>
            <div className="space-y-2"><Label>Approved identity-vault reference (optional)</Label><Input value={vaultReference} onChange={e => setVaultReference(e.target.value)} placeholder="External vault reference only" className="bg-neutral-950 border-neutral-800" /></div>
            <div className="md:col-span-2 rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 flex gap-3">
              <input id="privacy-authorized" type="checkbox" checked={privacyAuthorized} onChange={e => setPrivacyAuthorized(e.target.checked)} className="mt-1 h-4 w-4 accent-cyan-400" />
              <label htmlFor="privacy-authorized" className="text-xs leading-relaxed text-neutral-300 cursor-pointer"><strong className="text-neutral-100">Authorization recorded.</strong> I have a lawful basis and documented consent/authority to use protected identity data for this specific retirement-recovery case. This unlocks agent planning only; external searches, outreach, claims, and submissions still require operator approval.</label>
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3"><Button onClick={saveQueueItem} className="bg-orange-600 hover:bg-orange-700 text-white"><UserRoundCheck className="w-4 h-4 mr-2" /> Save to Reclaim IQ</Button>{message && <span className="text-xs text-orange-300">{message}</span>}</div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-neutral-850 bg-[#07131a] text-neutral-100">
          <CardHeader><CardTitle className="text-lg flex items-center"><LockKeyhole className="w-5 h-5 mr-2 text-orange-400" /> Privacy-gated workflow</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm text-neutral-400">
            <div className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /><span>Public and locally indexed research may run without sensitive identifiers.</span></div>
            <div className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /><span>With recorded authority, agents may prepare a source checklist, search plan, document request list, and audit log.</span></div>
            <div className="flex gap-3"><LockKeyhole className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" /><span>Identity-proofed portals, outreach, filing, payments, and legal attestations remain human-approved actions.</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-neutral-850 bg-[#07131a] text-neutral-100">
        <CardHeader>
          <CardTitle className="text-lg">Probate advance risk & pricing scenario</CardTitle>
          <CardDescription className="text-neutral-500">Explainable internal scenario model. It is not an offer, APR calculation, legal classification, or funding authorization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              ["Heir evidence", "heirEvidence", "0–100"], ["Asset liquidity", "assetLiquidity", "0–100"], ["Liability certainty", "liabilityCertainty", "0–100"], ["Contest risk", "contestRisk", "0–100"], ["State complexity", "stateComplexity", "0–100"],
              ["Data age", "dataFreshnessDays", "days"], ["Expected net share", "expectedNetShare", "USD"], ["Requested advance", "requestedAdvance", "USD"], ["Timeline", "timelineMonths", "months"], ["Estate concentration", "estateConcentrationPct", "%"],
            ].map(([label, field, suffix]) => <div key={field} className="space-y-1.5"><Label className="text-xs">{label}</Label><div className="relative"><Input type="number" value={underwriting[field as keyof typeof underwriting]} onChange={e => changeNumber(field as keyof typeof underwriting, e.target.value)} className="bg-neutral-950 border-neutral-800 pr-12" /><span className="absolute right-3 top-2.5 text-[10px] text-neutral-500">{suffix}</span></div></div>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[["Heir confidence", score.heirConfidence], ["Estate quality", score.estateQuality], ["Timeline risk", score.timelineScore], ["Exposure", score.exposureScore], ["Composite", score.composite]].map(([label, value]) => <div key={label as string} className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-4"><div className="text-2xl font-semibold text-neutral-100">{value as number}</div><div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">{label as string}</div></div>)}
          </div>
          <div className={`rounded-lg border p-4 ${score.hardStop ? "border-red-500/30 bg-red-500/5" : "border-orange-500/30 bg-orange-500/5"}`}><div className="text-sm font-semibold text-neutral-100">{score.pricingBand}</div><div className="text-xs text-neutral-400 mt-1">LTV-style ratio: {score.ltv}% · All pricing remains subject to legal/compliance review and human underwriting approval.</div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{score.drivers.map(driver => <div key={driver} className="text-xs text-neutral-400 border border-neutral-850 rounded p-3">{driver}</div>)}</div>
        </CardContent>
      </Card>

      <CaseWorkflowBuilder />

      <FamilyAssetIntelligence />

      <HeirIntelligence />
    </div>
  );
}
