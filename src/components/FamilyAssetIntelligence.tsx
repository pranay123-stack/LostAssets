import { useMemo, useState } from "react";
import { BrainCircuit, LockKeyhole, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { scoreFamilyAssetIntelligence } from "../lib/familyAssetIntelligence";

export function FamilyAssetIntelligence() {
  const [input, setInput] = useState({ identityResolution: 70, deathEvidence: 40, probateEvidence: 20, relationshipEvidence: 60, addressContinuity: 50, localAssetSignals: 35, retirementSignals: 25, insuranceSignals: 15, probateAssetSignals: 20, deathCertificateVerified: false, authorityVerified: false });
  const result = useMemo(() => scoreFamilyAssetIntelligence(input), [input]);
  const change = (field: keyof typeof input, value: string) => setInput(current => ({ ...current, [field]: Number(value) || 0 }));
  const scores = [["Deceased-parent confidence", result.deceasedParentConfidence], ["Asset likelihood", result.assetLikelihood], ["Heir-path confidence", result.heirPathConfidence]];

  return <Card className="border-neutral-850 bg-[#07131a] text-neutral-100">
    <CardHeader><CardTitle className="flex items-center text-lg"><BrainCircuit className="w-5 h-5 mr-2 text-orange-400" /> Family Asset Intelligence</CardTitle><CardDescription className="text-neutral-500">Evidence-ranking support for potential deceased-parent assets. This model never establishes death, heirship, or claim entitlement.</CardDescription></CardHeader>
    <CardContent className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[["Identity resolution", "identityResolution"], ["Death evidence", "deathEvidence"], ["Probate evidence", "probateEvidence"], ["Relationship evidence", "relationshipEvidence"], ["Address continuity", "addressContinuity"], ["Local asset signals", "localAssetSignals"], ["Retirement signals", "retirementSignals"], ["Insurance signals", "insuranceSignals"], ["Probate asset signals", "probateAssetSignals"]].map(([label, field]) => <div key={field} className="space-y-1.5"><Label className="text-xs">{label}</Label><div className="relative"><Input type="number" min="0" max="100" value={input[field as keyof typeof input] as number} onChange={e => change(field as keyof typeof input, e.target.value)} className="bg-neutral-950 border-neutral-800 pr-12" /><span className="absolute right-3 top-2.5 text-[10px] text-neutral-500">0–100</span></div></div>)}
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <label className="flex items-start gap-2 rounded border border-neutral-800 bg-neutral-950/50 p-3 text-xs text-neutral-300"><input type="checkbox" checked={input.deathCertificateVerified} onChange={e => setInput(current => ({ ...current, deathCertificateVerified: e.target.checked }))} className="mt-0.5 accent-cyan-400" /> Official death record reviewed by an operator</label>
        <label className="flex items-start gap-2 rounded border border-neutral-800 bg-neutral-950/50 p-3 text-xs text-neutral-300"><input type="checkbox" checked={input.authorityVerified} onChange={e => setInput(current => ({ ...current, authorityVerified: e.target.checked }))} className="mt-0.5 accent-cyan-400" /> Beneficiary or estate authority reviewed by an operator</label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{scores.map(([label, value]) => <div key={label as string} className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-4"><div className="text-2xl font-semibold">{value as number}</div><div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-1">{label as string}</div></div>)}</div>
      <div className={`rounded-lg border p-4 ${result.evidenceReady ? "border-emerald-500/30 bg-emerald-500/5" : "border-orange-500/30 bg-orange-500/5"}`}><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="w-4 h-4 text-orange-400" /> {result.evidenceReady ? "Evidence gate complete" : "Evidence gate incomplete"}</div><p className="text-xs text-neutral-400 mt-1">{result.nextAction}</p><p className="text-[11px] text-orange-300 mt-2 flex items-center gap-1"><LockKeyhole className="w-3 h-3" /> No automated outreach, identity-gated search, claim submission, or advance decision.</p></div>
    </CardContent>
  </Card>;
}
