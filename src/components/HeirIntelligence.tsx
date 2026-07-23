import { useMemo, useState } from "react";
import { ExternalLink, GitBranch, Link2, LockKeyhole, Network, Plus, SearchCheck, ShieldCheck, UserRoundSearch } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CaseIntelligenceGraph } from "./CaseIntelligenceGraph";

type Evidence = { candidate: string; relationship: string; source: string; status: "Lead" | "Corroborated" };

/**
 * An operator-controlled workspace. It intentionally does not call social
 * networks or create a finding: external tools remain local sidecars and an
 * operator records only reviewable evidence links here.
 */
export function HeirIntelligence() {
  const [caseAuthority, setCaseAuthority] = useState(false);
  const [subject, setSubject] = useState("");
  const [candidate, setCandidate] = useState("");
  const [relationship, setRelationship] = useState("");
  const [source, setSource] = useState("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [message, setMessage] = useState("");

  const corroborated = useMemo(() => evidence.filter(item => item.status === "Corroborated").length, [evidence]);
  const addEvidence = () => {
    if (!caseAuthority) { setMessage("Record case authority before adding an heir-research lead."); return; }
    if (!subject.trim() || !candidate.trim() || !relationship.trim() || !source.trim()) { setMessage("Add the subject, candidate, relationship, and a public-record or profile URL/source."); return; }
    setEvidence(current => [...current, { candidate: candidate.trim(), relationship: relationship.trim(), source: source.trim(), status: "Lead" }]);
    setCandidate(""); setRelationship(""); setSource(""); setMessage("Lead recorded. It remains unverified until a second independent source is reviewed.");
  };
  const corroborate = (index: number) => setEvidence(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, status: "Corroborated" } : item));

  return (
    <section className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 border-b border-neutral-900 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-[0.18em] text-cyan-300 uppercase"><Network className="w-4 h-4" /> Heir intelligence</div>
          <h2 className="text-2xl font-semibold text-neutral-50 mt-2">Public-record & relationship research</h2>
          <p className="text-sm text-neutral-400 mt-2 max-w-3xl">Three controlled tools: Maigret for public-profile corroboration, Gramps Web for the private family record, and a case evidence graph for reviewable relationships.</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-400">{evidence.length} leads · {corroborated} corroborated</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="border-neutral-850 bg-[#07131a] text-neutral-100"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><UserRoundSearch className="w-5 h-5 text-cyan-300" /> Maigret</CardTitle><CardDescription className="text-neutral-500">Public username and profile corroboration.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm text-neutral-400"><p>Use only after a documented case lead exists. Save source URLs and analyst notes—not copied profile content.</p><a className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200" href="https://github.com/soxoj/maigret" target="_blank" rel="noreferrer">Open project <ExternalLink className="w-3.5 h-3.5" /></a></CardContent></Card>
        <Card className="border-neutral-850 bg-[#07131a] text-neutral-100"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><GitBranch className="w-5 h-5 text-emerald-300" /> Gramps Web</CardTitle><CardDescription className="text-neutral-500">Private, self-hosted genealogy evidence record.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm text-neutral-400"><p>Use it for source-cited family relationships and document metadata. Keep it private; do not publish a case family tree.</p><a className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200" href="https://github.com/gramps-project/gramps-web" target="_blank" rel="noreferrer">Open project <ExternalLink className="w-3.5 h-3.5" /></a></CardContent></Card>
        <Card className="border-neutral-850 bg-[#07131a] text-neutral-100"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Link2 className="w-5 h-5 text-orange-300" /> Case graph</CardTitle><CardDescription className="text-neutral-500">Local relationship ledger; no automatic matching.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm text-neutral-400"><p>A relationship becomes corroborated only when a reviewer confirms independent evidence. Social similarity is never proof of heirship.</p><div className="text-xs text-orange-200">Legal authority and probate documents remain the controlling evidence.</div></CardContent></Card>
      </div>

      <Card className="border-neutral-850 bg-[#07131a] text-neutral-100"><CardHeader><CardTitle className="text-lg">Operator evidence intake</CardTitle><CardDescription className="text-neutral-500">Record a narrow research lead after authority is documented. This does not search social platforms, contact anyone, or determine eligibility.</CardDescription></CardHeader><CardContent className="space-y-4">
        <label className="flex gap-3 rounded-lg border border-orange-500/25 bg-orange-500/5 p-4 text-sm text-neutral-300 cursor-pointer"><input type="checkbox" checked={caseAuthority} onChange={event => setCaseAuthority(event.target.checked)} className="mt-1 h-4 w-4 accent-cyan-400" /><span><strong className="text-neutral-100">Authority verified.</strong> I have documented a lawful basis for this specific case and will use only permitted public sources. No automated outreach, identity decision, or claim filing is authorized.</span></label>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3"><div className="space-y-1.5"><Label>Estate subject</Label><Input value={subject} onChange={event => setSubject(event.target.value)} placeholder="Decedent / case subject" className="bg-neutral-950 border-neutral-800" /></div><div className="space-y-1.5"><Label>Candidate</Label><Input value={candidate} onChange={event => setCandidate(event.target.value)} placeholder="Potential relative" className="bg-neutral-950 border-neutral-800" /></div><div className="space-y-1.5"><Label>Stated relationship</Label><Input value={relationship} onChange={event => setRelationship(event.target.value)} placeholder="e.g., adult child" className="bg-neutral-950 border-neutral-800" /></div><div className="space-y-1.5"><Label>Evidence source / URL</Label><Input value={source} onChange={event => setSource(event.target.value)} placeholder="Court docket, obituary, public profile" className="bg-neutral-950 border-neutral-800" /></div></div>
        <div className="flex flex-wrap items-center gap-3"><Button onClick={addEvidence} className="bg-cyan-700 hover:bg-cyan-600"><Plus className="w-4 h-4 mr-2" /> Add reviewed lead</Button>{message && <span className="text-xs text-cyan-200">{message}</span>}</div>
      </CardContent></Card>

      <Card className="border-neutral-850 bg-[#07131a] text-neutral-100"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><SearchCheck className="w-5 h-5 text-cyan-300" /> Relationship evidence graph</CardTitle><CardDescription className="text-neutral-500">{subject ? `Case subject: ${subject}` : "Enter a case subject above to begin."}</CardDescription></CardHeader><CardContent>{evidence.length === 0 ? <div className="rounded-lg border border-dashed border-neutral-800 p-8 text-center text-sm text-neutral-500"><LockKeyhole className="w-5 h-5 mx-auto mb-2" />No relationships have been recorded. The graph intentionally remains empty until an operator adds source-cited evidence.</div> : <div className="space-y-3">{evidence.map((item, index) => <div key={`${item.candidate}-${index}`} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-4"><div><div className="font-medium text-neutral-100">{subject} <span className="text-cyan-300">— {item.relationship} →</span> {item.candidate}</div><div className="text-xs text-neutral-500 mt-1">Source: {item.source}</div></div><Button variant="outline" disabled={item.status === "Corroborated"} onClick={() => corroborate(index)} className="border-neutral-700">{item.status === "Corroborated" ? <><ShieldCheck className="w-4 h-4 mr-2 text-emerald-300" /> Corroborated</> : "Confirm second source"}</Button></div>)}</div>}</CardContent></Card>

      <CaseIntelligenceGraph />
    </section>
  );
}
