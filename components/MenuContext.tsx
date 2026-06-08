"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Ctx = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

const MenuCtx = createContext<Ctx | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  // lock body scroll while open + close on Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <MenuCtx.Provider value={{ open, toggle, close }}>
      {children}
    </MenuCtx.Provider>
  );
}

export function useMenu() {
  const c = useContext(MenuCtx);
  if (!c) throw new Error("useMenu must be inside MenuProvider");
  return c;
}
