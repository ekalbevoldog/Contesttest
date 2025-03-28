
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

export default function Messages() {
  const [message, setMessage] = useState("");

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-4">
                {/* Sample conversations - will be replaced with real data */}
                {['User 1', 'User 2'].map((user, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer">
                    <Avatar>
                      <AvatarFallback>{user[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user}</div>
                      <div className="text-sm text-muted-foreground">Last message...</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="md:col-span-2">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>U1</AvatarFallback>
              </Avatar>
              <CardTitle>User 1</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-16rem)] mb-4">
              <div className="space-y-4 p-4">
                {/* Sample messages - will be replaced with real data */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
                    Hello!
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                    Hi there!
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <Button size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
