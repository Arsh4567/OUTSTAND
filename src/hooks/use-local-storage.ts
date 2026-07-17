import { useState, useEffect, useCallback, useRef } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 1. TRAP THE INITIAL VALUE: This prevents the infinite loop if arrays/objects are passed
  const initialValueRef = useRef<T>(initialValue);

  // 2. Read from the browser's storage
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") return initialValueRef.current;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValueRef.current;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValueRef.current;
    }
  }, [key]); // We removed initialValue from here!

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 3. Write to storage AND broadcast a live signal to the rest of the app
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        
        // Broadcast custom event for other components
        window.dispatchEvent(new CustomEvent("local-storage-sync", { detail: { key } }));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  // 4. Listen for the live signal
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
