import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, Flame, Star, Clock, ChevronDown } from "lucide-react";

interface PriorityOverrideProps {
  complaintId: string;
  currentUrgency: "low" | "medium" | "high" | "urgent";
  onUpdate?: () => void;
}

const priorities = [
  { value: "urgent", label: "Emergency", icon: AlertTriangle, color: "text-red-500 bg-red-500/10" },
  { value: "high", label: "High", icon: Flame, color: "text-orange-500 bg-orange-500/10" },
  { value: "medium", label: "Medium", icon: Star, color: "text-yellow-500 bg-yellow-500/10" },
  { value: "low", label: "Low", icon: Clock, color: "text-green-500 bg-green-500/10" },
] as const;

export const PriorityOverride = ({ 
  complaintId, 
  currentUrgency, 
  onUpdate 
}: PriorityOverrideProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePriorityChange = async (newPriority: "low" | "medium" | "high" | "urgent") => {
    if (newPriority === currentUrgency) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("complaints")
      .update({ urgency: newPriority })
      .eq("id", complaintId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Priority Updated",
        description: `Complaint priority changed to ${newPriority}`,
      });
      onUpdate?.();
    }
    setLoading(false);
  };

  const currentPriority = priorities.find(p => p.value === currentUrgency) || priorities[2];
  const CurrentIcon = currentPriority.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={loading}
          className={`gap-2 ${currentPriority.color}`}
        >
          <CurrentIcon className="h-4 w-4" />
          {currentPriority.label}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {priorities.map((priority) => {
          const Icon = priority.icon;
          return (
            <DropdownMenuItem
              key={priority.value}
              onClick={() => handlePriorityChange(priority.value)}
              className={`gap-2 ${priority.value === currentUrgency ? 'bg-muted' : ''}`}
            >
              <Icon className={`h-4 w-4 ${priority.color.split(' ')[0]}`} />
              {priority.label}
              {priority.value === "urgent" && " 🚨"}
              {priority.value === "high" && " 🔥"}
              {priority.value === "medium" && " ⭐"}
              {priority.value === "low" && " ⏳"}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
