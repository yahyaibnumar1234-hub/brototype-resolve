import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Wifi, Laptop, Home, Users, Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
}

interface ComplaintTemplatesProps {
  onSelectTemplate: (template: Omit<Template, 'id'>) => void;
}

const iconMap: Record<string, any> = {
  'Wi-Fi Not Working': Wifi,
  'Laptop Issue': Laptop,
  'Hostel Maintenance': Home,
  'Mentor Not Available': Users,
  'Classroom AC Not Working': Wind,
};

export const ComplaintTemplates = ({ onSelectTemplate }: ComplaintTemplatesProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('complaint_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate({
      title: template.title,
      description: template.description,
      category: template.category,
      urgency: template.urgency,
    });
    toast({
      title: "Template Applied",
      description: "Quick complaint template loaded successfully",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          One-Tap Quick Complaints
        </h3>
        <p className="text-sm text-muted-foreground">
          Submit in seconds with pre-made templates
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const Icon = iconMap[template.title] || Zap;
          return (
            <Button
              key={template.id}
              variant="outline"
              className="h-auto py-4 px-4 flex flex-col items-start gap-2 hover:bg-primary/5 hover:border-primary transition-all"
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">{template.title}</span>
              </div>
              <p className="text-xs text-muted-foreground text-left line-clamp-2">
                {template.description}
              </p>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
