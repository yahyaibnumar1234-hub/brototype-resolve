import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, CheckCircle2, GripVertical } from "lucide-react";

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface KanbanBoardProps {
  complaints: Complaint[];
  onStatusChange: () => void;
}

const COLUMNS = [
  { id: "open", title: "Open", icon: AlertCircle, color: "text-yellow-500" },
  { id: "in_progress", title: "In Progress", icon: Clock, color: "text-blue-500" },
  { id: "resolved", title: "Resolved", icon: CheckCircle2, color: "text-green-500" },
];

const URGENCY_COLORS = {
  low: "bg-gray-500/20 text-gray-600",
  medium: "bg-yellow-500/20 text-yellow-600",
  high: "bg-orange-500/20 text-orange-600",
  urgent: "bg-red-500/20 text-red-600",
};

export const KanbanBoard = ({ complaints, onStatusChange }: KanbanBoardProps) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedId) return;

    const complaint = complaints.find((c) => c.id === draggedId);
    if (!complaint || complaint.status === newStatus) {
      setDraggedId(null);
      return;
    }

    const { error } = await supabase
      .from("complaints")
      .update({ status: newStatus as "open" | "in_progress" | "resolved" })
      .eq("id", draggedId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status Updated",
        description: `Complaint moved to ${newStatus.replace("_", " ")}`,
      });
      onStatusChange();
    }

    setDraggedId(null);
  };

  const getColumnComplaints = (status: string) =>
    complaints.filter((c) => c.status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((column) => {
        const columnComplaints = getColumnComplaints(column.id);
        const Icon = column.icon;

        return (
          <Card
            key={column.id}
            className={`transition-all duration-200 ${
              dragOverColumn === column.id
                ? "ring-2 ring-primary bg-primary/5"
                : ""
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${column.color}`} />
                  {column.title}
                </div>
                <Badge variant="secondary">{columnComplaints.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[500px] pr-2">
                <div className="space-y-2">
                  {columnComplaints.map((complaint) => (
                    <Card
                      key={complaint.id}
                      className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                        draggedId === complaint.id ? "opacity-50" : ""
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, complaint.id)}
                      onClick={() => navigate(`/complaint/${complaint.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {complaint.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {complaint.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              <Badge
                                variant="outline"
                                className={URGENCY_COLORS[complaint.urgency]}
                              >
                                {complaint.urgency}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {complaint.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(complaint.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {columnComplaints.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No complaints
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
