import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
export default function DropdownMenu({ trigger, children, align = "right" }: { trigger: ReactNode; children: ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false); const root = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); }; const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); }; document.addEventListener("pointerdown", close); document.addEventListener("keydown", key); return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); }; }, []);
  return <div ref={root} className="relative"><button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{trigger}</button><AnimatePresence>{open && <motion.div role="menu" className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full z-40 mt-2 min-w-48 rounded-xl border border-border bg-card p-2 shadow-lg`} initial={{ opacity: 0, y: -4, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: .14 }} onClick={() => setOpen(false)}>{children}</motion.div>}</AnimatePresence></div>;
}
