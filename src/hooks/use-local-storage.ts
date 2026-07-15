import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 1. Read from the browser's storage
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 2. Write to storage AND broadcast a live signal to the rest of the app
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        
        // THIS IS THE MAGIC LINE! It tells the Header to update instantly without refreshing.
        window.dispatchEvent(new CustomEvent("local-storage-sync", { detail: { key } }));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  // 3. Listen for the live signal
  useEffect(() => {
    setStoredValue(readValue());

    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      // If the event matches our key, update the state instantly
      if ((e as StorageEvent).key === key || (e as CustomEvent).detail?.key === key) {
        setStoredValue(readValue());
      }
    };

    // Listen to standard storage events (if you have multiple tabs open)
    window.addEventListener("storage", handleStorageChange);
    // Listen to our custom magic event (for instant same-tab updates)
    window.addEventListener("local-storage-sync", handleStorageChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage-sync", handleStorageChange as EventListener);
    };
  }, [key, readValue]);

  return [storedValue, setValue] as const;
}
