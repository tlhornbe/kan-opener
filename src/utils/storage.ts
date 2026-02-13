const MAX_RETRIES = 3;
const RETRY_DELAY = 300; // milliseconds

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const storage = {
    getItem: async <T>(key: string, defaultValue: T): Promise<T> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            // Retry logic for chrome.storage.sync
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const result = await chrome.storage.sync.get([key]);
                    const value = result[key] !== undefined ? (result[key] as T) : defaultValue;
                    
                    if (attempt > 1) {
                        console.log(`[Storage] Successfully read ${key} on attempt ${attempt}`);
                    }
                    
                    return value;
                } catch (error) {
                    console.warn(`[Storage] Attempt ${attempt}/${MAX_RETRIES} failed reading ${key}:`, error);
                    
                    if (attempt < MAX_RETRIES) {
                        await delay(RETRY_DELAY * attempt); // Exponential backoff
                    }
                }
            }
            
            // All retries failed, try localStorage as fallback
            console.error(`[Storage] All retries failed for chrome.storage.sync, falling back to localStorage`);
            try {
                const value = localStorage.getItem(key);
                return value ? (JSON.parse(value) as T) : defaultValue;
            } catch (fallbackError) {
                console.error(`[Storage] localStorage fallback also failed:`, fallbackError);
                return defaultValue;
            }
        } else {
            try {
                const value = localStorage.getItem(key);
                return value ? (JSON.parse(value) as T) : defaultValue;
            } catch (error) {
                console.warn(`[Storage] Error reading ${key} from localStorage:`, error);
                return defaultValue;
            }
        }
    },

    setItem: async <T>(key: string, value: T): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            try {
                // Check quota before writing (chrome.storage.sync limit: 102,400 bytes)
                const bytesInUse = await chrome.storage.sync.getBytesInUse(key);
                const estimatedSize = new Blob([JSON.stringify(value)]).size;
                
                if (estimatedSize > 8192) {
                    console.warn(`[Storage] Warning: Item ${key} is ${estimatedSize} bytes (max per item: 8,192)`);
                }
                
                if (bytesInUse + estimatedSize > 102400) {
                    console.error(`[Storage] Quota warning: Total usage would be ${bytesInUse + estimatedSize} bytes (max: 102,400)`);
                }
                
                await chrome.storage.sync.set({ [key]: value });
            } catch (error) {
                const err = error as Error & { message?: string };
                if (err.message?.includes('QUOTA_BYTES') || err.message?.includes('quota')) {
                    console.error('[Storage] Storage quota exceeded! Consider reducing data size.');
                    // Try localStorage as fallback
                    try {
                        localStorage.setItem(key, JSON.stringify(value));
                        console.log('[Storage] Fell back to localStorage due to quota exceeded');
                    } catch (localError) {
                        console.error('[Storage] localStorage fallback also failed:', localError);
                    }
                } else {
                    console.error(`[Storage] Error setting ${key} in chrome.storage.sync:`, error);
                }
                throw error; // Re-throw so zustand knows about the error
            }
        } else {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                const err = error as Error & { name?: string };
                if (err.name === 'QuotaExceededError') {
                    console.error('[Storage] localStorage quota exceeded!');
                }
                console.error(`[Storage] Error setting ${key} in localStorage:`, error);
                throw error;
            }
        }
    },

    removeItem: async (key: string): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            await chrome.storage.sync.remove(key);
        } else {
            localStorage.removeItem(key);
        }
    }
};
