/**
 * Get the correct API URL based on environment
 * - Development: Returns empty string (uses Vite proxy)
 * - Production: Returns the API URL from environment variable
 */
export const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  return apiUrl || '';
};

/**
 * Constructs an API endpoint URL
 * - Development: Returns relative path for Vite proxy
 * - Production: Returns full URL with API domain
 */
export const getApiEndpoint = (path: string): string => {
  const apiUrl = getApiUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return apiUrl ? `${apiUrl}${normalizedPath}` : normalizedPath;
};
