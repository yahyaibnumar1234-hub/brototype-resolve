import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Users, Building } from "lucide-react";

interface ImportanceBadgeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

const importanceTypes = [
  { value: "personal", label: "Personal", icon: User, description: "Affects only me" },
  { value: "group", label: "Group", icon: Users, description: "Affects my batch/group" },
  { value: "campus-wide", label: "Campus-Wide", icon: Building, description: "Affects everyone" },
];

export const ImportanceBadgeSelector = ({ value, onChange }: ImportanceBadgeSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Who does this affect?</Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-3 gap-2">
        {importanceTypes.map((type) => {
          const Icon = type.icon;
          return (
            <div key={type.value} className="relative">
              <RadioGroupItem
                value={type.value}
                id={type.value}
                className="peer sr-only"
              />
              <Label
                htmlFor={type.value}
                className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-muted bg-card p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium text-center">{type.label}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">
                  {type.description}
                </span>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};
