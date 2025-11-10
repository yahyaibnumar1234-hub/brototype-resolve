import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UrgencyBadgeProps {
  urgency: "low" | "medium" | "high" | "urgent";
  className?: string;
}

const urgencyConfig = {
  low: {
    label: "Low",
    className: "bg-urgency-low/10 text-urgency-low border-urgency-low/20",
  },
  medium: {
    label: "Medium",
    className: "bg-urgency-medium/10 text-urgency-medium border-urgency-medium/20",
  },
  high: {
    label: "High",
    className: "bg-urgency-high/10 text-urgency-high border-urgency-high/20",
  },
  urgent: {
    label: "Urgent",
    className: "bg-urgency-urgent/10 text-urgency-urgent border-urgency-urgent/20",
  },
};

export const UrgencyBadge = ({ urgency, className }: UrgencyBadgeProps) => {
  const config = urgencyConfig[urgency];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};
