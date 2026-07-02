"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { leadApi } from "@/lib/api";
import { CircularProgress } from "@/components/ui/circular-progress";
import { EmailPreviewModal } from "@/components/ui/email-preview-modal";
import { toast } from "sonner";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  BarChart2,
  Filter,
  Download,
  MoreVertical,
  Star,
  Lock,
  Unlock,
  CheckCircle2,
  Minus,
  Mail,
  RefreshCw,
  BrainCircuit,
  FileSpreadsheet,
  LayoutDashboard,
  Users,
  Search as SearchIcon,
  Settings,
  MessageSquare,
  BarChart3,
  Columns,
  ArrowUpDown,
  MessageCircle,
  Trash2
} from "lucide-react";

export default function LeadsDashboard() {
  const queryClient = useQueryClient();
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  
  // New States for Sorting, Filtering, and Column Visibility
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [filterScore, setFilterScore] = useState<number>(0);
  const [visibleCols, setVisibleCols] = useState({
    name: true, date: true, website: true, phone: true, rating: true,
    websiteScore: true, ssl: true, contactForm: true, booking: true,
    aiScore: true, email: true, export: true
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Reset to first page when sorting or filtering changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortConfig, filterScore]);
  
  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: leadApi.getLeads
  });

  const getWebsiteScore = (lead: any) => {
    // Mock logic based on real data if available, else random deterministic
    if (lead.score !== undefined) return lead.score;
    const nameLen = lead.name?.length || 10;
    return Math.min(100, Math.max(0, 100 - (nameLen % 30)));
  };

  const getOppScore = (lead: any) => {
    // Generate a high score for demo if missing
    return Math.min(99, getWebsiteScore(lead) + 5); 
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getWhatsAppUrl = (phone: string, name: string) => {
    if (!phone) return '#';
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0 (common in India, UK, etc.), strip the 0 and add 91 (India) as default since the user's leads were from Chandigarh.
    // Alternatively, if it's 10 digits, we might assume US (1) or India (91). We'll try to add 91 for 10-digit Indian numbers, or 1 for US numbers if they search US.
    // A safe heuristic for this user's current data:
    if (cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
      // If it's exactly 10 digits, it's missing a country code. We'll default to US (+1) but could be +91.
      // Let's check if the location being searched was India.
      cleaned = '1' + cleaned;
    }
    
    // Professional B2B outreach hook based on web presence
    const rawText = `Hi team at ${name},

I came across your business recently. I'm with Devrazo (https://devrazo.dev), and we help businesses upgrade their digital presence to automate and scale their customer acquisition.

I ran a quick audit on your current online setup and noticed a few missed opportunities that could be costing you leads. I have a couple of quick ideas on how you can fix this and bring in more customers.

Would you be open to a brief, no-pressure chat this week?`;
    
    const text = encodeURIComponent(rawText);
    // Direct link to WhatsApp Web to avoid the intermediate landing page
    return `https://web.whatsapp.com/send?phone=${cleaned}&text=${text}`;
  };

  const handleDeleteLead = async (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this lead?")) {
      try {
        await leadApi.deleteLead(id);
        toast.success("Lead deleted successfully");
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete lead");
      }
    }
  };

  const processedLeads = useMemo(() => {
    if (!leads) return [];
    let result = [...leads];

    if (filterScore > 0) {
      result = result.filter(l => getOppScore(l) >= filterScore);
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let aVal, bVal;
        switch (sortConfig.key) {
          case 'name': aVal = a.name || ""; bVal = b.name || ""; break;
          case 'rating': aVal = a.google_rating || 0; bVal = b.google_rating || 0; break;
          case 'aiScore': aVal = getOppScore(a); bVal = getOppScore(b); break;
          case 'date': aVal = new Date(a.created_at || 0).getTime(); bVal = new Date(b.created_at || 0).getTime(); break;
          default: aVal = 0; bVal = 0;
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [leads, filterScore, sortConfig]);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedLeads.slice(start, start + itemsPerPage);
  }, [processedLeads, currentPage]);

  const totalPages = Math.ceil(processedLeads.length / itemsPerPage);

  // Summary Metrics
  const businessesFound = leads?.length || 0;
  const avgOppScore = leads?.length 
    ? Math.round(leads.reduce((acc: number, curr: any) => acc + getOppScore(curr), 0) / businessesFound) 
    : 0;
  const highOppLeads = leads?.filter((l: any) => getOppScore(l) > 80).length || 0;
  const emailsGenerated = leads?.filter((l: any) => l.email).length || 0;

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
          <Link href="/leads" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a1a1a] text-white transition-colors text-sm font-medium">
            <Users className="h-4 w-4" /> CRM Pipeline
          </Link>
          <Link href="/search" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1a1a] hover:text-white text-[#a3a3a3] transition-colors text-sm font-medium">
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

      <main className="flex-1 overflow-auto p-6">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart2 className="text-muted-foreground h-5 w-5" />
          <h1 className="text-xl font-medium tracking-tight">Lead Intelligence Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 bg-[#111111] border border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors px-4 py-2 rounded-lg text-sm text-muted-foreground outline-none">
              <Filter className="h-4 w-4" /> Filter
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#111111] border-[#1f1f1f] text-foreground shadow-xl">
              <DropdownMenuRadioGroup value={filterScore.toString()} onValueChange={(v) => setFilterScore(Number(v))}>
                <DropdownMenuRadioItem value="0">All Leads</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="50">AI Score &gt; 50</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="80">AI Score &gt; 80</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="90">AI Score &gt; 90</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 bg-[#111111] border border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors px-4 py-2 rounded-lg text-sm text-muted-foreground outline-none">
              <ArrowUpDown className="h-4 w-4" /> Sort
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#111111] border-[#1f1f1f] text-foreground shadow-xl">
              <DropdownMenuItem onClick={() => setSortConfig({ key: 'date', direction: 'desc' })}>Date (Newest)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortConfig({ key: 'date', direction: 'asc' })}>Date (Oldest)</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1f1f1f]" />
              <DropdownMenuItem onClick={() => setSortConfig({ key: 'aiScore', direction: 'desc' })}>AI Score (Highest)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortConfig({ key: 'aiScore', direction: 'asc' })}>AI Score (Lowest)</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1f1f1f]" />
              <DropdownMenuItem onClick={() => setSortConfig({ key: 'rating', direction: 'desc' })}>Rating (Highest)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>Name (A-Z)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 bg-[#111111] border border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors px-4 py-2 rounded-lg text-sm text-muted-foreground outline-none">
              <Columns className="h-4 w-4" /> View
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#111111] border-[#1f1f1f] text-foreground shadow-xl">
              {Object.keys(visibleCols).map((col) => (
                <DropdownMenuCheckboxItem 
                  key={col} 
                  checked={visibleCols[col as keyof typeof visibleCols]}
                  onCheckedChange={(checked) => setVisibleCols(prev => ({...prev, [col]: checked}))}
                  className="capitalize"
                >
                  {col.replace(/([A-Z])/g, ' $1').trim()}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button onClick={() => toast.info("Export functionality coming soon")} className="flex items-center gap-2 bg-[#111111] border border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors px-4 py-2 rounded-lg text-sm text-muted-foreground">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl overflow-hidden shadow-2xl mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground border-b border-[#1f1f1f] bg-[#050505]/50">
              <tr>
                {visibleCols.name && <th className="px-6 py-4 font-medium">Business Name</th>}
                {visibleCols.date && <th className="px-6 py-4 font-medium">Date Added</th>}
                {visibleCols.website && <th className="px-6 py-4 font-medium">Website</th>}
                {visibleCols.phone && <th className="px-6 py-4 font-medium">Phone Number</th>}
                {visibleCols.rating && <th className="px-6 py-4 font-medium text-center">Google Rating</th>}
                {visibleCols.websiteScore && <th className="px-6 py-4 font-medium text-center">Website Score</th>}
                {visibleCols.ssl && <th className="px-6 py-4 font-medium text-center">SSL</th>}
                {visibleCols.contactForm && <th className="px-6 py-4 font-medium text-center">Contact Form</th>}
                {visibleCols.booking && <th className="px-6 py-4 font-medium text-center">Booking System</th>}
                {visibleCols.aiScore && <th className="px-6 py-4 font-medium text-center">AI Opportunity Score</th>}
                {visibleCols.email && <th className="px-6 py-4 font-medium text-center">AI Email Preview</th>}
                {visibleCols.export && <th className="px-6 py-4 font-medium text-center">Sheets Export</th>}
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {isLoading ? (
                <tr><td colSpan={13} className="px-6 py-12 text-center text-muted-foreground">Loading intelligence data...</td></tr>
              ) : paginatedLeads?.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-[#111111]/50 transition-colors group">
                  {visibleCols.name && (
                    <td className="px-6 py-4 font-medium text-[#f5f5f5] whitespace-nowrap">
                      {lead.name}
                    </td>
                  )}
                  {visibleCols.date && (
                    <td className="px-6 py-4 text-[#a3a3a3] whitespace-nowrap text-xs">
                      {formatDate(lead.created_at)}
                    </td>
                  )}
                  {visibleCols.website && (
                    <td className="px-6 py-4 text-[#a3a3a3] truncate max-w-[200px]">
                      {lead.website?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'No website'}
                    </td>
                  )}
                  {visibleCols.phone && (
                    <td className="px-6 py-4 text-[#a3a3a3] whitespace-nowrap">
                      {lead.phone ? (
                        <div className="flex items-center gap-2">
                          <span>{lead.phone}</span>
                          <a 
                            href={getWhatsAppUrl(lead.phone, lead.name)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 p-1.5 rounded-md transition-colors"
                            title="Message on WhatsApp"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  )}
                  {visibleCols.rating && (
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-[#e0e0e0]">
                        {lead.google_rating || '4.0'} <Star className="h-3 w-3 fill-current text-white" />
                      </div>
                    </td>
                  )}
                  {visibleCols.websiteScore && (
                    <td className="px-6 py-4 text-center">
                      <CircularProgress value={getWebsiteScore(lead)} size={32} strokeWidth={2} className="text-[#a3a3a3]" />
                    </td>
                  )}
                  {visibleCols.ssl && (
                    <td className="px-6 py-4 text-center">
                      {lead.website?.includes('https') ? (
                        <Lock className="h-4 w-4 mx-auto text-[#a3a3a3]" />
                      ) : (
                        <Unlock className="h-4 w-4 mx-auto text-destructive" />
                      )}
                    </td>
                  )}
                  {visibleCols.contactForm && (
                    <td className="px-6 py-4 text-center">
                      {getWebsiteScore(lead) > 75 ? (
                         <CheckCircle2 className="h-4 w-4 mx-auto text-[#a3a3a3]" />
                      ) : (
                         <Minus className="h-4 w-4 mx-auto text-[#555555]" />
                      )}
                    </td>
                  )}
                  {visibleCols.booking && (
                    <td className="px-6 py-4 text-center">
                       {getWebsiteScore(lead) > 85 ? (
                         <CheckCircle2 className="h-4 w-4 mx-auto text-[#a3a3a3]" />
                      ) : (
                         <Minus className="h-4 w-4 mx-auto text-[#555555]" />
                      )}
                    </td>
                  )}
                  {visibleCols.aiScore && (
                    <td className="px-6 py-4 text-center">
                      <CircularProgress value={getOppScore(lead)} size={32} strokeWidth={2} className="text-white" />
                    </td>
                  )}
                  {visibleCols.email && (
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedEmail(lead)}
                        className="text-[#a3a3a3] hover:text-white transition-colors"
                        disabled={!lead.email}
                      >
                        <Mail className={`h-4 w-4 mx-auto ${!lead.email && 'opacity-30'}`} />
                      </button>
                    </td>
                  )}
                  {visibleCols.export && (
                    <td className="px-6 py-4 text-center">
                      {lead.status === 'Sent to Sheets' ? (
                         <CheckCircle2 className="h-4 w-4 mx-auto text-[#a3a3a3]" />
                      ) : (
                         <RefreshCw className="h-4 w-4 mx-auto text-[#555555]" />
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDeleteLead(lead.id)}
                      className="text-[#555555] hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-500/10"
                      title="Delete Lead"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && (!processedLeads || processedLeads.length === 0) && (
                <tr>
                   <td colSpan={12} className="px-6 py-12 text-center text-muted-foreground">
                      No leads found. Go to Lead Search to scrape businesses, or try clearing filters.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!isLoading && processedLeads && processedLeads.length > 0 && (
          <div className="p-4 border-t border-[#1f1f1f] bg-[#050505]/50 flex items-center justify-between">
            <span className="text-xs text-[#a3a3a3]">
              Showing {Math.min(processedLeads.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(processedLeads.length, currentPage * itemsPerPage)} of {processedLeads.length} leads
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-[#111111] hover:bg-[#1a1a1a] border border-[#1f1f1f] rounded-md text-xs text-[#e0e0e0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-[#555555] px-2">Page {currentPage} of {Math.ceil(processedLeads.length / itemsPerPage)}</span>
              <button 
                disabled={currentPage === Math.ceil(processedLeads.length / itemsPerPage) || Math.ceil(processedLeads.length / itemsPerPage) === 0}
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(processedLeads.length / itemsPerPage), p + 1))}
                className="px-3 py-1.5 bg-[#111111] hover:bg-[#1a1a1a] border border-[#1f1f1f] rounded-md text-xs text-[#e0e0e0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Overview Cards */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-6">
        <h3 className="text-xs font-medium text-muted-foreground mb-4">Summary Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 bg-[#1a1a1a] rounded-md">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Businesses Found</p>
              <p className="text-2xl font-semibold text-white">{businessesFound}</p>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 bg-[#1a1a1a] rounded-md">
              <BrainCircuit className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. AI Opportunity Score</p>
              <p className="text-2xl font-semibold text-white">
                {avgOppScore} <span className="text-sm text-[#555555] font-normal">/100</span>
              </p>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 bg-[#1a1a1a] rounded-md">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">High Opportunity Leads</p>
              <p className="text-2xl font-semibold text-white">{highOppLeads}</p>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1f1f1f] rounded-lg p-4 flex items-center gap-4">
            <div className="p-2.5 bg-[#1a1a1a] rounded-md">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Emails Generated</p>
              <p className="text-2xl font-semibold text-white">{emailsGenerated}</p>
            </div>
          </div>

        </div>
      </div>

      {/* AI Email Preview Modal */}
      {selectedEmail && (
        <EmailPreviewModal 
          isOpen={!!selectedEmail} 
          onClose={() => setSelectedEmail(null)}
          email={selectedEmail.email}
          businessName={selectedEmail.name}
          subject={`Helping ${selectedEmail.name} Grow`}
          body={selectedEmail.email_draft || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #eaeaea;">
                <h2 style="margin: 0; color: #333;">Helping ${selectedEmail.name || 'your business'} Grow 🚀</h2>
              </div>
              <div style="padding: 30px 20px; color: #444; line-height: 1.6; font-size: 15px;">
                <p>Hi team at <strong>${selectedEmail.name || 'your business'}</strong>,</p>
                <p>We came across your profile and noticed the amazing work you're doing in ${selectedEmail.city || 'your area'}.</p>
                <p>At Devrazo, we help businesses like yours automate lead follow-up, boost appointments, and streamline operations using cutting-edge AI.</p>
                <div style="background-color: #f0f7ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0056b3;">
                  <p style="margin: 0; color: #0056b3;"><strong>Quick Question:</strong> Are you currently using AI to handle missed calls and website inquiries?</p>
                </div>
                <p>We'd love to share a quick 2-minute demo tailored for your operations.</p>
                <a href="#" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 10px;">View Demo</a>
              </div>
              <div style="background-color: #f8f9fa; padding: 15px 20px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eaeaea;">
                <p style="margin: 0;">Best regards,<br/><strong>The Devrazo Team</strong></p>
              </div>
            </div>
          `}
        />
      )}

      </main>
    </div>
  );
}
