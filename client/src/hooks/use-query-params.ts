import { useLocation } from "wouter";

/**
 * A custom hook that parses the current URL's query parameters
 * @returns {URLSearchParams} An instance of URLSearchParams
 */
export function useQueryParams(): URLSearchParams {
  const [location] = useLocation();
  return new URLSearchParams(location.includes("?") ? location.substring(location.indexOf("?")) : "");
}