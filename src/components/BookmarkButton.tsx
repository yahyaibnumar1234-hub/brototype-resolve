import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookmarkButtonProps {
  complaintId: string;
  isBookmarked: boolean;
  onToggle?: (newState: boolean) => void;
  variant?: "icon" | "default";
}

export const BookmarkButton = ({
  complaintId,
  isBookmarked,
  onToggle,
  variant = "icon",
}: BookmarkButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const { toast } = useToast();

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);

    const { error } = await supabase
      .from("complaints")
      .update({ starred: !bookmarked })
      .eq("id", complaintId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    } else {
      setBookmarked(!bookmarked);
      onToggle?.(!bookmarked);
      toast({
        title: bookmarked ? "Removed from bookmarks" : "Added to bookmarks",
        description: bookmarked
          ? "Complaint removed from your favorites"
          : "Complaint added to your favorites",
      });
    }

    setLoading(false);
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={loading}
        className={`h-8 w-8 ${bookmarked ? "text-yellow-500" : "text-muted-foreground"}`}
      >
        {bookmarked ? (
          <BookmarkCheck className="h-4 w-4 fill-current" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={bookmarked ? "default" : "outline"}
      onClick={handleToggle}
      disabled={loading}
      className="gap-2"
    >
      {bookmarked ? (
        <>
          <BookmarkCheck className="h-4 w-4" />
          Bookmarked
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" />
          Bookmark
        </>
      )}
    </Button>
  );
};
