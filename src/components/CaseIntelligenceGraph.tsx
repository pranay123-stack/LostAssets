import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { CircleDot, FileText, Landmark, Link2, Network, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type NodeKind = "case" | "person" | "asset" | "document" | "lead";
type GraphNode = d3.SimulationNodeDatum & { id: string; label: string; kind: NodeKind; confidence: "Lead" | "Reviewed" | "Verified" };
type GraphLink = d3.SimulationLinkDatum<GraphNode> & { id: string; source: string | GraphNode; target: string | GraphNode; relation: string };

const STORAGE_KEY = "la-plus-case-intelligence-graph-v1";
const nodeMeta: Record<NodeKind, { label: string; color: string; Icon: typeof CircleDot }> = {
  case: { label: "Case", color: "#fb923c", Icon: CircleDot },
  person: { label: "Person", color: "#67e8f9", Icon: UserRound },
  asset: { label: "Asset", color: "#a7f3d0", Icon: Landmark },
  document: { label: "Document", color: "#c4b5fd", Icon: FileText },
  lead: { label: "Research lead", color: "#fcd34d", Icon: Link2 },
};

function initialGraph(): { nodes: GraphNode[]; links: GraphLink[] } {
  return { nodes: [{ id: "case-root", label: "Active case", kind: "case", confidence: "Reviewed" }], links: [] };
}

export function CaseIntelligenceGraph() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const graphRef = useRef<HTMLDivElement | null>(null);
  const [graph, setGraph] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : initialGraph(); } catch { return initialGraph(); }
  });
  const [kind, setKind] = useState<NodeKind>("person");
  const [label, setLabel] = useState("");
  const [relation, setRelation] = useState("");
  const [confidence, setConfidence] = useState<GraphNode["confidence"]>("Lead");
  const [selectedId, setSelectedId] = useState("case-root");

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(graph)); }, [graph]);

  useEffect(() => {
    const svgElement = svgRef.current;
    const container = graphRef.current;
    if (!svgElement || !container) return;
    const width = container.clientWidth || 900;
    const height = 440;
    const svg = d3.select(svgElement).attr("viewBox", `0 0 ${width} ${height}`).attr("width", width).attr("height", height);
    svg.selectAll("*").remove();
    const nodes = graph.nodes.map(node => ({ ...node }));
    const links = graph.links.map(link => ({ ...link }));
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id(node => node.id).distance(150).strength(0.7))
      .force("charge", d3.forceManyBody().strength(-650))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(45));
    const link = svg.append("g").selectAll("line").data(links).join("line").attr("stroke", "#334155").attr("stroke-width", 2);
    const linkLabel = svg.append("g").selectAll("text").data(links).join("text").attr("fill", "#94a3b8").attr("font-size", 11).attr("text-anchor", "middle").text(item => item.relation);
    const node = svg.append("g").selectAll("g").data(nodes).join("g").style("cursor", "pointer").on("click", (_event, item) => setSelectedId(item.id));
    node.append("circle").attr("r", item => item.kind === "case" ? 32 : 24).attr("fill", item => `${nodeMeta[item.kind].color}22`).attr("stroke", item => nodeMeta[item.kind].color).attr("stroke-width", item => item.id === selectedId ? 4 : 2);
    node.append("text").attr("text-anchor", "middle").attr("dy", 4).attr("fill", "#f8fafc").attr("font-size", 11).attr("font-weight", 700).text(item => item.label.length > 19 ? `${item.label.slice(0, 18)}…` : item.label);
    node.append("text").attr("text-anchor", "middle").attr("dy", 42).attr("fill", item => nodeMeta[item.kind].color).attr("font-size", 10).text(item => `${nodeMeta[item.kind].label} · ${item.confidence}`);
    node.call(d3.drag<SVGGElement, GraphNode>().on("start", event => { if (!event.active) simulation.alphaTarget(0.25).restart(); event.subject.fx = event.subject.x; event.subject.fy = event.subject.y; }).on("drag", event => { event.subject.fx = event.x; event.subject.fy = event.y; }).on("end", event => { if (!event.active) simulation.alphaTarget(0); event.subject.fx = null; event.subject.fy = null; }) as any);
    simulation.on("tick", () => {
      link.attr("x1", item => (item.source as GraphNode).x ?? 0).attr("y1", item => (item.source as GraphNode).y ?? 0).attr("x2", item => (item.target as GraphNode).x ?? 0).attr("y2", item => (item.target as GraphNode).y ?? 0);
      linkLabel.attr("x", item => (((item.source as GraphNode).x ?? 0) + ((item.target as GraphNode).x ?? 0)) / 2).attr("y", item => (((item.source as GraphNode).y ?? 0) + ((item.target as GraphNode).y ?? 0)) / 2 - 8);
      node.attr("transform", item => `translate(${item.x ?? 0},${item.y ?? 0})`);
    });
    return () => simulation.stop();
  }, [graph, selectedId]);

  const addNode = () => {
    if (!label.trim() || !relation.trim()) return;
    const id = `${kind}-${Date.now()}`;
    setGraph(current => ({ nodes: [...current.nodes, { id, label: label.trim(), kind, confidence }], links: [...current.links, { id: `link-${id}`, source: "case-root", target: id, relation: relation.trim() }] }));
    setSelectedId(id); setLabel(""); setRelation("");
  };
  const removeSelected = () => {
    if (selectedId === "case-root") return;
    setGraph(current => ({ nodes: current.nodes.filter(node => node.id !== selectedId), links: current.links.filter(link => String(typeof link.source === "string" ? link.source : link.source.id) !== selectedId && String(typeof link.target === "string" ? link.target : link.target.id) !== selectedId) }));
    setSelectedId("case-root");
  };
  const selected = graph.nodes.find(node => node.id === selectedId);

  return <Card className="border-neutral-850 bg-[#07131a] text-neutral-100"><CardHeader className="border-b border-neutral-900"><div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"><div><div className="flex items-center gap-2 text-[11px] font-mono font-bold tracking-[0.18em] text-violet-300 uppercase"><Network className="w-4 h-4" /> Obsidian-style graph</div><CardTitle className="text-xl mt-2">Case intelligence graph</CardTitle><CardDescription className="text-neutral-500 mt-1">Map what the case actually supports: people, assets, documents, and research leads. Connections are evidence labels, not conclusions.</CardDescription></div><div className="text-sm text-neutral-400 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2">{graph.nodes.length} nodes · {graph.links.length} connections</div></div></CardHeader><CardContent className="p-0"><div ref={graphRef} className="overflow-hidden bg-[#050911]"><svg ref={svgRef} className="block w-full h-[440px]" /></div><div className="p-5 border-t border-neutral-900 space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3"><div className="space-y-1.5"><Label>Node type</Label><select value={kind} onChange={event => setKind(event.target.value as NodeKind)} className="h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm">{Object.entries(nodeMeta).filter(([value]) => value !== "case").map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></div><div className="space-y-1.5"><Label>Label</Label><Input value={label} onChange={event => setLabel(event.target.value)} placeholder="Name or record title" className="bg-neutral-950 border-neutral-800" /></div><div className="space-y-1.5"><Label>Connection</Label><Input value={relation} onChange={event => setRelation(event.target.value)} placeholder="e.g., named in obituary" className="bg-neutral-950 border-neutral-800" /></div><div className="space-y-1.5"><Label>Evidence status</Label><select value={confidence} onChange={event => setConfidence(event.target.value as GraphNode["confidence"])} className="h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm"><option>Lead</option><option>Reviewed</option><option>Verified</option></select></div><div className="flex items-end"><Button onClick={addNode} className="w-full bg-violet-700 hover:bg-violet-600"><Plus className="w-4 h-4 mr-2" /> Connect to case</Button></div></div><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-sm"><div><span className="text-neutral-500">Selected:</span> <span className="text-neutral-100 font-medium">{selected?.label || "None"}</span>{selected && <span className="text-violet-300"> · {nodeMeta[selected.kind].label} · {selected.confidence}</span>}</div><Button variant="outline" disabled={selectedId === "case-root"} onClick={removeSelected} className="border-neutral-700 text-red-200 hover:text-red-100"><Trash2 className="w-4 h-4 mr-2" /> Remove selected</Button></div><div className="flex gap-2 text-xs text-neutral-500"><ShieldCheck className="w-4 h-4 shrink-0 text-emerald-300" />Use source citations and a reviewer before marking a node Verified. The graph is saved only in this browser until case-record persistence is enabled.</div></div></CardContent></Card>;
}
