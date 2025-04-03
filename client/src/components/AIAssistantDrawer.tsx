import { useState, useEffect } from "react";
import { X } from "lucide-react";
import ChatInterface from "./ChatInterface";
import { useToast } from "@/hooks/use-toast";

export default function AIAssistantDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Listen for the custom event to toggle the AI assistant
  useEffect(() => {
    const handleToggleAssistant = () => {
      setIsOpen(prev => !prev);
    };
    
    window.addEventListener('toggle-ai-assistant', handleToggleAssistant);
    
    return () => {
      window.removeEventListener('toggle-ai-assistant', handleToggleAssistant);
    };
  }, []);

  // Initialize session when needed
  useEffect(() => {
    if (isOpen && !sessionId) {
      initSession();
    }
  }, [isOpen]);

  // Initialize chat session
  const initSession = async () => {
    try {
      const response = await fetch("/api/chat/session", {
        method: "POST",
        credentials: "include"
      });
      const data = await response.json();
      setSessionId(data.sessionId);
    } catch (error) {
      console.error("Error initializing session:", error);
      toast({
        title: "Connection Error",
        description: "Failed to start chat session. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Test match notification
  const testMatchNotification = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch("/api/test/simulate-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionId }),
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

  // Reset the chat
  const handleResetChat = async () => {
    if (!sessionId) return;
    
    try {
      await fetch("/api/chat/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionId }),
        credentials: "include"
      });
      
      // Re-initialize session
      const response = await fetch("/api/chat/session", {
        method: "POST",
        credentials: "include"
      });
      const data = await response.json();
      setSessionId(data.sessionId);
      
      // Force refresh chat interface
      window.location.reload();
      
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden flex flex-col h-[85vh] md:h-[80vh]">
        {/* Single Header with Controls */}
        <div className="bg-[#0c1e36] p-4 text-white">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Contested Assistant</h2>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-white hover:text-white/80 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <p className="text-sm text-gray-300">Connecting SMBs with mid-tier athletes</p>
          
          <div className="flex mt-3 space-x-3">
            <div className="flex items-center px-3 py-1.5 rounded-full text-xs bg-[rgba(0,255,204,0.15)] border border-[rgba(0,255,204,0.5)] text-white">
              <div className="h-3 w-3 rounded-full mr-2 bg-[#00ffcc]"></div>
              <span className="font-medium">Live Updates</span>
            </div>
            
            <button 
              className="flex items-center gap-1 bg-[#243b5e] hover:bg-[#304d77] text-white px-3 py-1.5 rounded-full text-xs font-medium"
              onClick={testMatchNotification}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13"></path>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
              </svg>
              Test Match
            </button>
            
            <button 
              className="flex items-center gap-1 border border-[#3a5a88] text-white hover:bg-[rgba(58,90,136,0.2)] px-3 py-1.5 rounded-full text-xs font-medium"
              onClick={handleResetChat}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
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
              Reset
            </button>
          </div>
        </div>

        {/* Chat content */}
        <div className="flex-grow overflow-hidden flex flex-col">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}