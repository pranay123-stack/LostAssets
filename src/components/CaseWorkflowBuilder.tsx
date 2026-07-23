import { useMemo, useState } from "react";
import { Bot, LockKeyhole, Workflow } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { buildCaseWorkflow, type AssetLocation, type ClaimantPath } from "../lib/caseWorkflow";

export function CaseWorkflowBuilder() {
  const [claimantPath, setClaimantPath] = useState<ClaimantPath>("living_owner");
  const [assetLocation, setAssetLocation] = useState<AssetLocation>("state_held");
  const [stateCode, setStateCode] = useState("CA");
  const [generated, setGenerated] = useState(false);
  const workflow = useMemo(() => buildCaseWorkflow(claimantPath, assetLocation, stateCode), [claimantPath, assetLocation, stateCode]);

  return <Card className="border-neutral-850 bg-[#07131a] text-neutral-100">
    <CardHeader><CardTitle className="flex items-center text-lg"><Workflow className="w-5 h-5 mr-2 text-orange-400" /> Per-case agent workflow</CardTitle><CardDescription className="text-neutral-500">Generate a governed workflow for a recovery case. Agents prepare and monitor; humans approve consequential actions.</CardDescription></CardHeader>
    <CardContent className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5"><Label>Claimant path</Label><select value={claimantPath} onChange={e => setClaimantPath(e.target.value as ClaimantPath)} className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"><option value="living_owner">Living owner</option><option value="named_beneficiary">Named beneficiary</option><option value="estate_heir">Estate / heir</option></select></div>
        <div className="space-y-1.5"><Label>Asset location</Label><select value={assetLocation} onChange={e => setAssetLocation(e.target.value as AssetLocation)} className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm"><option value="state_held">State unclaimed property</option><option value="plan_administrator">Plan administrator</option><option value="pbgc">PBGC</option><option value="dol_lost_found">DOL Lost & Found</option></select></div>
        <div className="space-y-1.5"><Label>State</Label><input value={stateCode} maxLength={2} onChange={e => setStateCode(e.target.value.toUpperCase())} className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm" /></div>
      </div>
      <Button onClick={() => setGenerated(true)} className="bg-orange-600 hover:bg-orange-700 text-white"><Bot className="w-4 h-4 mr-2" /> Generate case workflow</Button>
      {generated && <div className="space-y-3">{workflow.map(stage => <div key={stage.title} className="rounded-lg border border-neutral-800 bg-neutral-950/45 p-4"><div className="font-semibold text-neutral-100">{stage.title}</div><p className="text-xs text-neutral-500 mt-1">{stage.objective}</p><div className="mt-3 space-y-2">{stage.tasks.map(task => <div key={task.title} className="flex gap-2 text-xs text-neutral-300"><span className="shrink-0 rounded border border-neutral-700 px-1.5 py-0.5 font-mono text-[10px] text-orange-300">{task.owner}</span><span>{task.title}{task.gate && <span className="block text-orange-300 mt-0.5"><LockKeyhole className="inline w-3 h-3 mr-1" />{task.gate}</span>}</span></div>)}</div></div>)}</div>}
    </CardContent>
  </Card>;
}
