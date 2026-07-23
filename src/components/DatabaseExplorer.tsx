import React, { useState, useEffect, useCallback } from "react";
import { getBrowserRecords, deleteRecordFromBrowserDb, AssetRecord } from "../lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Search, Trash2, RefreshCw, Database } from "lucide-react";
import { Badge } from "./ui/badge";

export function DatabaseExplorer() {
  const [records, setRecords] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof AssetRecord; direction: "asc" | "desc" } | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBrowserRecords({
        search: search.trim() || undefined,
        state: stateFilter.trim() || undefined,
        limit: 500
      });
      setRecords(data);
    } catch (error) {
      console.error("Failed to fetch records:", error);
    } finally {
      setLoading(false);
    }
  }, [search, stateFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm(`Are you sure you want to delete record ID ${id}?`)) return;
    
    try {
      await deleteRecordFromBrowserDb(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Failed to delete record:", error);
      alert("Error deleting record.");
    }
  };

  const handleSort = (key: keyof AssetRecord) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...records].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal === undefined || aVal === null) return direction === "asc" ? 1 : -1;
      if (bVal === undefined || bVal === null) return direction === "asc" ? -1 : 1;

      if (aVal < bVal) {
        return direction === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setRecords(sorted);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Card className="border-neutral-800 bg-[#0a0a0a]">
      <CardHeader className="border-b border-neutral-800 bg-[#111] pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" />
              SQLite Database Explorer
            </CardTitle>
            <CardDescription className="text-neutral-400 mt-1">
              Directly query, filter, and manage records stored in the local WASM SQLite database.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            {records.length} {records.length === 500 ? "+" : ""} Records Loaded
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="p-4 border-b border-neutral-800 bg-[#161616] flex flex-wrap gap-3 items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <Input 
              placeholder="Search names, company, or location..." 
              className="pl-9 bg-[#0e0e11] border-neutral-700 text-neutral-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRecords()}
            />
          </div>
          <div className="w-full max-w-[120px]">
            <Input 
              placeholder="State (e.g. CA)" 
              className="bg-[#0e0e11] border-neutral-700 text-neutral-200 uppercase"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value.slice(0, 2))}
              onKeyDown={(e) => e.key === 'Enter' && fetchRecords()}
              maxLength={2}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={fetchRecords} 
            disabled={loading}
            className="border-neutral-700 hover:bg-neutral-800 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-[#111] sticky top-0 z-10 shadow-sm">
              <TableRow className="border-neutral-800 hover:bg-transparent">
                <TableHead className="w-[80px] cursor-pointer hover:text-white" onClick={() => handleSort("id")}>
                  ID {sortConfig?.key === "id" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer hover:text-white" onClick={() => handleSort("first_name")}>
                  First Name {sortConfig?.key === "first_name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer hover:text-white" onClick={() => handleSort("last_name")}>
                  Last Name {sortConfig?.key === "last_name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer hover:text-white" onClick={() => handleSort("state")}>
                  State {sortConfig?.key === "state" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer hover:text-white" onClick={() => handleSort("amount")}>
                  Amount {sortConfig?.key === "amount" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer hover:text-white" onClick={() => handleSort("company")}>
                  Company {sortConfig?.key === "company" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-neutral-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-600" />
                    Querying SQLite Database...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-neutral-500">
                    No records found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id} className="border-neutral-800/50 hover:bg-neutral-800/30">
                    <TableCell className="font-mono text-xs text-neutral-400">{record.id}</TableCell>
                    <TableCell className="text-neutral-300">{record.first_name || "-"}</TableCell>
                    <TableCell className="font-medium text-neutral-200">{record.last_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-neutral-800/50 border-neutral-700 text-neutral-300 font-mono">
                        {record.state}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-emerald-400">{formatCurrency(record.amount || 0)}</TableCell>
                    <TableCell className="text-neutral-400 text-sm max-w-[200px] truncate" title={record.company}>
                      {record.company || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-neutral-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDelete(record.id)}
                        title="Delete record"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
