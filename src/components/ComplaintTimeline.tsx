import { CheckCircle2, Circle, Clock, FileCheck } from "lucide-react";
import { format } from "date-fns";

interface TimelineStep {
  label: string;
  date?: string;
  status: "completed" | "current" | "pending";
}

interface ComplaintTimelineProps {
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export const ComplaintTimeline = ({
  status,
  createdAt,
  updatedAt,
  resolvedAt,
}: ComplaintTimelineProps) => {
  const steps: TimelineStep[] = [
    {
      label: "Submitted",
      date: createdAt,
      status: "completed",
    },
    {
      label: "Under Review",
      date: status !== "open" ? updatedAt : undefined,
      status: status !== "open" ? "completed" : "current",
    },
    {
      label: "In Progress",
      date: status === "in_progress" || status === "resolved" ? updatedAt : undefined,
      status:
        status === "in_progress"
          ? "current"
          : status === "resolved"
          ? "completed"
          : "pending",
    },
    {
      label: "Resolved",
      date: resolvedAt || undefined,
      status: status === "resolved" ? "completed" : "pending",
    },
  ];

  const getIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-status-resolved" />;
      case "current":
        return <Clock className="h-5 w-5 text-status-inProgress" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="relative">
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.label} className="flex gap-4">
            <div className="flex flex-col items-center">
              {getIcon(step.status)}
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-12 mt-2 ${
                    step.status === "completed"
                      ? "bg-status-resolved"
                      : "bg-border"
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pb-8">
              <p
                className={`font-medium ${
                  step.status === "completed"
                    ? "text-foreground"
                    : step.status === "current"
                    ? "text-status-inProgress"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(step.date), "PPp")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
