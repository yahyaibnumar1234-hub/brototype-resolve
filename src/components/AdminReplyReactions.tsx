import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminReplyReactionsProps {
  commentId: string;
  initialReaction?: "helpful" | "not_helpful" | "thanks" | null;
}

export const AdminReplyReactions = ({ commentId, initialReaction }: AdminReplyReactionsProps) => {
  const [reaction, setReaction] = useState<string | null>(initialReaction || null);
  const { toast } = useToast();

  const handleReaction = (type: "helpful" | "not_helpful" | "thanks") => {
    if (reaction === type) {
      setReaction(null);
      toast({
        title: "Reaction removed",
        description: "Your reaction has been removed",
      });
    } else {
      setReaction(type);
      toast({
        title: "Thanks for your feedback!",
        description: type === "helpful" 
          ? "Glad this was helpful!" 
          : type === "thanks" 
          ? "We appreciate your feedback!" 
          : "We'll try to improve.",
      });
    }
  };

  return (
    <div className="flex items-center gap-1 pt-2">
      <span className="text-xs text-muted-foreground mr-2">Was this helpful?</span>
      <Button
        variant={reaction === "helpful" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-2 gap-1"
        onClick={() => handleReaction("helpful")}
      >
        <ThumbsUp className="h-3 w-3" />
        <span className="text-xs">Helpful</span>
      </Button>
      <Button
        variant={reaction === "not_helpful" ? "destructive" : "ghost"}
        size="sm"
        className="h-7 px-2 gap-1"
        onClick={() => handleReaction("not_helpful")}
      >
        <ThumbsDown className="h-3 w-3" />
        <span className="text-xs">Not helpful</span>
      </Button>
      <Button
        variant={reaction === "thanks" ? "default" : "ghost"}
        size="sm"
        className="h-7 px-2 gap-1"
        onClick={() => handleReaction("thanks")}
      >
        <Heart className="h-3 w-3" />
        <span className="text-xs">Thanks</span>
      </Button>
    </div>
  );
};
