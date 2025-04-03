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
import CompactMatchResults from "./CompactMatchResults";
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
  const { lastMessage, sendMessage, connectionStatus } = useWebSocket(session);

useEffect(() => {
  if (session) {
    // Register session with WebSocket
    sendMessage({
      type: 'register',
      sessionId: session
    });

    // Start presence heartbeat
    const heartbeat = setInterval(() => {
      sendMessage({
        type: 'presence',
        sessionId: session
      });
    }, 30000);

    return () => clearInterval(heartbeat);
  }
}, [session, sendMessage]);

const handleFileUpload = async (files: FileList) => {
  // In a real implementation, upload files to storage and get URLs
  // For demo, we'll use fake URLs
  const attachments = Array.from(files).map(file => ({
    type: file.type,
    url: URL.createObjectURL(file),
    name: file.name,
    size: file.size
  }));

  sendMessage({
    type: 'message',
    sessionId: session,
    role: 'user',
    content: 'Sent attachments',
    metadata: {
      attachments
    }
  });
};
  
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
        
        // Add welcome message with enhanced content
        setMessages([
          {
            id: "welcome",
            type: "assistant",
            content: "👋 Welcome to the Contested AI Assistant! I'm your dedicated partner in creating meaningful athlete-brand connections. \n\nI specialize in matching businesses with athletes across NCAA, minor leagues, Olympic sports, esports, and secondary professional leagues. I've been trained specifically on Contested's platform features, partnership success patterns, and NIL compliance requirements.\n\nHow can I help you today? Are you:\n• An athlete looking for marketing partnerships?\n• A business searching for authentic athlete connections?\n• Just exploring what Contested has to offer?",
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
  
  // Test WebSocket match notification
  const testMatchNotification = async () => {
    if (!session) return;
    
    try {
      const response = await fetch("/api/test/simulate-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionId: session }),
        credentials: "include"
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: "Test Failed",
          description: data.error || "Failed to send test notification",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Test Sent",
          description: "WebSocket notification test was sent successfully. You should receive a match notification shortly."
        });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast({
        title: "Test Error",
        description: "An error occurred when sending the test notification",
        variant: "destructive"
      });
    }
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
      
      // Reset messages with enhanced welcome message
      setMessages([
        {
          id: "welcome",
          type: "assistant",
          content: "👋 Welcome to the Contested AI Assistant! I'm your dedicated partner in creating meaningful athlete-brand connections. \n\nI specialize in matching businesses with athletes across NCAA, minor leagues, Olympic sports, esports, and secondary professional leagues. I've been trained specifically on Contested's platform features, partnership success patterns, and NIL compliance requirements.\n\nHow can I help you today? Are you:\n• An athlete looking for marketing partnerships?\n• A business searching for authentic athlete connections?\n• Just exploring what Contested has to offer?",
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
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement?.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
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
        variant: "default",
      });
      
      // Add the match notification as a message
      if (lastMessage.matchData) {
        const matchMessage: MessageType = {
          id: Date.now().toString(),
          type: 'assistant',
          content: "🎉 Great news! We've found a new partnership match for you! This opportunity was just identified in real-time.",
          timestamp: new Date(),
          showMatchResults: true,
          matchData: {
            ...lastMessage.matchData,
            // Flag to indicate this is a real-time match from WebSocket
            isNewMatch: true 
          }
        };
        
        setMessages(prev => [...prev, matchMessage]);
        
        // Scroll to the bottom after adding the message
        setTimeout(() => {
          if (messagesEndRef.current) {
            const container = messagesEndRef.current.parentElement?.parentElement;
            if (container) {
              container.scrollTop = container.scrollHeight;
            } else {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }, 100);
      }
    }
  }, [lastMessage, toast]);
  
  return (
    <div className="flex flex-col bg-white h-full">
      {/* Fixed height wrapper */}
      <div className="flex flex-col h-full">
        {/* Messages container with fixed height - adjusting to leave room for input area */}
        <div className="h-[calc(100%-80px)] overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {message.type === 'assistant' ? (
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-[#0c1e36] flex items-center justify-center text-white">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-2 bg-gray-100 rounded-lg py-2 px-3 max-w-[85%] shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-900">
                        <p className="font-semibold mb-1 text-sm text-gray-800">Contested Assistant</p>
                        <p className="whitespace-pre-line">{message.content}</p>
                        
                        {/* Show athlete form if needed */}
                        {message.showAthleteForm && (
                          <div className="mt-4 mb-2">
                            <AthleteProfileForm onSubmit={handleFormSubmit} isLoading={isProcessingForm} />
                          </div>
                        )}
                        
                        {/* Show business form if needed */}
                        {message.showBusinessForm && (
                          <div className="mt-4 mb-2">
                            <BusinessProfileForm onSubmit={handleFormSubmit} isLoading={isProcessingForm} />
                          </div>
                        )}
                        
                        {/* Show match results if needed */}
                        {message.showMatchResults && message.matchData && (
                          <div className="mt-4 mb-2">
                            <CompactMatchResults 
                              match={message.matchData} 
                              userType={message.matchData.userType}
                              isNewMatch={message.matchData.isNewMatch}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start mb-4 justify-end">
                    <div className="mr-2 bg-[#0c1e36] text-white rounded-lg py-2 px-3 max-w-[85%] shadow-sm">
                      <div className="text-sm">
                        <p>{message.content}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <div className="h-8 w-8 rounded-full bg-[#0c1e36] flex items-center justify-center text-white">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-2 bg-gray-100 rounded-lg py-2 px-3 shadow-sm border border-gray-200">
                  <div className="flex space-x-2">
                    <div className="h-2.5 w-2.5 bg-[#0c1e36]/70 rounded-full animate-bounce"></div>
                    <div className="h-2.5 w-2.5 bg-[#0c1e36]/70 rounded-full animate-bounce delay-75"></div>
                    <div className="h-2.5 w-2.5 bg-[#0c1e36]/70 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat input area - fixed height */}
        <div className="px-4 py-3 bg-[#f5f7fa] border-t border-gray-200">
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
                className="border-gray-300 focus-visible:ring-[#0c1e36] focus:border-[#0c1e36]"
              />
            </div>
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping || isProcessingForm}
              className="flex items-center bg-[#0c1e36] hover:bg-[#1a3151] text-white"
            >
              <Send className="h-5 w-5 mr-1" />
              Send
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">Pioneering AI-powered athlete-brand partnerships. <span className="font-semibold text-[#0c1e36]">Contested</span> © 2025</p>
        </div>
      </div>
    </div>
  );
}
