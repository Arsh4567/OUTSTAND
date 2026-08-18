// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback, useRef } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef<T>(initialValue);

  const readValue = useCallback((): T => {
    if (typeof window === "undefined") return initialValueRef.current;
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValueRef.current;
      const parsed = JSON.parse(item);
      return parsed !== null ? (parsed as T) : initialValueRef.current;
    } catch (error) {
      // Keep the raw value intact so a future migration/recovery can inspect it.
      // Returning the safe default prevents corrupted storage from crashing the app.
      console.warn(`[Storage Warning] Could not parse key “${key}”. Using the default value.`, error);
      return initialValueRef.current;
    }
  }, [key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

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

  useEffect(() => {
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

  return [storedValue, setValue, removeValue] as const;
}
