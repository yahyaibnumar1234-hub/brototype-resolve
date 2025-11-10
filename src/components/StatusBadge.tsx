import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "open" | "in_progress" | "resolved";
  className?: string;
}

const statusConfig = {
  open: {
    label: "Open",
    className: "bg-status-open/10 text-status-open border-status-open/20",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-status-inProgress/10 text-status-inProgress border-status-inProgress/20",
  },
  resolved: {
    label: "Resolved",
    className: "bg-status-resolved/10 text-status-resolved border-status-resolved/20",
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};
