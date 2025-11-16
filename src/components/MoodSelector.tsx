import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface MoodSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

const moods = [
  { value: "angry", label: "Angry", emoji: "😡" },
  { value: "frustrated", label: "Frustrated", emoji: "😤" },
  { value: "sad", label: "Sad", emoji: "😞" },
  { value: "neutral", label: "Neutral", emoji: "🙂" },
];

export const MoodSelector = ({ value, onChange }: MoodSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">How do you feel about this issue?</Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-2 gap-3">
        {moods.map((mood) => (
          <div key={mood.value} className="relative">
            <RadioGroupItem
              value={mood.value}
              id={mood.value}
              className="peer sr-only"
            />
            <Label
              htmlFor={mood.value}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-sm font-medium">{mood.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
