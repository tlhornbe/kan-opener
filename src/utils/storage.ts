export const storage = {
    getItem: async <T>(key: string, defaultValue: T): Promise<T> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            try {
                const result = await chrome.storage.sync.get([key]);
                return result[key] !== undefined ? (result[key] as T) : defaultValue;
            } catch (error) {
                console.warn(`Error reading ${key} from chrome.storage.sync:`, error);
                return defaultValue;
            }
        } else {
            try {
                const value = localStorage.getItem(key);
                return value ? (JSON.parse(value) as T) : defaultValue;
            } catch (error) {
                console.warn(`Error reading ${key} from localStorage:`, error);
                return defaultValue;
            }
        }
    },

    setItem: async <T>(key: string, value: T): Promise<void> => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            try {
                await chrome.storage.sync.set({ [key]: value });
            } catch (error: any) {
                if (error.message?.includes('QUOTA_BYTES')) {
                    console.warn('Storage quota exceeded!');
                    // In a real app, we might trigger a toast or user notification here
                }
                console.error(`Error setting ${key} in chrome.storage.sync:`, error);
                throw error; // Re-throw to let caller handle if needed, or suppress
            }
        } else {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error(`Error setting ${key} in localStorage:`, error);
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
