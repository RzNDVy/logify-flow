import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface Ctx {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<Ctx | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, toggle: () => setOpen((v) => !v) }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette(): Ctx {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}
