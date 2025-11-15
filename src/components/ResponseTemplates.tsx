import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface ResponseTemplatesProps {
  onSelectTemplate: (message: string) => void;
}

const templates = [
  "We are checking your complaint and will update you soon.",
  "Your issue has been forwarded to the technical team.",
  "This has been resolved. Please confirm and close if satisfied.",
  "We need more information to proceed. Please provide additional details.",
  "Your complaint is now in progress. Expected resolution within 48 hours.",
];

const CHAR_LIMIT = 60;

export const ResponseTemplates = ({ onSelectTemplate }: ResponseTemplatesProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" />
          Quick Responses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {templates.map((template, index) => {
          const isLong = template.length > CHAR_LIMIT;
          const isExpanded = expandedIndex === index;
          const displayText = isLong && !isExpanded 
            ? template.slice(0, CHAR_LIMIT) + "..." 
            : template;

          return (
            <div key={index} className="relative">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left text-xs h-auto py-2 pr-8"
                onClick={() => onSelectTemplate(template)}
              >
                <span className="break-words whitespace-normal">{displayText}</span>
              </Button>
              {isLong && (
                <button
                  onClick={(e) => toggleExpand(index, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded transition-colors"
                  aria-label={isExpanded ? "Show less" : "Read more"}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
