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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
      <div className="w-full max-w-md mx-auto bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh] max-h-[800px] border border-zinc-800">
        {/* Premium Gradient Header with Controls */}
        <div className="relative bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 p-5 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-amber-500/0 opacity-50"></div>
          
          <div className="flex justify-between items-center mb-2 relative z-10">
            <div className="flex items-center">
              <div className="mr-3 h-8 w-8 rounded-full bg-gradient-to-r from-red-500 to-amber-500 flex items-center justify-center text-white shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v16.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h12.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V7.5L15.5 2z"></path>
                  <path d="M3 7.6v12.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h12.8"></path>
                  <path d="M15 2v5.4c0 .4.2.8.5 1.1.3.3.7.5 1.1.5H22"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Contested AI</h2>
                <p className="text-xs text-zinc-300 font-light mt-0.5">Personalized NIL partnership advisor</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)} 
              className="relative overflow-hidden group h-8 w-8 rounded-full bg-zinc-800/70 hover:bg-zinc-700/80 border border-zinc-700/50 flex items-center justify-center transition-all duration-200"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/30 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></span>
              <X className="h-4 w-4 text-zinc-300 group-hover:text-white relative z-10" />
            </button>
          </div>
          
          <div className="flex mt-4 space-x-3 relative z-10">
            <div className="flex items-center px-3 py-1.5 rounded-full text-xs bg-zinc-800/80 border border-zinc-700/50 text-white">
              <div className="h-2 w-2 rounded-full mr-2 bg-green-400 animate-pulse"></div>
              <span className="font-medium text-xs">Live Updates</span>
            </div>
            
            <button 
              className="flex items-center gap-1.5 bg-gradient-to-r from-red-500/80 to-amber-500/80 hover:from-red-500 hover:to-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 shadow-lg hover:shadow-red-500/20"
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
              className="flex items-center gap-1.5 bg-zinc-800/80 border border-zinc-700/50 text-white hover:bg-zinc-700/80 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300"
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
        <div className="flex-grow overflow-hidden flex flex-col border-t border-zinc-800">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}