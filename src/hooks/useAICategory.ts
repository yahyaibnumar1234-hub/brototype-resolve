import { useState, useEffect, useRef } from "react";

const categoryKeywords: Record<string, string[]> = {
  technical: ["wifi", "internet", "laptop", "computer", "software", "login", "access", "system", "network", "connection"],
  facilities: ["room", "chair", "desk", "bathroom", "ac", "fan", "light", "electricity", "water", "building", "infrastructure"],
  curriculum: ["course", "syllabus", "content", "learning", "lesson", "module", "study", "material", "assignment"],
  mentorship: ["mentor", "guidance", "support", "help", "advice", "feedback", "review", "doubt", "clarification"],
  hostel: ["hostel", "accommodation", "room", "mess", "food", "bed", "laundry", "roommate"],
  fees: ["fee", "payment", "refund", "billing", "invoice", "money", "cost", "charge"],
};

export const useAICategory = (text: string) => {
  const [suggestedCategory, setSuggestedCategory] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!text || text.length < 10) {
      setSuggestedCategory("");
      setConfidence(0);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      const lowerText = text.toLowerCase();
      const scores: Record<string, number> = {};

      // Calculate scores for each category
      Object.entries(categoryKeywords).forEach(([category, keywords]) => {
        let score = 0;
        keywords.forEach((keyword) => {
          const regex = new RegExp(`\\b${keyword}\\b`, "gi");
          const matches = lowerText.match(regex);
          if (matches) {
            score += matches.length;
          }
        });
        scores[category] = score;
      });

      // Find category with highest score
      const maxScore = Math.max(...Object.values(scores));
      const bestCategory = Object.entries(scores).find(
        ([_, score]) => score === maxScore
      )?.[0];

      if (bestCategory && maxScore > 0) {
        setSuggestedCategory(bestCategory);
        // Confidence based on score (max 95%)
        setConfidence(Math.min(95, maxScore * 15));
      } else {
        setSuggestedCategory("");
        setConfidence(0);
      }
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text]);

  return { suggestedCategory, confidence };
};
