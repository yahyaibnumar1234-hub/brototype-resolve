import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LocationSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

const locations = [
  { value: "library", label: "Library" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "lab-1", label: "Lab 1" },
  { value: "lab-2", label: "Lab 2" },
  { value: "lab-3", label: "Lab 3" },
  { value: "classroom-a", label: "Classroom A" },
  { value: "classroom-b", label: "Classroom B" },
  { value: "classroom-c", label: "Classroom C" },
  { value: "hostel-block-a", label: "Hostel Block A" },
  { value: "hostel-block-b", label: "Hostel Block B" },
  { value: "hostel-block-c", label: "Hostel Block C" },
  { value: "sports-complex", label: "Sports Complex" },
  { value: "auditorium", label: "Auditorium" },
  { value: "admin-office", label: "Admin Office" },
  { value: "parking", label: "Parking Area" },
  { value: "common-room", label: "Common Room" },
  { value: "other", label: "Other Location" },
];

export const LocationSelector = ({ value, onChange }: LocationSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="location">Location</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="location">
          <SelectValue placeholder="Select location where issue occurred" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((location) => (
            <SelectItem key={location.value} value={location.value}>
              {location.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
