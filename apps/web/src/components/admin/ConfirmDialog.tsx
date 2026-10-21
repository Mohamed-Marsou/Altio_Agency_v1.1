"use client";

import { useEffect, useRef, type ReactNode } from "react";
import ui from "./ui.module.scss";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** true = red button (delete) */
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// A real <dialog>: the browser traps the keyboard focus inside it, the Escape key
// cancels it and the page behind cannot be used. Used for every "Are you sure?".
export default function ConfirmDialog({ open, title, children, confirmLabel, danger, busy, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className={ui.dialog} onCancel={(event) => { event.preventDefault(); onCancel(); }} aria-labelledby="confirm-title">
      <h2 id="confirm-title">{title}</h2>
      <div>{children}</div>
      <div className={ui.actions}>
        <button type="button" className={ui.btn} onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="button" className={`${ui.btn} ${danger ? ui.btnDanger : ui.btnPrimary}`} onClick={onConfirm} disabled={busy}>
          {busy ? "Please wait…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
