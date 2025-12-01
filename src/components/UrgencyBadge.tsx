import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UrgencyBadgeProps {
  urgency: "low" | "medium" | "high" | "urgent";
  className?: string;
}

const urgencyConfig = {
  low: {
    label: "Low",
    className: "bg-urgency-low/15 text-urgency-low border-urgency-low/30 shadow-sm backdrop-blur-md font-semibold",
  },
  medium: {
    label: "Medium",
    className: "bg-urgency-medium/15 text-urgency-medium border-urgency-medium/30 shadow-sm backdrop-blur-md font-semibold",
  },
  high: {
    label: "High",
    className: "bg-urgency-high/15 text-urgency-high border-urgency-high/30 shadow-sm backdrop-blur-md font-semibold",
  },
  urgent: {
    label: "Urgent",
    className: "bg-urgency-urgent/15 text-urgency-urgent border-urgency-urgent/30 shadow-sm backdrop-blur-md font-semibold animate-glow",
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
