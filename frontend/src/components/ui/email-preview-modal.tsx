import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, User } from "lucide-react";

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  subject?: string;
  body: string;
  businessName: string;
}

export function EmailPreviewModal({ isOpen, onClose, email, subject, body, businessName }: EmailPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#0a0a0a] border-[#1f1f1f] text-white p-0 gap-0 overflow-hidden shadow-2xl rounded-xl">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-medium tracking-tight">AI Email Preview</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column: Metadata */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground ml-1">To</label>
                <div className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-muted-foreground truncate">
                  {email || "unknown@domain.com"}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground ml-1">Subject</label>
                <div className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-foreground truncate">
                  {subject || `Helping ${businessName} Grow`}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground ml-1">Preview Text</label>
                <div className="w-full bg-[#141414] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-muted-foreground truncate">
                  A quick idea to get more patients...
                </div>
              </div>
            </div>

            {/* Right Column: Email Body Window */}
            <div className="w-full md:w-2/3 bg-[#111111] border border-[#1f1f1f] rounded-xl flex flex-col shadow-inner">
              {/* Window Header */}
              <div className="h-10 border-b border-[#1f1f1f] flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-[#333333]"></div>
                <div className="w-3 h-3 rounded-full bg-[#333333]"></div>
                <div className="w-3 h-3 rounded-full bg-[#333333]"></div>
              </div>
              {/* Window Body */}
              <div className="p-6 text-sm text-[#e0e0e0] leading-relaxed overflow-y-auto max-h-[400px]"
                   dangerouslySetInnerHTML={{ __html: body || "<p>Loading draft...</p>" }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#111111] border-t border-[#1f1f1f] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-4 w-4" /> Personalized
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4" /> AI Generated
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground font-medium">
            <Send className="h-4 w-4" /> Ready to Send
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
