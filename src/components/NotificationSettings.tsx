import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Moon, Volume2, VolumeX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettings {
  enabled: boolean;
  silentMode: boolean;
  silentStart: string;
  silentEnd: string;
  soundEnabled: boolean;
  soundTheme: string;
}

const SOUND_THEMES = [
  { id: "default", name: "Default", sounds: { new: "/sounds/new.mp3", reply: "/sounds/reply.mp3", resolved: "/sounds/resolved.mp3" } },
  { id: "minimal", name: "Minimal", sounds: { new: "/sounds/minimal-new.mp3", reply: "/sounds/minimal-reply.mp3", resolved: "/sounds/minimal-resolved.mp3" } },
  { id: "gentle", name: "Gentle", sounds: { new: "/sounds/gentle-new.mp3", reply: "/sounds/gentle-reply.mp3", resolved: "/sounds/gentle-resolved.mp3" } },
];

export const NotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    silentMode: false,
    silentStart: "23:00",
    silentEnd: "07:00",
    soundEnabled: true,
    soundTheme: "default",
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem("notificationSettings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("notificationSettings", JSON.stringify(newSettings));
    
    toast({
      title: "Settings Updated",
      description: "Your notification preferences have been saved",
    });
  };

  const isInSilentPeriod = () => {
    if (!settings.silentMode) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.silentStart.split(":").map(Number);
    const [endHour, endMin] = settings.silentEnd.split(":").map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime > endTime) {
      // Overnight period (e.g., 23:00 to 07:00)
      return currentTime >= startTime || currentTime < endTime;
    }
    
    return currentTime >= startTime && currentTime < endTime;
  };

  const playTestSound = () => {
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {
      toast({
        title: "Sound Test",
        description: "Could not play sound. Make sure audio is enabled.",
        variant: "destructive",
      });
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.enabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for updates
              </p>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting("enabled", checked)}
          />
        </div>

        {/* Silent Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label>Night-Time Silent Mode</Label>
              <p className="text-sm text-muted-foreground">
                No notifications during quiet hours
              </p>
            </div>
          </div>
          <Switch
            checked={settings.silentMode}
            onCheckedChange={(checked) => updateSetting("silentMode", checked)}
          />
        </div>

        {settings.silentMode && (
          <div className="ml-8 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <input
                type="time"
                value={settings.silentStart}
                onChange={(e) => updateSetting("silentStart", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <input
                type="time"
                value={settings.silentEnd}
                onChange={(e) => updateSetting("silentEnd", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
          </div>
        )}

        {isInSilentPeriod() && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-600 flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Silent mode is currently active
            </p>
          </div>
        )}

        {/* Sound Settings */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.soundEnabled ? (
              <Volume2 className="h-5 w-5 text-primary" />
            ) : (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label>Notification Sounds</Label>
              <p className="text-sm text-muted-foreground">
                Play sounds for notifications
              </p>
            </div>
          </div>
          <Switch
            checked={settings.soundEnabled}
            onCheckedChange={(checked) => updateSetting("soundEnabled", checked)}
          />
        </div>

        {settings.soundEnabled && (
          <div className="ml-8 space-y-4">
            <div className="space-y-2">
              <Label>Sound Theme</Label>
              <Select
                value={settings.soundTheme}
                onValueChange={(value) => updateSetting("soundTheme", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOUND_THEMES.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={playTestSound} className="gap-2">
              <Volume2 className="h-4 w-4" />
              Test Sound
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to check if notifications should be shown
export const shouldShowNotification = (): boolean => {
  const saved = localStorage.getItem("notificationSettings");
  if (!saved) return true;
  
  const settings: NotificationSettings = JSON.parse(saved);
  if (!settings.enabled) return false;
  
  if (settings.silentMode) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.silentStart.split(":").map(Number);
    const [endHour, endMin] = settings.silentEnd.split(":").map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime > endTime) {
      if (currentTime >= startTime || currentTime < endTime) return false;
    } else {
      if (currentTime >= startTime && currentTime < endTime) return false;
    }
  }
  
  return true;
};
