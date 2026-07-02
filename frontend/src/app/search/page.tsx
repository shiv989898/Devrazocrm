"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { leadApi } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import { 
    LayoutDashboard, 
    Users, 
    Search as SearchIcon, 
    Settings, 
    MessageSquare,
    BarChart3,
    MapPin,
    ArrowRight,
    Briefcase
} from "lucide-react";

export default function LeadSearchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("Dallas, Texas");
  const [progress, setProgress] = useState({ message: "Initializing...", count: 0, total: 0 });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setProgress({ message: "Initializing...", count: 0, total: 0 });
    
    const jobId = Date.now().toString();
    
    const interval = setInterval(async () => {
      try {
        const status = await leadApi.getScrapeStatus(jobId);
        if (status && status.status !== "not_found") {
          setProgress({
            message: status.message,
            count: status.progress,
            total: status.total
          });
        }
      } catch (err) {
        // silently ignore polling errors
      }
    }, 1000);
    
    try {
      const result = await leadApi.scrapeLeads(category, location, "google-maps", jobId);
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      if (result.count === 0) {
        toast.info("No new leads found (they might already exist in your pipeline).");
      } else {
        toast.success(`Successfully scraped ${result.count} new leads!`);
      }
      
      router.push("/leads");
    } catch (error) {
      console.error(error);
      alert("Scraping failed. Make sure the backend is running.");
    } finally {
      clearInterval(interval);
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#000000] text-foreground font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#1f1f1f] bg-[#050505] flex flex-col z-10 hidden md:flex">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-[#f5f5f5]">Devrazo LeadOS</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1a1a] hover:text-white text-[#a3a3a3] transition-colors text-sm font-medium">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/leads" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1a1a] hover:text-white text-[#a3a3a3] transition-colors text-sm font-medium">
            <Users className="h-4 w-4" /> CRM Pipeline
          </Link>
          <Link href="/search" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a1a1a] text-white transition-colors text-sm font-medium">
            <SearchIcon className="h-4 w-4" /> Lead Search
          </Link>
          <Link href="/outreach" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1a1a] hover:text-white text-[#a3a3a3] transition-colors text-sm font-medium">
            <MessageSquare className="h-4 w-4" /> AI Outreach
          </Link>
          <Link href="/analytics" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1a1a] hover:text-white text-[#a3a3a3] transition-colors text-sm font-medium">
            <BarChart3 className="h-4 w-4" /> Analytics
          </Link>
        </nav>
        <div className="p-4 border-t border-[#1f1f1f]">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1a1a] hover:text-white text-[#a3a3a3] transition-colors text-sm font-medium">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </div>
      </aside>

      {/* Main Content Area centered */}
      <main className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#000000] to-[#0a0a0a]">
        
        {/* Subtle background glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Search Card */}
        <div className="w-full max-w-md bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-6 shadow-2xl relative z-10">
          <form onSubmit={handleSearch} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-sm text-[#a3a3a3] ml-1">Category</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-[#a3a3a3]">
                  <Briefcase className="h-4 w-4" />
                </div>
                <input 
                  type="text" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#141414] border border-[#1f1f1f] text-white text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block w-full pl-10 p-3 outline-none transition-all" 
                  placeholder="e.g. Dental Clinics"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-[#a3a3a3] ml-1">Location</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-[#a3a3a3]">
                  <MapPin className="h-4 w-4" />
                </div>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#141414] border border-[#1f1f1f] text-white text-sm rounded-lg focus:ring-1 focus:ring-primary focus:border-primary block w-full pl-10 p-3 outline-none transition-all" 
                  placeholder="e.g. Dallas, Texas"
                  required
                />
              </div>
            </div>

            {isSearching ? (
              <div className="space-y-3 mt-4 p-4 border border-[#1f1f1f] bg-[#111111] rounded-lg">
                <div className="flex justify-between text-xs text-[#a3a3a3] font-medium tracking-wide">
                  <span>{progress.message}</span>
                  <span>{progress.total > 0 ? `${progress.count} / ${progress.total}` : ''}</span>
                </div>
                <div className="w-full bg-[#1f1f1f] rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-700 ease-out" 
                    style={{ width: progress.total > 0 ? `${Math.min(100, Math.max(5, (progress.count / progress.total) * 100))}%` : '5%' }}
                  ></div>
                </div>
              </div>
            ) : (
              <button 
                type="submit" 
                className="w-full mt-2 bg-gradient-to-b from-[#f5f5f5] to-[#d4d4d4] text-black hover:from-white hover:to-[#e5e5e5] font-medium rounded-lg text-sm px-5 py-3.5 flex items-center justify-center gap-2 transition-all shadow-md"
              >
                Search Businesses
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            
          </form>
        </div>
      </main>
    </div>
  );
}
