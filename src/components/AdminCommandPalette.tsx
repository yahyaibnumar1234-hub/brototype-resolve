import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  FileText, 
  User, 
  Tag, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Settings,
  Download,
  BarChart3
} from "lucide-react";

interface Complaint {
  id: string;
  title: string;
  status: string;
  urgency: string;
  profiles: {
    full_name: string;
  } | null;
}

interface AdminCommandPaletteProps {
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  onOpenAnalytics?: () => void;
}

export const AdminCommandPalette = ({ 
  onExportCSV, 
  onExportPDF,
  onOpenAnalytics 
}: AdminCommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Register keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search complaints when query changes
  useEffect(() => {
    const searchComplaints = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from("complaints")
        .select(`
          id,
          title,
          status,
          urgency,
          profiles!complaints_student_id_fkey (
            full_name
          )
        `)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(10);

      setSearchResults(data || []);
      setLoading(false);
    };

    const debounce = setTimeout(searchComplaints, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelect = useCallback((complaintId: string) => {
    setOpen(false);
    navigate(`/complaint/${complaintId}`);
  }, [navigate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-status-open" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-status-inProgress" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-status-resolved" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-lg border hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search complaints...</span>
        <kbd className="ml-2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search complaints, users, or actions..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? "Searching..." : "No results found."}
          </CommandEmpty>

          {searchResults.length > 0 && (
            <CommandGroup heading="Complaints">
              {searchResults.map((complaint) => (
                <CommandItem
                  key={complaint.id}
                  value={complaint.id}
                  onSelect={() => handleSelect(complaint.id)}
                  className="flex items-center gap-3"
                >
                  {getStatusIcon(complaint.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{complaint.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {complaint.profiles?.full_name || 'Unknown'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    complaint.urgency === 'urgent' ? 'bg-destructive/20 text-destructive' :
                    complaint.urgency === 'high' ? 'bg-orange-500/20 text-orange-500' :
                    complaint.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                    'bg-green-500/20 text-green-600'
                  }`}>
                    {complaint.urgency}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => { setOpen(false); onOpenAnalytics?.(); }}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); onExportCSV?.(); }}>
              <Download className="h-4 w-4 mr-2" />
              Export as CSV
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); onExportPDF?.(); }}>
              <Download className="h-4 w-4 mr-2" />
              Export as PDF
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Filter by Status">
            <CommandItem onSelect={() => { setOpen(false); navigate("/dashboard?status=open"); }}>
              <AlertCircle className="h-4 w-4 mr-2 text-status-open" />
              Show Open Complaints
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate("/dashboard?status=in_progress"); }}>
              <Clock className="h-4 w-4 mr-2 text-status-inProgress" />
              Show In Progress
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate("/dashboard?status=resolved"); }}>
              <CheckCircle className="h-4 w-4 mr-2 text-status-resolved" />
              Show Resolved
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
