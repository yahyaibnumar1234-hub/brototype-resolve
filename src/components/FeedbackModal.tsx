import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedbackModalProps {
  complaintId: string;
  open: boolean;
  onClose: () => void;
}

export const FeedbackModal = ({ complaintId, open, onClose }: FeedbackModalProps) => {
  const [speedRating, setSpeedRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (speedRating === 0 || qualityRating === 0 || communicationRating === 0) {
      toast({
        title: "Missing Ratings",
        description: "Please provide all three ratings",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("complaint_feedback").insert({
      complaint_id: complaintId,
      student_id: user?.id,
      speed_rating: speedRating,
      quality_rating: qualityRating,
      communication_rating: communicationRating,
      comment: comment.trim() || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Thank You!",
        description: "Your feedback has been submitted",
      });
      onClose();
    }

    setSubmitting(false);
  };

  const RatingStars = ({
    rating,
    onChange,
    label,
  }: {
    rating: number;
    onChange: (value: number) => void;
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                value <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            Help us improve by rating how we handled your complaint
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RatingStars
            rating={speedRating}
            onChange={setSpeedRating}
            label="Resolution Speed"
          />
          <RatingStars
            rating={qualityRating}
            onChange={setQualityRating}
            label="Resolution Quality"
          />
          <RatingStars
            rating={communicationRating}
            onChange={setCommunicationRating}
            label="Communication"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Additional Comments (Optional)
            </label>
            <Textarea
              placeholder="Share more about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
            Submit Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
