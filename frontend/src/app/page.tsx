"use client";

import Link from "next/link";
import { 
    LayoutDashboard, 
    Users, 
    Search, 
    Settings, 
    MessageSquare,
    BarChart3
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Home() {
  // Fetch real data from the FastAPI backend
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const response = await api.get('/leads/');
      return response.data;
    }
  });

  const totalLeads = leads.length;
  const contactedLeads = leads.filter((l: any) => l.status === 'Contacted' || l.status === 'Proposal Sent' || l.status === 'Meeting Scheduled').length;
  const wonLeads = leads.filter((l: any) => l.status === 'Won').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">Devrazo LeadOS</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md bg-accent text-accent-foreground">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/leads" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
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
        <header className="h-16 border-b flex items-center px-8 bg-card/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">Dashboard Overview</h2>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Stats Cards */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Total Leads</h3>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : totalLeads}
              </div>
              <p className="text-xs text-muted-foreground">Scraped from directory</p>
            </div>
            
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Contacted</h3>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : contactedLeads}
              </div>
              <p className="text-xs text-muted-foreground">Outreach sent</p>
            </div>
            
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Clients Won</h3>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : wonLeads}
              </div>
              <p className="text-xs text-muted-foreground">Successfully closed</p>
            </div>
            
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Conversion Rate</h3>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : `${conversionRate}%`}
              </div>
              <p className="text-xs text-muted-foreground">Win rate per lead</p>
            </div>
          </div>
          
          <div className="mt-8 rounded-xl border bg-card text-card-foreground shadow-sm h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">
              {totalLeads === 0 ? "Go to 'Lead Search' to scrape your first leads and populate this chart." : "Chart Placeholder (Recharts / Framer Motion)"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
