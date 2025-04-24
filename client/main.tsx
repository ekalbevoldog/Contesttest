import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeSupabase } from "./lib/supabase-client";

// Initialize Supabase with configuration from server before rendering the app
async function initApp() {
  try {
    // First fetch Supabase configuration from server
    console.log("Initializing Supabase...");
    await initializeSupabase();
    console.log("Supabase initialized, rendering app");
    
    // Then render the application
    createRoot(document.getElementById("root")!).render(<App />);
  } catch (error) {
    console.error("Failed to initialize application:", error);
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center;">
          <h1 style="color: #e11d48; margin-bottom: 16px;">Connection Error</h1>
          <p style="max-width: 600px; margin-bottom: 16px;">
            Could not connect to the Supabase server. Please check your connection and try again.
          </p>
          <button style="padding: 8px 16px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;"
                  onclick="window.location.reload()">
            Retry
          </button>
        </div>
      `;
    }
  }
}

// Start the initialization process
initApp();
