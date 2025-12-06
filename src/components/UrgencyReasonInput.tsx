import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface UrgencyReasonInputProps {
  urgency: string;
  value: string;
  onChange: (value: string) => void;
}

export const UrgencyReasonInput = ({ urgency, value, onChange }: UrgencyReasonInputProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(urgency === "high" || urgency === "urgent");
  }, [urgency]);

  if (!show) return null;

  return (
    <div className="space-y-2 p-4 border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-900 rounded-lg animate-fade-in">
      <Label className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
        <AlertTriangle className="h-4 w-4" />
        Why is this {urgency}?
      </Label>
      <Textarea
        placeholder={`Please explain why this issue requires ${urgency} attention...`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="border-orange-200 focus:border-orange-400"
      />
      <p className="text-xs text-muted-foreground">
        This helps admins prioritize and respond faster to critical issues.
      </p>
    </div>
  );
};
