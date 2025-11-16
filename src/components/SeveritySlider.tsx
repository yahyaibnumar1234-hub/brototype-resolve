import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SeveritySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export const SeveritySlider = ({ value, onChange }: SeveritySliderProps) => {
  const getSeverityColor = (score: number) => {
    if (score <= 3) return "text-green-600";
    if (score <= 6) return "text-yellow-600";
    if (score <= 8) return "text-orange-600";
    return "text-red-600";
  };

  const getSeverityLabel = (score: number) => {
    if (score <= 3) return "Minor Issue";
    if (score <= 6) return "Moderate Issue";
    if (score <= 8) return "Serious Issue";
    return "Critical Issue";
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">Problem Severity</Label>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getSeverityColor(value)}`}>
            {value}
          </span>
          <span className="text-sm text-muted-foreground">/10</span>
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        min={1}
        max={10}
        step={1}
        className="w-full"
      />
      <p className={`text-center text-sm font-medium ${getSeverityColor(value)}`}>
        {getSeverityLabel(value)}
      </p>
    </div>
  );
};
