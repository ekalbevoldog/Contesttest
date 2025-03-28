import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";

export default function MessageCenter() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const { user } = useAuth();
  const { sendMessage, lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        if (data.type === 'message') {
          setMessages(prev => [...prev, data]);
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    }
  }, [lastMessage]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;

    sendMessage({
      type: 'message',
      content: message,
      recipientId: selectedChat
    });

    setMessage('');
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-4">
                {['Support', 'Partnerships'].map((chat, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer ${
                      selectedChat === i ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedChat(i)}
                  >
                    <Avatar>
                      <AvatarFallback>{chat[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{chat}</div>
                      <div className="text-sm text-muted-foreground">Click to start chat</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {selectedChat !== null ? ['S', 'P'][selectedChat] : '?'}
                </AvatarFallback>
              </Avatar>
              <CardTitle>
                {selectedChat !== null ? ['Support', 'Partnerships'][selectedChat] : 'Select a chat'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-16rem)] mb-4">
              <div className="space-y-4 p-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg p-3 max-w-[80%] ${
                      msg.sender === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}