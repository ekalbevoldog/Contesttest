import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Avatar,
  AvatarFallback,
  AvatarImage 
} from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare, 
  Info, 
  Send, 
  Building2, 
  User, 
  Search,
  Filter,
  PlusCircle,
  Megaphone,
  ArrowLeft
} from "lucide-react";

export default function MessageCenter() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  
  // Get user type and ensure authenticated
  useEffect(() => {
    const storedUserType = localStorage.getItem('contestedUserType');
    const isLoggedIn = localStorage.getItem('contestedUserLoggedIn') === 'true';
    
    if (!isLoggedIn) {
      navigate('/');
      return;
    }
    
    setUserType(storedUserType);
    setLoading(false);
  }, [navigate]);

  // Mock data for chats - this would come from an API in a real implementation
  const companyMessages = [
    {
      id: "company-1",
      name: "Contested Support",
      avatar: "CS",
      lastMessage: "Your profile has been approved. Welcome to Contested!",
      timestamp: "2h ago",
      unread: true
    },
    {
      id: "company-2",
      name: "Contested Updates",
      avatar: "CU",
      lastMessage: "New feature release: improved matching algorithm now available",
      timestamp: "2d ago",
      unread: false
    },
    {
      id: "company-3",
      name: "Contested Payments",
      avatar: "CP",
      lastMessage: "Your subscription has been renewed for the next month",
      timestamp: "5d ago",
      unread: false
    }
  ];
  
  // Generate appropriate partners based on user type
  const partnerMessages = userType === 'athlete' 
    ? [
        {
          id: "business-1",
          name: "SportsTech Inc.",
          avatar: "ST",
          lastMessage: "Let's discuss the promotional schedule for next month",
          timestamp: "1h ago",
          unread: true,
          type: "business"
        },
        {
          id: "business-2",
          name: "Fitwave Apparel",
          avatar: "FA",
          lastMessage: "The photos from yesterday's shoot look great!",
          timestamp: "1d ago",
          unread: false,
          type: "business"
        },
        {
          id: "business-3",
          name: "Nutrition Plus",
          avatar: "NP",
          lastMessage: "Can you review our new product materials?",
          timestamp: "3d ago",
          unread: false,
          type: "business"
        }
      ]
    : [
        {
          id: "athlete-1",
          name: "Sarah Johnson",
          avatar: "SJ",
          lastMessage: "I'll send the content draft for approval by tomorrow",
          timestamp: "3h ago",
          unread: true,
          type: "athlete"
        },
        {
          id: "athlete-2",
          name: "Marcus Thompson",
          avatar: "MT",
          lastMessage: "Thanks for the campaign brief, working on ideas now",
          timestamp: "1d ago",
          unread: false,
          type: "athlete"
        },
        {
          id: "athlete-3",
          name: "Emily Rodriguez",
          avatar: "ER",
          lastMessage: "When do you need the final assets delivered?",
          timestamp: "2d ago",
          unread: false,
          type: "athlete"
        }
      ];
  
  // Example conversation history for a selected chat
  const conversationHistory = [
    {
      id: 1,
      sender: "them",
      content: "Hey there! We're excited to have you on board for our upcoming campaign.",
      timestamp: "Yesterday, 3:45 PM",
      senderName: selectedChat === "business-1" ? "SportsTech Inc." : 
                   selectedChat === "athlete-1" ? "Sarah Johnson" : "Contested Support",
      avatar: selectedChat === "business-1" ? "ST" : 
              selectedChat === "athlete-1" ? "SJ" : "CS"
    },
    {
      id: 2,
      sender: "me",
      content: "Thanks for reaching out! I'm looking forward to working together on this.",
      timestamp: "Yesterday, 4:20 PM"
    },
    {
      id: 3,
      sender: "them",
      content: "Great! We'd like to discuss our expectations and timeline. Are you available for a quick call tomorrow?",
      timestamp: "Yesterday, 5:15 PM",
      senderName: selectedChat === "business-1" ? "SportsTech Inc." : 
                   selectedChat === "athlete-1" ? "Sarah Johnson" : "Contested Support",
      avatar: selectedChat === "business-1" ? "ST" : 
              selectedChat === "athlete-1" ? "SJ" : "CS"
    },
    {
      id: 4,
      sender: "me",
      content: "Absolutely! I'm free between 1-3pm tomorrow. Does that work for you?",
      timestamp: "Yesterday, 5:30 PM"
    },
    {
      id: 5,
      sender: "them",
      content: "Perfect! Let's do 1:30pm then. I'll send a calendar invite with meeting details shortly.",
      timestamp: "Yesterday, 5:45 PM",
      senderName: selectedChat === "business-1" ? "SportsTech Inc." : 
                   selectedChat === "athlete-1" ? "Sarah Johnson" : "Contested Support",
      avatar: selectedChat === "business-1" ? "ST" : 
              selectedChat === "athlete-1" ? "SJ" : "CS"
    }
  ];

  const filterMessages = (messages: any[]) => {
    if (!searchText) return messages;
    return messages.filter(message => 
      message.name.toLowerCase().includes(searchText.toLowerCase()) || 
      message.lastMessage.toLowerCase().includes(searchText.toLowerCase())
    );
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // In a real app, this would send the message to the API
    console.log(`Sending message to ${selectedChat}: ${newMessage}`);
    
    // Clear the input
    setNewMessage("");
    
    // For this demo, we'd add the message to the conversation locally
    // and potentially use WebSockets to get real-time updates
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0066cc]"></div>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">Message Center</h1>
          <p className="text-gray-500 mt-1">Manage communications with {userType === 'athlete' ? 'businesses' : 'athletes'} and the Contested team</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="md:col-span-1 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                className="pl-10 pr-4" 
                placeholder="Search messages..." 
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            
            <Card className="border-[#e0f2ff]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-[#0066cc]" />
                    Contested Messages
                  </div>
                  <Badge className="bg-[#0066cc]">{companyMessages.filter(m => m.unread).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-3">
                    {filterMessages(companyMessages).map((chat) => (
                      <div 
                        key={chat.id} 
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChat === chat.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                        } ${chat.unread ? 'border-l-4 border-l-[#0066cc]' : ''}`}
                        onClick={() => setSelectedChat(chat.id)}
                      >
                        <div className="flex gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-r from-[#0066cc] to-[#00a3ff] text-white">
                              {chat.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="font-medium truncate">{chat.name}</div>
                              <div className="text-xs text-gray-500 shrink-0">{chat.timestamp}</div>
                            </div>
                            <div className="text-sm mt-1 text-gray-500 truncate">{chat.lastMessage}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card className="border-[#e0f2ff]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {userType === 'athlete' ? (
                      <Building2 className="h-5 w-5 text-[#0066cc]" />
                    ) : (
                      <User className="h-5 w-5 text-[#0066cc]" />
                    )}
                    {userType === 'athlete' ? 'Business Partners' : 'Athlete Partners'}
                  </div>
                  <Badge className="bg-[#0066cc]">{partnerMessages.filter(m => m.unread).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {filterMessages(partnerMessages).map((chat) => (
                      <div 
                        key={chat.id} 
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedChat === chat.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                        } ${chat.unread ? 'border-l-4 border-l-[#0066cc]' : ''}`}
                        onClick={() => setSelectedChat(chat.id)}
                      >
                        <div className="flex gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-r from-[#0066cc] to-[#00a3ff] text-white">
                              {chat.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="font-medium truncate">{chat.name}</div>
                              <div className="text-xs text-gray-500 shrink-0">{chat.timestamp}</div>
                            </div>
                            <div className="text-sm mt-1 text-gray-500 truncate">{chat.lastMessage}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-4">
                  <Button className="w-full bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6]">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Conversation View */}
          <div className="md:col-span-2">
            <Card className="border-[#e0f2ff] h-full flex flex-col">
              {selectedChat ? (
                <>
                  <CardHeader className="pb-2 border-b">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedChat(null)}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-r from-[#0066cc] to-[#00a3ff] text-white">
                          {selectedChat.startsWith('business') ? 'ST' : 
                          selectedChat.startsWith('athlete') ? 'SJ' : 'CS'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>
                          {selectedChat.startsWith('business') ? 'SportsTech Inc.' : 
                          selectedChat.startsWith('athlete') ? 'Sarah Johnson' : 'Contested Support'}
                        </CardTitle>
                        <CardDescription>
                          {selectedChat.startsWith('business') ? 'Business Partner' : 
                          selectedChat.startsWith('athlete') ? 'Athlete Partner' : 'Platform Support'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 h-[400px] py-4 pr-4">
                      <div className="space-y-5">
                        {conversationHistory.map((message) => (
                          <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] ${message.sender === 'me' ? 'bg-[#0066cc] text-white rounded-tl-xl rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tr-xl rounded-tl-none'} rounded-bl-xl rounded-br-xl p-3`}>
                              {message.sender !== 'me' && (
                                <div className="flex items-center gap-2 mb-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[10px] bg-gradient-to-r from-[#0066cc] to-[#00a3ff] text-white">
                                      {message.avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium">{message.senderName}</span>
                                </div>
                              )}
                              <div>{message.content}</div>
                              <div className={`text-xs ${message.sender === 'me' ? 'text-blue-200' : 'text-gray-500'} mt-1 text-right`}>
                                {message.timestamp}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="pt-4 border-t mt-auto">
                      <div className="flex gap-2">
                        <Textarea 
                          placeholder="Type your message..." 
                          className="min-h-[80px]"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button 
                          className="self-end bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6]"
                          onClick={handleSendMessage}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Conversation Selected</h3>
                  <p className="text-gray-500 max-w-md">
                    Select a conversation from the list to start messaging with your partners or the Contested team.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}