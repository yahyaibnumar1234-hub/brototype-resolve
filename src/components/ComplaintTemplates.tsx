import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Wifi, Home, DollarSign, Users } from "lucide-react";

interface Template {
  id: string;
  title: string;
  category: string;
  urgency: string;
  description: string;
  icon: React.ReactNode;
}

const templates: Template[] = [
  {
    id: "mentor",
    title: "Mentor Issue",
    category: "mentorship",
    urgency: "medium",
    description: "I need assistance with mentor-related concerns including guidance, feedback, or communication issues.",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "facilities",
    title: "Facilities Issue",
    category: "facilities",
    urgency: "medium",
    description: "There is an issue with the facilities such as classrooms, equipment, or infrastructure that needs attention.",
    icon: <Home className="h-5 w-5" />,
  },
  {
    id: "technical",
    title: "Technical Issue",
    category: "technical",
    urgency: "high",
    description: "I am experiencing technical problems with internet connectivity, systems, or access to learning resources.",
    icon: <Wifi className="h-5 w-5" />,
  },
  {
    id: "fees",
    title: "Fee-Related Issue",
    category: "other",
    urgency: "medium",
    description: "I have a query or concern regarding fees, payments, billing, or refunds.",
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    id: "hostel",
    title: "Hostel Issue",
    category: "other",
    urgency: "medium",
    description: "There is an issue with hostel accommodation, facilities, or related services that requires resolution.",
    icon: <Home className="h-5 w-5" />,
  },
];

interface ComplaintTemplatesProps {
  onSelectTemplate: (template: Omit<Template, "id" | "icon">) => void;
}

export const ComplaintTemplates = ({ onSelectTemplate }: ComplaintTemplatesProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Quick Templates</h3>
        <p className="text-sm text-muted-foreground">
          Start with a template and customize it to your needs
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() =>
              onSelectTemplate({
                title: template.title,
                category: template.category,
                urgency: template.urgency,
                description: template.description,
              })
            }
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {template.icon}
                <CardTitle className="text-base">{template.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
