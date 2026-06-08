import React, { createContext, useContext, useRef, useCallback } from 'react';

type RefreshFn = () => void | Promise<void>;

interface RefreshContextType {
  register: (screen: string, fn: RefreshFn) => void;
  unregister: (screen: string) => void;
  refresh: (screen: string) => void;
}

const RefreshContext = createContext<RefreshContextType>({
  register: () => {},
  unregister: () => {},
  refresh: () => {},
});

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const registry = useRef<Record<string, RefreshFn>>({});

  const register = useCallback((screen: string, fn: RefreshFn) => {
    registry.current[screen] = fn;
  }, []);

  const unregister = useCallback((screen: string) => {
    delete registry.current[screen];
  }, []);

  const refresh = useCallback((screen: string) => {
    registry.current[screen]?.();
  }, []);

  return (
    <RefreshContext.Provider value={{ register, unregister, refresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export const useRefreshContext = () => useContext(RefreshContext);
