import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RecentCategoriesProps {
  onSelect: (category: string) => void;
  currentCategory?: string;
}

const categoryLabels: Record<string, string> = {
  technical: "Technical",
  facilities: "Facilities",
  curriculum: "Curriculum",
  mentorship: "Mentorship",
  other: "Other",
};

export const RecentCategories = ({ onSelect, currentCategory }: RecentCategoriesProps) => {
  const [recentCategories, setRecentCategories] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchRecentCategories();
  }, [user]);

  const fetchRecentCategories = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("complaints")
      .select("category")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      // Count category frequency
      const categoryCount: Record<string, number> = {};
      data.forEach((c) => {
        categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
      });

      // Sort by frequency and get top 3
      const sorted = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);

      setRecentCategories(sorted);
    }
  };

  if (recentCategories.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Recently used
      </p>
      <div className="flex flex-wrap gap-2">
        {recentCategories.map((category) => (
          <Button
            key={category}
            type="button"
            variant={currentCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(category)}
            className="text-xs"
          >
            {categoryLabels[category] || category}
          </Button>
        ))}
      </div>
    </div>
  );
};
