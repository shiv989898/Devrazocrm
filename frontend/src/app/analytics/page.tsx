import Link from "next/link";
import { 
    LayoutDashboard, 
    Users, 
    Search, 
    Settings, 
    MessageSquare,
    BarChart3
} from "lucide-react";

export default function AnalyticsPage() {
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
          <Link href="/analytics" className="flex items-center gap-3 px-3 py-2 rounded-md bg-accent text-accent-foreground">
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
          <h2 className="text-lg font-semibold">Analytics & Reporting</h2>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight">Advanced Analytics Coming Soon</h3>
            <p className="text-muted-foreground max-w-sm">
              We are building a comprehensive reporting suite to help you track your outreach open rates, conversion funnels, and revenue metrics. 
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
