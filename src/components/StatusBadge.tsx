import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "open" | "in_progress" | "resolved";
  className?: string;
}

const statusConfig = {
  open: {
    label: "Open",
    className: "bg-status-open/15 text-status-open border-status-open/30 shadow-sm backdrop-blur-md font-semibold",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-status-inProgress/15 text-status-inProgress border-status-inProgress/30 shadow-sm backdrop-blur-md font-semibold",
  },
  resolved: {
    label: "Resolved",
    className: "bg-status-resolved/15 text-status-resolved border-status-resolved/30 shadow-sm backdrop-blur-md font-semibold",
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
