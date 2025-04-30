import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

export type ProfileType = "business" | "athlete" | "compliance" | "admin" | null;

export function useProfileType() {
  const { user, isLoading: authLoading } = useSupabaseAuth();
  const [profileType, setProfileType] = useState<ProfileType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Don't try to get profile type if auth is still loading or user is not logged in
    if (authLoading || !user) {
      setIsLoading(false);
      return;
    }

    async function getProfileType() {
      try {
        setIsLoading(true);
        setError(null);

        // Approach 1: Try to use the RPC function if it exists
        try {
          console.log("Trying to determine profile type using RPC function");
          const { data: rpcResult, error: rpcError } = await supabase.rpc('get_user_profile_type');
          
          if (!rpcError && rpcResult) {
            console.log("Profile type from RPC:", rpcResult);
            setProfileType(rpcResult as ProfileType);
            setIsLoading(false);
            return;
          } else if (rpcError) {
            console.warn("RPC function failed:", rpcError.message);
            // Continue to fallback approaches
          }
        } catch (rpcErr) {
          console.warn("RPC function not available:", rpcErr);
          // Continue to fallback approaches
        }
        
        // Approach 2: Use metadata from auth session
        console.log("Trying to determine profile type from user metadata");
        const role = user.role;
        
        if (role) {
          console.log("Found role in user:", role);
          
          // For users with role, verify they have the corresponding profile
          if (role === "business") {
            // Check if business profile exists
            const { data: businessProfile, error: businessError } = await supabase
              .from('business_profiles')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
              
            if (businessError) {
              console.warn("Error checking business profile:", businessError.message);
            }
            
            if (businessProfile) {
              console.log("Found business profile for user");
              setProfileType("business");
            } else {
              console.warn("Business user without business profile, attempting to create one");
              // Call the endpoint to create a business profile
              try {
                const response = await fetch('/api/create-business-profile', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ userId: user.id }),
                });
                
                if (response.ok) {
                  console.log("Created business profile successfully");
                  setProfileType("business");
                } else {
                  console.error("Failed to create business profile:", await response.text());
                  setProfileType(null);
                }
              } catch (createErr) {
                console.error("Error creating business profile:", createErr);
                setProfileType(null);
              }
            }
          } 
          else if (role === "athlete") {
            // Check if athlete profile exists
            const { data: athleteProfile, error: athleteError } = await supabase
              .from('athlete_profiles')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
              
            if (athleteError) {
              console.warn("Error checking athlete profile:", athleteError.message);
            }
            
            if (athleteProfile) {
              console.log("Found athlete profile for user");
              setProfileType("athlete");
            } else {
              console.warn("Athlete user without athlete profile");
              setProfileType(null);
            }
          }
          else if (role === "compliance" || role === "admin") {
            // These roles don't require profiles
            console.log(`Setting profile type to ${role} based on role`);
            setProfileType(role as ProfileType);
          }
          else {
            console.warn("Unknown role:", role);
            setProfileType(null);
          }
        } else {
          console.warn("No role found in user metadata");
          setProfileType(null);
        }
        
      } catch (err) {
        console.error("Error determining profile type:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setProfileType(null);
      } finally {
        setIsLoading(false);
      }
    }

    getProfileType();
  }, [user, authLoading]);

  return { profileType, isLoading, error };
}