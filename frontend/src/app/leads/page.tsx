"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { leadApi } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutDashboard, Users, Search, Settings, MessageSquare, BarChart3, Plus, Mail, Phone, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";

type SortKey = "name" | "category" | "status" | "created_at" | "priority";
type SortDir = "asc" | "desc";

export default function LeadsPage() {
  const [filter, setFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  
  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: leadApi.getLeads
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDir === "asc" 
      ? <ArrowUp className="ml-1 h-3 w-3" /> 
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const sortedLeads = useMemo(() => {
    const filtered = leads?.filter((lead: any) => {
      if (filter === "has_email") return lead.email;
      if (filter === "phone_only") return lead.phone && !lead.email;
      return true;
    });

    if (!filtered) return [];

    return [...filtered].sort((a: any, b: any) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      // Handle nulls — push them to the end
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Date comparison
      if (sortKey === "created_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // String comparison
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [leads, filter, sortKey, sortDir]);

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Devrazo LeadOS</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/leads" className="flex items-center gap-3 px-3 py-2 rounded-md bg-accent text-accent-foreground">
            <Users className="h-5 w-5" />
            CRM Pipeline
          </Link>
          <Link href="/search" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <Search className="h-5 w-5" />
            Lead Search
          </Link>
          <Link href="/outreach" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <MessageSquare className="h-5 w-5" />
            AI Outreach
          </Link>
          <Link href="/analytics" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </Link>
        </nav>
        <div className="p-4 border-t">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">CRM Pipeline</h2>
          <div className="flex items-center gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Contacts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="has_email">Has Email (Auto)</SelectItem>
                <SelectItem value="phone_only">Phone Only (Manual)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortKey}-${sortDir}`} onValueChange={(val) => {
              const [key, dir] = val.split("-") as [SortKey, SortDir];
              setSortKey(key);
              setSortDir(dir);
            }}>
              <SelectTrigger className="w-[200px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A → Z</SelectItem>
                <SelectItem value="name-desc">Name Z → A</SelectItem>
                <SelectItem value="category-asc">Category A → Z</SelectItem>
                <SelectItem value="category-desc">Category Z → A</SelectItem>
                <SelectItem value="status-asc">Status A → Z</SelectItem>
                <SelectItem value="priority-asc">Priority A → Z</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button onClick={() => handleSort("name")} className="flex items-center hover:text-foreground transition-colors">
                      Business Name <SortIcon column="name" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort("category")} className="flex items-center hover:text-foreground transition-colors">
                      Category <SortIcon column="category" />
                    </button>
                  </TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>
                    <button onClick={() => handleSort("status")} className="flex items-center hover:text-foreground transition-colors">
                      Status <SortIcon column="status" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort("created_at")} className="flex items-center hover:text-foreground transition-colors">
                      Date Added <SortIcon column="created_at" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort("priority")} className="flex items-center hover:text-foreground transition-colors">
                      Priority <SortIcon column="priority" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">Loading leads...</TableCell>
                  </TableRow>
                ) : sortedLeads && sortedLeads.length > 0 ? (
                  sortedLeads.map((lead: any) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.category}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          {lead.email ? (
                            <div className="flex items-center gap-1"><Mail className="h-3 w-3"/> {lead.email}</div>
                          ) : null}
                          {lead.phone ? (
                            <div className="flex items-center gap-1"><Phone className="h-3 w-3"/> {lead.phone}</div>
                          ) : null}
                          {!lead.email && !lead.phone && <span>No contact info</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={lead.status === 'New' ? 'default' : 'secondary'}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(lead.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleTimeString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={lead.priority === 'High' ? 'destructive' : 'outline'}>
                          {lead.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      No leads found for this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
