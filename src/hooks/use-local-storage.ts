// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback, useRef } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 1. TRAP THE INITIAL VALUE
  const initialValueRef = useRef<T>(initialValue);

  // 2. Read from the browser's storage safely
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") return initialValueRef.current;
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValueRef.current;

      // Safely parse. If the data is fundamentally broken/null, fallback.
      const parsed = JSON.parse(item);
      return parsed !== null ? (parsed as T) : initialValueRef.current;
    } catch (error) {
      console.warn(`[Storage Warning] Error parsing key “${key}”. Resetting to default.`, error);
      // If parsing fails (corrupted data), wipe it and return the default
      window.localStorage.removeItem(key);
      return initialValueRef.current;
    }
  }, [key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // 3. Write to storage AND broadcast a live signal
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          window.dispatchEvent(new CustomEvent("local-storage-sync", { detail: { key } }));
        }
        return valueToStore;
      });
    } catch (error) {
      console.error(`[Storage Error] Failed setting key “${key}”:`, error);
    }
  }, [key]);

  // 4. Expose a way to completely delete the key (Crucial for resets)
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
        window.dispatchEvent(new CustomEvent("local-storage-sync", { detail: { key } }));
      }
      setStoredValue(initialValueRef.current);
    } catch (error) {
      console.error(`[Storage Error] Failed removing key “${key}”:`, error);
    }
  }, [key]);

  // 5. Listen for the live signal
  useEffect(() => {
    setStoredValue(readValue());

    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ((e as StorageEvent).key === key || (e as CustomEvent).detail?.key === key) {
        setStoredValue(readValue());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage-sync", handleStorageChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage-sync", handleStorageChange as EventListener);
    };
  }, [key, readValue]);

  // Return as a tuple with the new remove function
  return [storedValue, setValue, removeValue] as const;
}
