import { useState, useEffect } from 'react';

export function useQueryParams(): URLSearchParams {
  const [searchParams, setSearchParams] = useState<URLSearchParams>(
    new URLSearchParams(window.location.search)
  );

  useEffect(() => {
    // Update search params when the URL changes
    const handleUrlChange = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };

    // Listen for URL changes
    window.addEventListener('popstate', handleUrlChange);

    // Clean up event listener
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  return searchParams;
}