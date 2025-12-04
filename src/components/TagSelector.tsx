import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tag, X } from "lucide-react";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const PREDEFINED_TAGS = [
  { id: "wifi", name: "WiFi", color: "bg-blue-500/20 text-blue-600" },
  { id: "food", name: "Food", color: "bg-orange-500/20 text-orange-600" },
  { id: "attendance", name: "Attendance", color: "bg-purple-500/20 text-purple-600" },
  { id: "behavior", name: "Behavior", color: "bg-red-500/20 text-red-600" },
  { id: "system-error", name: "System Error", color: "bg-yellow-500/20 text-yellow-600" },
  { id: "hostel", name: "Hostel", color: "bg-green-500/20 text-green-600" },
  { id: "transport", name: "Transport", color: "bg-indigo-500/20 text-indigo-600" },
  { id: "fees", name: "Fees", color: "bg-pink-500/20 text-pink-600" },
  { id: "lab", name: "Lab", color: "bg-cyan-500/20 text-cyan-600" },
  { id: "library", name: "Library", color: "bg-teal-500/20 text-teal-600" },
];

export const TagSelector = ({ selectedTags, onTagsChange }: TagSelectorProps) => {
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((t) => t !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Tags (Optional)
      </Label>
      <div className="flex flex-wrap gap-2">
        {PREDEFINED_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <Badge
              key={tag.id}
              variant="outline"
              className={`cursor-pointer transition-all ${
                isSelected
                  ? `${tag.color} border-current`
                  : "hover:bg-accent"
              }`}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
              {isSelected && <X className="h-3 w-3 ml-1" />}
            </Badge>
          );
        })}
      </div>
      {selectedTags.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedTags.length} tag(s) selected
        </p>
      )}
    </div>
  );
};
