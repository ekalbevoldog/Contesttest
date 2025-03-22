import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import AthleteProfileForm from "./AthleteProfileForm";
import BusinessProfileForm from "./BusinessProfileForm";
import MatchResults from "./MatchResults";
import { Send } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";

type MessageType = {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isFormPrompt?: boolean;
  showAthleteForm?: boolean;
  showBusinessForm?: boolean;
  showMatchResults?: boolean;
  matchData?: any;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const [isProcessingForm, setIsProcessingForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Set up WebSocket connection
  const { lastMessage, connectionStatus } = useWebSocket(session);
  
  // Initialize session and welcome message
  useEffect(() => {
    async function initSession() {
      try {
        const response = await fetch("/api/chat/session", {
          method: "POST",
          credentials: "include"
        });
        const data = await response.json();
        setSession(data.sessionId);
        
        // Add welcome message
        setMessages([
          {
            id: "welcome",
            type: "assistant",
            content: "Welcome to NIL Connect! I'm here to help match college athletes with businesses for NIL (Name, Image, Likeness) opportunities. To get started, could you let me know if you're a college athlete looking for partnerships or a business looking to connect with athletes?",
            timestamp: new Date(),
          }
        ]);
      } catch (error) {
        console.error("Failed to initialize chat session:", error);
        toast({
          title: "Connection Error",
          description: "Failed to start chat session. Please try again.",
          variant: "destructive"
        });
      }
    }
    
    initSession();
  }, [toast]);
  
  // Send chat message to API
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest("POST", "/api/chat/message", {
        message,
        sessionId: session
      });
    },
    onSuccess: async (response) => {
      const responseData = await response.json();
      
      // Add assistant response to messages
      const newMessage: MessageType = {
        id: Date.now().toString(),
        type: "assistant",
        content: responseData.reply,
        timestamp: new Date(),
        isFormPrompt: responseData.isFormPrompt || false,
        showAthleteForm: responseData.showAthleteForm || false,
        showBusinessForm: responseData.showBusinessForm || false,
        showMatchResults: responseData.showMatchResults || false,
        matchData: responseData.matchData
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Message Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      console.error("Error sending message:", error);
    }
  });
  
  // Handle form submission to API
  const submitFormMutation = useMutation({
    mutationFn: async (formData: any) => {
      return apiRequest("POST", "/api/profile", {
        ...formData,
        sessionId: session
      });
    },
    onSuccess: async (response) => {
      const responseData = await response.json();
      
      // Add assistant response after form submission
      const newMessage: MessageType = {
        id: Date.now().toString(),
        type: "assistant",
        content: responseData.reply,
        timestamp: new Date(),
        showMatchResults: responseData.showMatchResults || false,
        matchData: responseData.matchData
      };
      
      setMessages(prev => [...prev, newMessage]);
      setIsProcessingForm(false);
    },
    onError: (error) => {
      setIsProcessingForm(false);
      toast({
        title: "Form Submission Error",
        description: "Failed to submit your profile. Please try again.",
        variant: "destructive"
      });
      console.error("Error submitting form:", error);
    }
  });
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!input.trim() || !session || isTyping) return;
    
    // Add user message to messages
    const userMessage: MessageType = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    
    // Send message to API
    sendMessageMutation.mutate(input.trim());
  };
  
  // Handle form submission
  const handleFormSubmit = (data: any) => {
    setIsProcessingForm(true);
    submitFormMutation.mutate(data);
  };
  
  // Handle keypress (Enter) to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Reset the chat
  const handleResetChat = async () => {
    try {
      await fetch("/api/chat/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionId: session }),
        credentials: "include"
      });
      
      // Re-initialize session
      const response = await fetch("/api/chat/session", {
        method: "POST",
        credentials: "include"
      });
      const data = await response.json();
      setSession(data.sessionId);
      
      // Reset messages with welcome message
      setMessages([
        {
          id: "welcome",
          type: "assistant",
          content: "Welcome to NIL Connect! I'm here to help match college athletes with businesses for NIL (Name, Image, Likeness) opportunities. To get started, could you let me know if you're a college athlete looking for partnerships or a business looking to connect with athletes?",
          timestamp: new Date(),
        }
      ]);
      
      toast({
        title: "Chat Reset",
        description: "Your conversation has been reset."
      });
    } catch (error) {
      toast({
        title: "Reset Error",
        description: "Failed to reset chat. Please try again.",
        variant: "destructive"
      });
      console.error("Error resetting chat:", error);
    }
  };
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === 'match') {
      toast({
        title: "New Match Found!",
        description: lastMessage.message,
      });
      
      // Add the match notification as a message
      if (lastMessage.matchData) {
        const matchMessage: MessageType = {
          id: Date.now().toString(),
          type: 'assistant',
          content: "Great news! We've found a new match for you!",
          timestamp: new Date(),
          showMatchResults: true,
          matchData: lastMessage.matchData
        };
        
        setMessages(prev => [...prev, matchMessage]);
      }
    }
  }, [lastMessage, toast]);
  
  return (
    <Card className="bg-white shadow-md overflow-hidden border border-gray-200">
      <div className="md:flex h-full">
        {/* Left sidebar - for larger screens */}
        <div className="hidden md:block md:w-1/4 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Chats</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="p-4 hover:bg-gray-100 cursor-pointer bg-gray-100 border-l-4 border-primary-600">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-gray-900">New Conversation</p>
                <span className="text-xs text-gray-500">Just now</span>
              </div>
              <p className="text-xs text-gray-500 truncate">Getting started with NIL Connect...</p>
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="md:w-3/4 flex flex-col h-full">
          {/* Chat header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
            <div>
              <div className="flex items-center">
                <h3 className="text-lg font-medium text-gray-900">NIL Matchmaking Assistant</h3>
                <div className="flex items-center ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                  <span className="mr-1">Status:</span>
                  <div className={`h-3 w-3 rounded-full ${connectionStatus === 'open' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    title={`WebSocket status: ${connectionStatus}`}></div>
                  <span className="ml-1 text-xs">
                    {connectionStatus === 'open' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Connecting athletes and businesses</p>
            </div>
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 rounded-full"
                onClick={handleResetChat}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
                Reset Chat
              </Button>
            </div>
          </div>

          {/* Chat messages */}
          <ScrollArea className="flex-1 p-6 h-[calc(100vh-16rem)] md:h-[calc(100vh-10rem)]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.type === 'assistant' ? (
                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
                          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 bg-gray-100 rounded-lg py-3 px-4 max-w-3xl">
                        <div className="text-sm text-gray-900">
                          <p className="font-medium mb-1">NIL Connect Assistant</p>
                          <p>{message.content}</p>
                          
                          {/* Show athlete form if needed */}
                          {message.showAthleteForm && (
                            <div className="mt-4">
                              <AthleteProfileForm onSubmit={handleFormSubmit} isLoading={isProcessingForm} />
                            </div>
                          )}
                          
                          {/* Show business form if needed */}
                          {message.showBusinessForm && (
                            <div className="mt-4">
                              <BusinessProfileForm onSubmit={handleFormSubmit} isLoading={isProcessingForm} />
                            </div>
                          )}
                          
                          {/* Show match results if needed */}
                          {message.showMatchResults && message.matchData && (
                            <div className="mt-4">
                              <MatchResults match={message.matchData} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start mb-4 justify-end">
                      <div className="mr-3 bg-primary-600 text-white rounded-lg py-3 px-4 max-w-3xl">
                        <div className="text-sm">
                          <p>{message.content}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700">
                          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Show typing indicator while waiting for response */}
              {isTyping && (
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 bg-gray-100 rounded-lg py-3 px-4">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                      <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Chat input area */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex space-x-3">
              <div className="flex-grow">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isTyping || isProcessingForm}
                />
              </div>
              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping || isProcessingForm}
                className="flex items-center"
              >
                <Send className="h-5 w-5 mr-1" />
                Send
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Your data is securely processed and stored to provide the best matches.</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
