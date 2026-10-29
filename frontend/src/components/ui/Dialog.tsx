import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

export default function Dialog({ open, onClose, title, children, className = "", compactTitle = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string; compactTitle?: boolean }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>("button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])")].filter((el) => !el.hasAttribute("disabled"));
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, [open, onClose]);
  return createPortal(<AnimatePresence>{open && <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-2 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><motion.div ref={panel} role="dialog" aria-modal="true" aria-label={title} className={`w-full max-w-lg rounded-xl border border-border bg-card p-4 shadow-xl sm:p-5 ${className}`} initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 4 }} transition={{ duration: 0.16 }}><h2 className={`${compactTitle ? "mb-2" : "mb-4"} text-lg font-semibold text-ink`}>{title}</h2>{children}</motion.div></motion.div>}</AnimatePresence>, document.body);
}
