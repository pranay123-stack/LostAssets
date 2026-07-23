import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Users, ZoomIn, ZoomOut, RotateCcw, Share2, Info, CheckCircle2, ShieldAlert, Sparkles, MapPin, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export interface HeirNodeData {
  id: string;
  name: string;
  relation: string;
  dob?: string;
  phone?: string;
  location?: string;
  email?: string;
  claimShare?: string;
  status?: "Verified Heir" | "Potential Heir" | "Deceased" | "Associate" | "Primary Subject";
  children?: HeirNodeData[];
}

interface HeirTreeVisualizerProps {
  targetName?: string;
  relativesData?: any[];
  onSelectPerson?: (person: HeirNodeData) => void;
}

const DEFAULT_TREE_DATA: HeirNodeData = {
  id: "root-1",
  name: "Thomson Diggs",
  relation: "Primary Estate Subject",
  dob: "1954-08-12",
  phone: "(555) 019-2834",
  location: "Los Angeles, CA",
  email: "t.diggs@estate-legacy.org",
  claimShare: "100% Owner ($84,500)",
  status: "Primary Subject",
  children: [
    {
      id: "spouse-1",
      name: "Eleanor Diggs (Vance)",
      relation: "Surviving Spouse",
      dob: "1958-03-22",
      phone: "(555) 234-5678",
      location: "Pasadena, CA",
      email: "eleanor.v.diggs@gmail.com",
      claimShare: "50% Statutory Heir",
      status: "Verified Heir",
      children: [
        {
          id: "child-1",
          name: "Marcus Diggs",
          relation: "Son (Direct Heir)",
          dob: "1984-11-05",
          phone: "(555) 881-2049",
          location: "San Francisco, CA",
          email: "marcus.diggs@techcorp.io",
          claimShare: "25% Residuary",
          status: "Verified Heir"
        },
        {
          id: "child-2",
          name: "Clara Diggs-Miller",
          relation: "Daughter (Direct Heir)",
          dob: "1988-06-19",
          phone: "(555) 302-9911",
          location: "San Diego, CA",
          email: "clara.miller@designstudio.net",
          claimShare: "25% Residuary",
          status: "Verified Heir"
        }
      ]
    },
    {
      id: "sibling-1",
      name: "Michael Diggs",
      relation: "Brother (Collateral Heir)",
      dob: "1956-11-30",
      phone: "(555) 987-6543",
      location: "Dayton, OH",
      email: "m.diggs@ohio-industrial.com",
      claimShare: "Secondary Contingent",
      status: "Potential Heir"
    },
    {
      id: "associate-1",
      name: "Sarah Williams",
      relation: "Co-Deed Holder / Associate",
      dob: "1960-02-14",
      phone: "(555) 123-9999",
      location: "Columbus, OH",
      email: "swilliams@columbus-realty.org",
      claimShare: "Deed Co-Interest",
      status: "Associate"
    }
  ]
};

export const HeirTreeVisualizer: React.FC<HeirTreeVisualizerProps> = ({
  targetName,
  relativesData,
  onSelectPerson
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<any>(null);

  const [selectedNode, setSelectedNode] = useState<HeirNodeData | null>(DEFAULT_TREE_DATA);
  const [layoutDirection, setLayoutDirection] = useState<"horizontal" | "vertical">("horizontal");

  // Construct active hierarchy data
  const getTreeData = (): HeirNodeData => {
    if (!relativesData || relativesData.length === 0) {
      if (targetName && targetName.trim().length > 0) {
        return {
          ...DEFAULT_TREE_DATA,
          name: targetName
        };
      }
      return DEFAULT_TREE_DATA;
    }

    const primaryName = targetName && targetName.trim().length > 0 ? targetName : "Target Subject";

    const convertedChildren: HeirNodeData[] = relativesData.map((r, i) => ({
      id: `rel-${i}`,
      name: r.name || `Relative #${i + 1}`,
      relation: r.relation || "Kin Connection",
      dob: r.dob || "1980-01-01",
      phone: r.phone || "(555) 000-0000",
      location: r.loc || r.location || "United States",
      status: r.relation?.toLowerCase().includes("spouse") || r.relation?.toLowerCase().includes("child") 
        ? "Verified Heir" 
        : "Potential Heir"
    }));

    return {
      id: "root-dynamic",
      name: primaryName,
      relation: "Primary Estate / Search Subject",
      dob: "1965-05-15",
      phone: "(555) 441-9000",
      location: "United States",
      status: "Primary Subject",
      children: convertedChildren
    };
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const data = getTreeData();
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = 480;

    // Clear previous elements
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#090d14")
      .style("cursor", "grab");

    // Container Group for Zoom/Pan
    const g = svg.append("g").attr("class", "main-group");

    // Setup D3 Zoom
    const zoom = d3.zoom().scaleExtent([0.4, 2.5]).on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

    svg.call(zoom as any);
    zoomBehaviorRef.current = zoom;

    // Initial transform
    const initialTransform = d3.zoomIdentity.translate(layoutDirection === "horizontal" ? 90 : width / 2, layoutDirection === "horizontal" ? height / 2 - 20 : 60).scale(0.9);
    svg.call(zoom.transform as any, initialTransform);

    // Create D3 Hierarchy & Tree Layout
    const root = d3.hierarchy<HeirNodeData>(data);

    const isHoriz = layoutDirection === "horizontal";
    const treeLayout = d3.tree<HeirNodeData>()
      .size(isHoriz ? [height - 100, width - 260] : [width - 160, height - 160]);

    treeLayout(root);

    // Color mapper for statuses
    const getStatusColor = (status?: string) => {
      switch (status) {
        case "Primary Subject":
          return { stroke: "#f97316", fill: "#1c0d02", badgeBg: "#f97316", text: "#fdba74" };
        case "Verified Heir":
          return { stroke: "#10b981", fill: "#021a12", badgeBg: "#10b981", text: "#6ee7b7" };
        case "Potential Heir":
          return { stroke: "#3b82f6", fill: "#061329", badgeBg: "#3b82f6", text: "#93c5fd" };
        case "Associate":
          return { stroke: "#a855f7", fill: "#150724", badgeBg: "#a855f7", text: "#d8b4fe" };
        default:
          return { stroke: "#f59e0b", fill: "#191203", badgeBg: "#f59e0b", text: "#fcd34d" };
      }
    };

    // Draw Links (Curved Paths)
    const linkGenerator = d3.linkHorizontal<any, d3.HierarchyPointNode<HeirNodeData>>()
      .x((d) => (isHoriz ? d.y : d.x))
      .y((d) => (isHoriz ? d.x : d.y));

    const linkGeneratorVertical = d3.linkVertical<any, d3.HierarchyPointNode<HeirNodeData>>()
      .x((d) => d.x)
      .y((d) => d.y);

    g.selectAll(".tree-link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "tree-link")
      .attr("d", (isHoriz ? linkGenerator : linkGeneratorVertical) as any)
      .attr("fill", "none")
      .attr("stroke", "#334155")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d) => (d.target.data.status === "Potential Heir" ? "4,4" : "none"))
      .attr("opacity", 0.85);

    // Draw Nodes
    const nodeG = g
      .selectAll(".tree-node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "tree-node")
      .attr("transform", (d) => `translate(${isHoriz ? d.y : d.x},${isHoriz ? d.x : d.y})`)
      .style("cursor", "pointer")
      .on("click", (_event, d) => {
        setSelectedNode(d.data);
        if (onSelectPerson) onSelectPerson(d.data);
      });

    // Node Box Cards
    const boxWidth = 180;
    const boxHeight = 56;

    nodeG
      .append("rect")
      .attr("x", -boxWidth / 2)
      .attr("y", -boxHeight / 2)
      .attr("width", boxWidth)
      .attr("height", boxHeight)
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("fill", (d) => getStatusColor(d.data.status).fill)
      .attr("stroke", (d) => getStatusColor(d.data.status).stroke)
      .attr("stroke-width", (d) => (d.data.id === selectedNode?.id ? 3 : 1.5))
      .attr("filter", (d) => (d.data.status === "Primary Subject" ? "drop-shadow(0 0 8px rgba(249,115,22,0.4))" : "none"))
      .attr("class", "transition-all duration-200 hover:brightness-125");

    // Node Status Badge Dot
    nodeG
      .append("circle")
      .attr("cx", -boxWidth / 2 + 16)
      .attr("cy", -boxHeight / 2 + 16)
      .attr("r", 5)
      .attr("fill", (d) => getStatusColor(d.data.status).stroke);

    // Node Name
    nodeG
      .append("text")
      .attr("x", -boxWidth / 2 + 28)
      .attr("y", -boxHeight / 2 + 19)
      .attr("fill", "#f8fafc")
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("font-family", "monospace")
      .text((d) => (d.data.name.length > 18 ? d.data.name.substring(0, 16) + "..." : d.data.name));

    // Relation Subtext
    nodeG
      .append("text")
      .attr("x", -boxWidth / 2 + 14)
      .attr("y", -boxHeight / 2 + 37)
      .attr("fill", (d) => getStatusColor(d.data.status).text)
      .attr("font-size", "9.5px")
      .attr("font-family", "monospace")
      .text((d) => d.data.relation);

    // Claim Share Badge Subtext
    nodeG
      .append("text")
      .attr("x", -boxWidth / 2 + 14)
      .attr("y", -boxHeight / 2 + 48)
      .attr("fill", "#94a3b8")
      .attr("font-size", "8.5px")
      .attr("font-family", "sans-serif")
      .text((d) => d.data.claimShare || d.data.location || "");

  }, [targetName, relativesData, layoutDirection, selectedNode?.id]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.25);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.8);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const width = containerRef.current?.clientWidth || 800;
    const initialTransform = d3.zoomIdentity.translate(layoutDirection === "horizontal" ? 90 : width / 2, layoutDirection === "horizontal" ? 190 : 60).scale(0.9);
    d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, initialTransform);
  };

  return (
    <Card className="border-neutral-800 bg-[#060a11] text-neutral-200 overflow-hidden rounded-2xl shadow-2xl">
      <CardHeader className="border-b border-neutral-900 bg-neutral-950/80 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-orange-400 text-xs font-mono font-bold uppercase bg-orange-400/10 px-2 py-0.5 rounded border border-orange-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              D3.js Kinship Graph
            </span>
            <Badge variant="outline" className="border-neutral-800 bg-neutral-900 text-neutral-300 font-mono text-[10px]">
              Interactive Heir Tree
            </Badge>
          </div>
          <CardTitle className="text-base font-bold font-mono text-neutral-100 mt-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-400" />
            Heir & Relative Relationship Visualizer
          </CardTitle>
          <CardDescription className="text-xs text-neutral-400">
            D3 hierarchical graph mapping probate heirs, spouses, descendants, and co-title associates for estate recovery.
          </CardDescription>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 self-end md:self-auto">
          <button
            onClick={() => setLayoutDirection(layoutDirection === "horizontal" ? "vertical" : "horizontal")}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 cursor-pointer flex items-center gap-1"
          >
            <Share2 className="w-3 h-3 text-teal-400" />
            {layoutDirection === "horizontal" ? "Horizontal Tree" : "Vertical Tree"}
          </button>

          <Button size="icon" variant="outline" onClick={handleZoomIn} className="h-8 w-8 border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 cursor-pointer">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>

          <Button size="icon" variant="outline" onClick={handleZoomOut} className="h-8 w-8 border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 cursor-pointer">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>

          <Button size="icon" variant="outline" onClick={handleResetZoom} className="h-8 w-8 border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        {/* D3 Canvas Container */}
        <div ref={containerRef} className="w-full h-[480px] relative overflow-hidden bg-[#060a11]">
          <svg ref={svgRef} className="w-full h-full block" />

          {/* D3 Graph Legend overlay */}
          <div className="absolute top-3 left-3 bg-neutral-950/90 border border-neutral-800/80 backdrop-blur-md p-2.5 rounded-xl space-y-1.5 text-[10px] font-mono pointer-events-none shadow-lg">
            <span className="text-neutral-400 font-bold uppercase tracking-wider block mb-1">Status Legend</span>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
              <span className="text-neutral-200">Primary Subject</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-neutral-200">Verified Heir</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-neutral-200">Potential Heir</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-neutral-200">Co-Associate / Title</span>
            </div>
          </div>
        </div>

        {/* Selected Heir Node Details Drawer Bar */}
        {selectedNode && (
          <div className="bg-neutral-950 border-t border-neutral-900 p-4 font-mono text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-neutral-100">{selectedNode.name}</span>
                <Badge className="bg-neutral-900 border-neutral-800 text-orange-400 text-[10px]">
                  {selectedNode.relation}
                </Badge>
                {selectedNode.status && (
                  <Badge variant="outline" className="border-neutral-800 text-emerald-400 text-[10px]">
                    {selectedNode.status}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-neutral-400 text-[11px] pt-0.5">
                {selectedNode.dob && <span>DOB: <strong className="text-neutral-200">{selectedNode.dob}</strong></span>}
                {selectedNode.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-orange-400" /> {selectedNode.phone}</span>}
                {selectedNode.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-teal-400" /> {selectedNode.email}</span>}
                {selectedNode.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-indigo-400" /> {selectedNode.location}</span>}
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              {selectedNode.claimShare && (
                <div className="text-right">
                  <span className="text-[10px] uppercase text-neutral-500 block">Est. Statutory Share</span>
                  <span className="text-sm font-bold text-emerald-400">{selectedNode.claimShare}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
