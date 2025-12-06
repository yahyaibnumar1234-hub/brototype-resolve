import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, Link2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CloudFileAttachmentProps {
  onFileAttached: (url: string, name: string) => void;
}

const cloudServices = [
  { id: "gdrive", name: "Google Drive", icon: "📁", color: "bg-blue-50 border-blue-200" },
  { id: "onedrive", name: "OneDrive", icon: "☁️", color: "bg-blue-50 border-blue-200" },
  { id: "dropbox", name: "Dropbox", icon: "📦", color: "bg-blue-50 border-blue-200" },
];

export const CloudFileAttachment = ({ onFileAttached }: CloudFileAttachmentProps) => {
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isAttaching, setIsAttaching] = useState(false);
  
  const { toast } = useToast();

  const handleAttach = () => {
    if (!fileUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter the file URL",
        variant: "destructive",
      });
      return;
    }

    setIsAttaching(true);
    
    // Simulate attaching (in production, you'd validate the URL)
    setTimeout(() => {
      onFileAttached(fileUrl, fileName || "Cloud file");
      toast({
        title: "File Attached",
        description: `${fileName || "File"} has been attached`,
      });
      setOpen(false);
      setFileUrl("");
      setFileName("");
      setSelectedService(null);
      setIsAttaching(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Cloud className="h-4 w-4" />
          Cloud File
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attach from Cloud</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {cloudServices.map((service) => (
              <Button
                key={service.id}
                variant={selectedService === service.id ? "default" : "outline"}
                className="h-auto py-3 flex flex-col gap-1"
                onClick={() => setSelectedService(service.id)}
              >
                <span className="text-xl">{service.icon}</span>
                <span className="text-xs">{service.name}</span>
              </Button>
            ))}
          </div>

          {selectedService && (
            <div className="space-y-3 animate-fade-in">
              <div className="space-y-2">
                <Label>File URL</Label>
                <Input
                  placeholder="Paste the shareable link here..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>File Name (optional)</Label>
                <Input
                  placeholder="e.g., Screenshot of issue"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleAttach}
                disabled={isAttaching}
              >
                {isAttaching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Attach File
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Make sure the file is publicly accessible or shared with view permissions
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
