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
  data?: unknown,
): Promise<Response> {
  console.log(
    `[queryClient] Making ${method} request to ${url}`,
    data ? 'with data' : 'without data'
  );

  // Prepare headers
  let headers: Record<string, string> = {};

  // Add Content-Type header for requests with data
  if (data) {
    headers["Content-Type"] = "application/json";
    console.log(
      '[queryClient] Request has data, adding Content-Type header'
    );
    if (typeof data === 'object') {
      console.log('[queryClient] Request data:', JSON.stringify(data));
    }
  }

  // ── PUBLIC ENDPOINTS WHITELIST ─────────────────────────────────
  const PUBLIC_ENDPOINTS = [
    '/api/session/new',
    '/api/auth/register',
    '/api/auth/login',
  ];
  const isPublic = PUBLIC_ENDPOINTS.some(ep => url.startsWith(ep));

  if (isPublic) {
    console.log(
      `[queryClient] Skipping auth header for public endpoint ${url}`
    );
  } else {
    // Include the Authorization header with the Supabase JWT token if available
    try {
      console.log('[queryClient] Importing supabase-client...');
      const { supabase } = await import('./supabase-client');
      console.log('[queryClient] Getting session from Supabase...');
      const { data: sessionData } = await supabase.auth.getSession();
      console.log(
        '[queryClient] Session data received:',
        sessionData?.session ? 'yes' : 'no'
      );

      if (sessionData?.session?.access_token) {
        headers["Authorization"] =
          `Bearer ${sessionData.session.access_token}`;
        console.log(
          '[queryClient] Added Authorization header with Supabase session token'
        );
      } else {
        console.warn(
          '[queryClient] No access token available from Supabase session for request to',
          url
        );

        // Fallback: try localStorage then cookies
        try {
          console.log('[queryClient] Trying to get token from localStorage...');
          let storedAuth = localStorage.getItem('contested-auth');
          if (!storedAuth) {
            console.log(
              '[queryClient] No token in contested-auth, trying supabase-auth...'
            );
            storedAuth = localStorage.getItem('supabase-auth');
          }
          if (storedAuth) {
            console.log('[queryClient] Token found in localStorage, parsing...');
            const authData = JSON.parse(storedAuth);
            if (authData.access_token) {
              headers["Authorization"] = `Bearer ${authData.access_token}`;
              console.log(
                '[queryClient] Using token from localStorage'
              );
            }
          } else {
            console.log('[queryClient] No auth token found in localStorage');
            console.log('[queryClient] Checking document.cookie for token...');
            if (document.cookie.includes('sb-auth-token=')) {
              console.log(
                '[queryClient] Found sb-auth-token in cookies, extracting it...'
              );
              const cookieValue = document.cookie
                .split('; ')
                .find(row => row.startsWith('sb-auth-token='))
                ?.split('=')[1];
              if (cookieValue) {
                try {
                  const cookieData = JSON.parse(
                    decodeURIComponent(cookieValue)
                  );
                  if (cookieData.access_token) {
                    headers["Authorization"] =
                      `Bearer ${cookieData.access_token}`;
                    console.log(
                      '[queryClient] Using token from cookie'
                    );
                  }
                } catch (cookieError) {
                  console.error(
                    '[queryClient] Error parsing cookie token:',
                    cookieError
                  );
                }
              }
            } else {
              console.log(
                '[queryClient] No token found in cookies either'
              );
            }
          }
        } catch (localStorageError) {
          console.error(
            '[queryClient] Error accessing localStorage:',
            localStorageError
          );
        }
      }
    } catch (error) {
      console.error('[queryClient] Error getting auth session:', error);
    }
  }
  // ── END WHITELIST LOGIC ─────────────────────────────────────────

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
      const { supabase } = await import('./supabase-client');
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData?.session?.access_token) {
        headers["Authorization"] =
          `Bearer ${sessionData.session.access_token}`;
      } else {
        // Fallback logic (similar to apiRequest)
        try {
          let storedAuth = localStorage.getItem('contested-auth') ||
            localStorage.getItem('supabase-auth');
          if (storedAuth) {
            const authData = JSON.parse(storedAuth);
            if (authData.access_token) {
              headers["Authorization"] =
                `Bearer ${authData.access_token}`;
              console.log(
                '[queryClient] Using token from localStorage for GET request'
              );
            }
          } else {
            console.log(
              '[queryClient] No auth token found in localStorage for GET request'
            );
          }
        } catch (localStorageError) {
          console.error(
            '[queryClient] Error accessing localStorage:',
            localStorageError
          );
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
