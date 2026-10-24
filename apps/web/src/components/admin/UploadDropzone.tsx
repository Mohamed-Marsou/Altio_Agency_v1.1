"use client";

import { useId, useRef, useState } from "react";
import { ApiError, adminApi, checkUpload } from "@/lib/admin/client";
import { MAX_UPLOAD_BYTES, type MediaEntry } from "@/lib/admin/schemas";
import ui from "./ui.module.scss";

type Item = { id: number; name: string; percent: number; state: "uploading" | "done" | "error"; message?: string };

type UploadDropzoneProps = {
  /** Called once for every picture that was saved (or found already stored). */
  onUploaded: (entry: MediaEntry) => void;
};

// Drag and drop (or tap to choose) one or many pictures. Each file is checked in
// the browser (type and the 8 MB limit), sent with a progress bar, and the server
// converts it to WebP and removes hidden data. Errors are shown per file.
export default function UploadDropzone({ onUploaded }: UploadDropzoneProps) {
  const inputId = useId();
  const counter = useRef(0);
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);

  const patch = (id: number, change: Partial<Item>) => setItems((list) => list.map((item) => (item.id === id ? { ...item, ...change } : item)));

  async function send(files: File[]) {
    for (const file of files) {
      const id = ++counter.current;
      setItems((list) => [{ id, name: file.name, percent: 0, state: "uploading" }, ...list]);
      try {
        checkUpload(file); // type and size, before sending anything
        const entry = await adminApi.media.upload(file, (percent) => patch(id, { percent }));
        patch(id, { percent: 100, state: "done", message: entry.duplicate ? "Already in the library, reused." : "Converted to WebP and saved." });
        onUploaded(entry);
      } catch (error) {
        patch(id, { state: "error", message: error instanceof ApiError ? error.message : "The upload failed." });
      }
    }
  }

  return (
    <div>
      <div
        className={`${ui.drop} ${dragging ? ui.dropOn : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void send([...event.dataTransfer.files]);
        }}
      >
        <strong>Drop pictures here</strong>
        <span>JPEG, PNG, WebP or AVIF, up to {MAX_UPLOAD_BYTES / 1024 / 1024} MB each. They are converted to WebP automatically.</span>
        <label htmlFor={inputId} className={`${ui.btn} ${ui.btnPrimary}`}>
          Choose pictures
        </label>
        <input
          id={inputId}
          className={ui.srOnly}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(event) => {
            void send([...(event.target.files ?? [])]);
            event.target.value = ""; // allows choosing the same file again
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className={ui.list} style={{ marginTop: "0.75rem" }} aria-live="polite">
          {items.slice(0, 6).map((item) => (
            <li key={item.id} className={ui.card}>
              <div className={ui.muted}>
                <strong>{item.name}</strong>
                {item.state === "uploading" && ` · ${item.percent}%`}
                {item.state === "done" && ` · ${item.message}`}
              </div>
              {item.state === "uploading" && (
                <div className={ui.progress} role="progressbar" aria-valuenow={item.percent} aria-valuemin={0} aria-valuemax={100}>
                  <i style={{ width: `${item.percent}%` }} />
                </div>
              )}
              {item.state === "error" && <span className={ui.error}>{item.message}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
