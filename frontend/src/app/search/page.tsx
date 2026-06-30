"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leadApi } from "@/lib/api";
import Link from "next/link";
import { 
    LayoutDashboard, 
    Users, 
    Search as SearchIcon, 
    Settings, 
    MessageSquare,
    BarChart3,
    MapPin,
    Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LeadSearchPage() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [platform, setPlatform] = useState("google-maps");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // Scraping started... this may take 15-30 seconds.
    
    try {
      const result = await leadApi.scrapeLeads(category, location, platform);
      // Redirect to Pipeline to view them
      router.push("/leads");
    } catch (error) {
      console.error(error);
      alert("Scraping failed. Make sure the backend is running and you have playwright installed.");
    } finally {
      setIsSearching(false);
    }
  };

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
          <Link href="/search" className="flex items-center gap-3 px-3 py-2 rounded-md bg-accent text-accent-foreground">
            <SearchIcon className="h-5 w-5" />
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b flex items-center px-8 bg-card/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">Lead Discovery Engine</h2>
        </header>
        
        <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full">
          <Card>
            <CardHeader>
              <CardTitle>Find New Business Leads</CardTitle>
              <CardDescription>
                Search public business listings across the web. Playwright will extract contact details, websites, and reviews.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Business Category</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="category" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Dental Clinic, Restaurant" className="pl-9" required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (City, State)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Austin, Texas" className="pl-9" required />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Source Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google-maps">Google Maps</SelectItem>
                      <SelectItem value="yelp">Yelp Directory</SelectItem>
                      <SelectItem value="trustpilot">Trustpilot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="w-full" disabled={isSearching}>
                  {isSearching ? "Scraping Leads..." : "Start Lead Search"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Results placeholder */}
          <div className="mt-8 text-center text-muted-foreground">
            Search results will appear here...
          </div>
        </div>
      </main>
    </div>
  );
}
