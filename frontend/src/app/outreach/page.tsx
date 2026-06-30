"use client";

import { useState } from "react";
import Link from "next/link";
import { 
    LayoutDashboard, 
    Users, 
    Search, 
    Settings, 
    MessageSquare,
    BarChart3,
    Send,
    X,
    Clock,
    Bot
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadApi } from "@/lib/api";
import { toast } from "sonner";

export default function OutreachPage() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch real drafts from API
  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['pendingOutreaches'],
    queryFn: leadApi.getPendingOutreaches
  });

  const currentDraft = drafts[currentIndex];

  const sendMutation = useMutation({
    mutationFn: leadApi.sendOutreach,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingOutreaches'] });
      // Reset index if we are at the end
      if (currentIndex >= drafts.length - 1) {
        setCurrentIndex(Math.max(0, drafts.length - 2));
      }
      toast.success("Outreach sent successfully!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to send outreach";
      toast.error(message);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: leadApi.rejectOutreach,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingOutreaches'] });
      if (currentIndex >= drafts.length - 1) {
        setCurrentIndex(Math.max(0, drafts.length - 2));
      }
    }
  });

  const handleAction = (action: 'send' | 'hold' | 'reject') => {
    if (!currentDraft) return;

    if (action === 'send') {
      sendMutation.mutate(currentDraft.id);
    } else if (action === 'reject') {
      rejectMutation.mutate(currentDraft.id);
    } else if (action === 'hold') {
      // Skip to the next one locally
      if (drafts.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % drafts.length);
      }
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
          <Link href="/search" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
            <Search className="h-5 w-5" />
            Lead Search
          </Link>
          <Link href="/outreach" className="flex items-center gap-3 px-3 py-2 rounded-md bg-accent text-accent-foreground">
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
        <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">AI Outreach Approval Queue</h2>
          <Badge variant="secondary" className="px-3 py-1">
            {drafts.length} Pending Approvals
          </Badge>
        </header>
        
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-muted/20">
          {drafts.length > 0 && currentDraft ? (
            <div className="w-full max-w-2xl relative">
              <Card className="shadow-xl border-t-4 border-t-primary transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl mb-2">{currentDraft.recipient}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="outline">{currentDraft.platform}</Badge>
                        <span className="text-xs text-muted-foreground">AI Insight: {currentDraft.reasoning}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentDraft.subject !== "N/A" && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground">Subject</p>
                      <div className="p-3 bg-muted rounded-md font-medium">
                        {currentDraft.subject}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground">Message Body</p>
                    <div 
                      className="p-4 bg-muted rounded-md min-h-[150px] overflow-hidden email-preview"
                      dangerouslySetInnerHTML={{ __html: currentDraft.body }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center gap-6 pb-8 pt-4 border-t bg-card/50">
                  <Button 
                    variant="destructive" 
                    size="lg" 
                    className="h-16 w-16 rounded-full shadow-lg"
                    onClick={() => handleAction('reject')}
                  >
                    <X className="h-8 w-8" />
                    <span className="sr-only">Reject</span>
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="h-16 w-16 rounded-full shadow-lg"
                    onClick={() => handleAction('hold')}
                  >
                    <Clock className="h-8 w-8" />
                    <span className="sr-only">Hold</span>
                  </Button>
                  
                  <Button 
                    variant="default" 
                    size="lg" 
                    className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 shadow-lg"
                    onClick={() => handleAction('send')}
                  >
                    <Send className="h-7 w-7 ml-1" />
                    <span className="sr-only">Send</span>
                  </Button>
                </CardFooter>
              </Card>
              
              <div className="mt-8 text-center text-sm text-muted-foreground flex justify-center gap-12">
                <div className="flex flex-col items-center">
                  <span className="font-bold text-destructive">Reject</span>
                  <span>Delete draft</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-secondary-foreground">Hold</span>
                  <span>Skip for now</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-green-600">Send</span>
                  <span>Approve & Deliver</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center flex flex-col items-center p-12 bg-card rounded-xl border shadow-sm max-w-md">
              <Bot className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">You're all caught up!</h3>
              <p className="text-muted-foreground text-center">
                There are no pending AI outreach drafts. Go to the CRM Pipeline to generate more messages.
              </p>
              <Link href="/leads" className={buttonVariants({ className: "mt-6" })}>
                Go to CRM Pipeline
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
