import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRStatusCheckProps {
  complaintId: string;
  title: string;
}

export const QRStatusCheck = ({ complaintId, title }: QRStatusCheckProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Generate QR code URL using a free API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `${window.location.origin}/complaint/${complaintId}`
  )}`;

  const downloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `complaint-${complaintId.slice(0, 8)}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "QR Code Downloaded",
        description: "Scan this QR code to check complaint status",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download QR code",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="h-4 w-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complaint QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-white p-4 rounded-lg">
            <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
          </div>
          <p className="text-sm text-center text-muted-foreground max-w-xs">
            Scan this QR code to instantly check the status of your complaint
          </p>
          <p className="text-xs font-medium truncate max-w-full px-4">
            {title}
          </p>
          <Button onClick={downloadQR} className="gap-2">
            <Download className="h-4 w-4" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
