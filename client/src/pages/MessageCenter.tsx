
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";

type Message = {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
};

export default function MessageCenter() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const { user } = useAuth();
  const { sendMessage, lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        if (data.type === 'message') {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            content: data.content,
            sender: data.sender,
            timestamp: new Date()
          }]);
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    }
  }, [lastMessage]);

  const handleSendMessage = () => {
    if (!message.trim() || selectedChat === null) return;

    const newMessage = {
      id: Date.now().toString(),
      content: message,
      sender: user?.username || 'You',
      timestamp: new Date()
    };

    sendMessage({
      type: 'message',
      content: message,
      recipientId: selectedChat
    });

    setMessages(prev => [...prev, newMessage]);
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
          <CardHeader>
            <CardTitle>
              {selectedChat !== null ? ['Support', 'Partnerships'][selectedChat] : 'Select a chat'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-16rem)] mb-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 ${
                      msg.sender === 'You' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <p className="text-sm font-medium mb-1">{msg.sender}</p>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                disabled={selectedChat === null}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={selectedChat === null || !message.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
