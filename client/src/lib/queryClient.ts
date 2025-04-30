import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`[API] Making ${method} request to ${url}`);
  
  // Get auth token from localStorage if available
  const authToken = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');
  
  // Prepare headers
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
  };
  
  // Add auth header if token is available
  if (authToken) {
    console.log(`[API] Adding token auth header for user ${userId}`);
    headers['Authorization'] = `Bearer ${authToken}`;
  } else {
    console.log('[API] No auth token found in localStorage');
  }
  
  // Log request details for debugging
  console.log('[API] Request headers:', headers);
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Keep this for cookie-based auth
    });
    
    console.log(`[API] Response status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      console.error(`[API] Request failed: ${res.status} ${res.statusText}`);
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`[API] Request error for ${method} ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`[Query] Fetching data for queryKey:`, queryKey[0]);
    
    // Get auth token from localStorage if available
    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    // Prepare headers
    const headers: Record<string, string> = {};
    
    // Add auth header if token is available
    if (authToken) {
      console.log(`[Query] Adding token auth header for user ${userId}`);
      headers['Authorization'] = `Bearer ${authToken}`;
    } else {
      console.log('[Query] No auth token found in localStorage');
    }
    
    try {
      const res = await fetch(queryKey[0] as string, {
        headers,
        credentials: "include",
      });
      
      console.log(`[Query] Response status for ${queryKey[0]}: ${res.status} ${res.statusText}`);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`[Query] Returning null for unauthorized request to ${queryKey[0]}`);
        return null;
      }
      
      if (!res.ok) {
        console.error(`[Query] Request failed for ${queryKey[0]}: ${res.status} ${res.statusText}`);
        try {
          const errorText = await res.text();
          console.error(`[Query] Error response body:`, errorText);
        } catch (e) {
          console.error(`[Query] Could not read error response body`);
        }
      }
      
      await throwIfResNotOk(res);
      const data = await res.json();
      console.log(`[Query] Data received for ${queryKey[0]}:`, data);
      return data;
    } catch (error) {
      console.error(`[Query] Error fetching ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
