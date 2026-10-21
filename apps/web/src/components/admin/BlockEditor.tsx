"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { BLOCK_LABELS, emptyBlock, sectionId } from "@/lib/admin/helpers";
import type { PostBlockInput } from "@/lib/admin/schemas";
import ui from "./ui.module.scss";

type BlockEditorProps = {
  blocks: PostBlockInput[];
  onChange: (blocks: PostBlockInput[]) => void;
  /** Error messages keyed like "0.text" (index.field), already filtered for this language. */
  errors: Record<string, string>;
  dir: "ltr" | "rtl";
};

// Edits the body of an article as a list of blocks: paragraphs, section titles,
// quotes, tip boxes and picture captions. Add, remove and move blocks. The same
// block types are what the public article page knows how to draw.
export default function BlockEditor({ blocks, onChange, errors, dir }: BlockEditorProps) {
  const [newType, setNewType] = useState<PostBlockInput["type"]>("p");

  const update = (index: number, block: PostBlockInput) => onChange(blocks.map((b, i) => (i === index ? block : b)));
  const remove = (index: number) => onChange(blocks.filter((_, i) => i !== index));
  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= blocks.length) return;
    const copy = [...blocks];
    [copy[index], copy[target]] = [copy[target]!, copy[index]!];
    onChange(copy);
  };

  const err = (index: number, field: string) => errors[`${index}.${field}`];

  return (
    <div className={ui.list}>
      {blocks.map((block, index) => (
        <div key={index} className={ui.block}>
          <div className={ui.blockHead}>
            <select
              aria-label={`Block ${index + 1} type`}
              value={block.type}
              onChange={(event) => update(index, emptyBlock(event.target.value as PostBlockInput["type"], index))}
            >
              {Object.entries(BLOCK_LABELS).map(([type, label]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>
            <span className={ui.spacer} />
            <button type="button" className={`${ui.btn} ${ui.btnSmall}`} onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move block ${index + 1} up`}>
              <ArrowUp size={14} aria-hidden="true" />
            </button>
            <button type="button" className={`${ui.btn} ${ui.btnSmall}`} onClick={() => move(index, 1)} disabled={index === blocks.length - 1} aria-label={`Move block ${index + 1} down`}>
              <ArrowDown size={14} aria-hidden="true" />
            </button>
            <button type="button" className={`${ui.btn} ${ui.btnSmall} ${ui.btnDanger}`} onClick={() => remove(index)} disabled={blocks.length === 1} aria-label={`Delete block ${index + 1}`}>
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>

          {(block.type === "p" || block.type === "quote") && (
            <label className={ui.field}>
              <span className={ui.srOnly}>Text</span>
              <textarea dir={dir} value={block.text} rows={block.type === "p" ? 4 : 2} aria-invalid={Boolean(err(index, "text"))} onChange={(event) => update(index, { ...block, text: event.target.value })} />
              {err(index, "text") && <span className={ui.error}>{err(index, "text")}</span>}
            </label>
          )}

          {block.type === "h2" && (
            <>
              <label className={ui.field}>
                <span>Section title</span>
                <input
                  dir={dir}
                  value={block.text}
                  aria-invalid={Boolean(err(index, "text"))}
                  // The id (used by the table of contents) follows the title until it is edited by hand.
                  onChange={(event) => {
                    const followsTitle = block.id === sectionId(block.text, index);
                    update(index, { ...block, text: event.target.value, id: followsTitle ? sectionId(event.target.value, index) : block.id });
                  }}
                />
                {err(index, "text") && <span className={ui.error}>{err(index, "text")}</span>}
              </label>
              <label className={ui.field}>
                <span>
                  Link id <span className={ui.hint}>(letters, digits, dashes; used by the table of contents)</span>
                </span>
                <input value={block.id} className={ui.mono} aria-invalid={Boolean(err(index, "id"))} onChange={(event) => update(index, { ...block, id: event.target.value })} />
                {err(index, "id") && <span className={ui.error}>{err(index, "id")}</span>}
              </label>
            </>
          )}

          {block.type === "callout" && (
            <>
              <label className={ui.field}>
                <span>Box title</span>
                <input dir={dir} value={block.title} aria-invalid={Boolean(err(index, "title"))} onChange={(event) => update(index, { ...block, title: event.target.value })} />
                {err(index, "title") && <span className={ui.error}>{err(index, "title")}</span>}
              </label>
              <label className={ui.field}>
                <span>
                  Points <span className={ui.hint}>(one per line)</span>
                </span>
                <textarea
                  dir={dir}
                  rows={4}
                  value={block.items.join("\n")}
                  aria-invalid={Boolean(err(index, "items"))}
                  onChange={(event) => update(index, { ...block, items: event.target.value.split("\n") })}
                />
                {err(index, "items") && <span className={ui.error}>{err(index, "items")}</span>}
              </label>
            </>
          )}

          {block.type === "figure" && (
            <label className={ui.field}>
              <span>Caption</span>
              <input dir={dir} value={block.caption} aria-invalid={Boolean(err(index, "caption"))} onChange={(event) => update(index, { ...block, caption: event.target.value })} />
              {err(index, "caption") && <span className={ui.error}>{err(index, "caption")}</span>}
            </label>
          )}
        </div>
      ))}

      <div className={ui.actions}>
        <select aria-label="New block type" value={newType} onChange={(event) => setNewType(event.target.value as PostBlockInput["type"])} className={ui.btn}>
          {Object.entries(BLOCK_LABELS).map(([type, label]) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" className={ui.btn} onClick={() => onChange([...blocks, emptyBlock(newType, blocks.length)])}>
          <Plus size={16} aria-hidden="true" /> Add block
        </button>
      </div>
    </div>
  );
}
