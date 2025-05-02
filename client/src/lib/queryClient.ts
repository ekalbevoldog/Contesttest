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
  // Always include the Authorization header with the Supabase JWT token if available
  let headers: Record<string, string> = {};
  
  // Add Content-Type for requests with data
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Try to get the session token from Supabase
  try {
    // Dynamically import supabase to avoid circular dependencies
    const { supabase } = await import('./supabase-client');
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData?.session?.access_token) {
      headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
    } else {
      console.warn('[queryClient] No access token available for request to', url);
      
      // Try to get token from localStorage as fallback
      try {
        const storedAuth = localStorage.getItem('supabase-auth');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData.access_token) {
            headers["Authorization"] = `Bearer ${authData.access_token}`;
            console.log('[queryClient] Using token from localStorage');
          }
        }
      } catch (localStorageError) {
        console.error('[queryClient] Error accessing localStorage:', localStorageError);
      }
    }
  } catch (error) {
    console.error('[queryClient] Error getting auth session:', error);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Create headers object and include Authorization if available
    let headers: Record<string, string> = {};
    
    // Try to get the session token from Supabase
    try {
      // Dynamically import supabase to avoid circular dependencies
      const { supabase } = await import('./supabase-client');
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session?.access_token) {
        headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
      } else {
        // Try to get token from localStorage as fallback
        try {
          const storedAuth = localStorage.getItem('supabase-auth');
          if (storedAuth) {
            const authData = JSON.parse(storedAuth);
            if (authData.access_token) {
              headers["Authorization"] = `Bearer ${authData.access_token}`;
            }
          }
        } catch (localStorageError) {
          console.error('[queryClient] Error accessing localStorage:', localStorageError);
        }
      }
    } catch (error) {
      console.error('[queryClient] Error getting auth session:', error);
    }
    
    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
