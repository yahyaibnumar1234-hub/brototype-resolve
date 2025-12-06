import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface MoodSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  showSatisfaction?: boolean;
}

const moods = [
  { value: "angry", label: "Angry", emoji: "😡", description: "Very upset" },
  { value: "concerned", label: "Concerned", emoji: "😟", description: "Worried" },
  { value: "okay", label: "Okay", emoji: "🙂", description: "Neutral feeling" },
  { value: "frustrated", label: "Frustrated", emoji: "😤", description: "Annoyed" },
];

const satisfactionMoods = [
  { value: "very_satisfied", label: "Very Satisfied", emoji: "😊", description: "Great resolution" },
  { value: "satisfied", label: "Satisfied", emoji: "🙂", description: "Issue resolved" },
  { value: "neutral", label: "Neutral", emoji: "😐", description: "Okay resolution" },
  { value: "unsatisfied", label: "Unsatisfied", emoji: "😞", description: "Not resolved properly" },
];

export const MoodSelector = ({ value, onChange, showSatisfaction = false }: MoodSelectorProps) => {
  const displayMoods = showSatisfaction ? satisfactionMoods : moods;
  
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {showSatisfaction ? "How satisfied are you with the resolution?" : "How do you feel about this issue?"}
      </Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-2 gap-3">
        {displayMoods.map((mood) => (
          <div key={mood.value} className="relative">
            <RadioGroupItem
              value={mood.value}
              id={`mood-${mood.value}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`mood-${mood.value}`}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-muted bg-card p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span className="text-xs font-medium">{mood.label}</span>
              <span className="text-[10px] text-muted-foreground">{mood.description}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
