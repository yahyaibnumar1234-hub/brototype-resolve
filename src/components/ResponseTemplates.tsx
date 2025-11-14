import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

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

export const ResponseTemplates = ({ onSelectTemplate }: ResponseTemplatesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" />
          Quick Responses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {templates.map((template, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="w-full justify-start text-left text-xs h-auto py-2"
            onClick={() => onSelectTemplate(template)}
          >
            {template}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
