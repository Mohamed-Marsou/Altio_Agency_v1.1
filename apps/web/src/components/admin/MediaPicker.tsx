/* eslint-disable @next/next/no-img-element -- pictures here are local previews of the uploaded WebP files */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, adminApi } from "@/lib/admin/client";
import { pickVariant } from "@/lib/admin/helpers";
import type { MediaEntry } from "@/lib/admin/schemas";
import UploadDropzone from "./UploadDropzone";
import ui from "./ui.module.scss";

type MediaPickerProps = {
  /** Currently chosen picture id, or null */
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  label: string;
};

// "Cover picture": shows the chosen picture and opens a window with the library
// (and an upload box) to choose another one.
export default function MediaPicker({ value, onChange, label }: MediaPickerProps) {
  const dialog = useRef<HTMLDialogElement | null>(null);
  const [items, setItems] = useState<MediaEntry[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setItems(await adminApi.media.list());
      setError("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load the pictures.");
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const current = items.find((m) => m.id === value);
  const thumb = current ? pickVariant(current, 480) : undefined;

  return (
    <div className={ui.field}>
      <span>{label}</span>
      <div className={ui.actions} style={{ alignItems: "center" }}>
        {thumb ? <img src={thumb.path} alt="" className={ui.thumb} /> : <span className={ui.thumb} aria-hidden="true" />}
        <button type="button" className={ui.btn} onClick={() => dialog.current?.showModal()}>
          {current ? "Change picture" : "Choose a picture"}
        </button>
        {value && (
          <button type="button" className={`${ui.btn} ${ui.btnSmall}`} onClick={() => onChange(null)}>
            Remove
          </button>
        )}
      </div>

      <dialog ref={dialog} className={`${ui.dialog} ${ui.dialogWide}`} aria-label={label}>
        <h2>{label}</h2>
        {error && <p className={ui.error}>{error}</p>}
        <UploadDropzone
          onUploaded={(entry) => {
            setItems((list) => (list.some((m) => m.id === entry.id) ? list : [entry, ...list]));
            onChange(entry.id);
            dialog.current?.close();
          }}
        />
        <h3 className={ui.cardTitle} style={{ marginTop: "1rem" }}>
          Library
        </h3>
        {items.length === 0 ? (
          <p className={ui.muted}>No picture yet. Upload one above.</p>
        ) : (
          <div className={ui.mediaGrid}>
            {items.map((media) => {
              const variant = pickVariant(media, 480);
              return (
                <button
                  key={media.id}
                  type="button"
                  className={`${ui.pick} ${media.id === value ? ui.pickOn : ""}`}
                  onClick={() => {
                    onChange(media.id);
                    dialog.current?.close();
                  }}
                >
                  <span className={ui.mediaCard}>
                    {variant && <img src={variant.path} alt={media.alt.en || media.originalName} loading="lazy" />}
                    <span>{media.originalName}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div className={ui.actions} style={{ marginTop: "1rem" }}>
          <button type="button" className={ui.btn} onClick={() => dialog.current?.close()}>
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}
