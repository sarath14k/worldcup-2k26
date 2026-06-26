/**
 * Fetch helper with automatic retries and exponential backoff.
 * 
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options (supports custom timeout field)
 * @param {number} retries - Number of retries before failing
 * @param {number} backoffMs - Base delay in milliseconds for backoff
 */
export async function fetchWithRetry(url, options = {}, retries = 3, backoffMs = 1000) {
  const timeout = options.timeout || 15000;
  
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Copy options and clean custom fields
    const fetchOptions = { ...options };
    delete fetchOptions.timeout;
    fetchOptions.signal = controller.signal;
    
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      throw new Error(`HTTP status ${response.status}`);
    } catch (err) {
      clearTimeout(timeoutId);
      
      if (i === retries - 1) {
        throw err;
      }
      
      const delay = backoffMs * Math.pow(2, i);
      console.warn(`[Fetch Retry] Failed fetching ${url} (attempt ${i + 1}/${retries}). Retrying in ${delay}ms... Error: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
