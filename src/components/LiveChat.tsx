import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Loader2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
  is_admin: boolean;
}

interface LiveChatProps {
  complaintId: string;
  isEnabled?: boolean;
}

export const LiveChat = ({ complaintId, isEnabled = true }: LiveChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [isOpen, complaintId]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id,
        message,
        created_at,
        user_id,
        profiles!comments_user_id_fkey (
          full_name
        )
      `)
      .eq("complaint_id", complaintId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(
        data.map((m: any) => ({
          id: m.id,
          sender_id: m.user_id,
          sender_name: m.profiles?.full_name || "Unknown",
          message: m.message,
          created_at: m.created_at,
          is_admin: false, // Will be determined by comparison with current user
        }))
      );
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat-${complaintId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `complaint_id=eq.${complaintId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setLoading(true);

    const { error } = await supabase.from("comments").insert({
      complaint_id: complaintId,
      user_id: user.id,
      message: newMessage.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }

    setLoading(false);
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg gap-0"
          variant="neon"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      ) : (
        <Card className="fixed bottom-4 right-4 w-80 sm:w-96 shadow-xl animate-scale-in z-50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Live Chat
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64 px-4">
              <div className="space-y-3 py-2">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender_id === user?.id ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.sender_id === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-xs font-medium mb-1 opacity-80">
                          {msg.sender_name}
                        </p>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(msg.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[40px] max-h-[80px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  size="icon"
                  className="shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
