import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import PostEditorView from "@/components/admin/PostEditorView";

export const metadata: Metadata = { title: "Edit post · Altio admin", robots: { index: false, follow: false } };

// Which item to edit comes from the address (?slug=...), read in the browser.
export default function AdminPostEditPage() {
  return (
    <AdminShell>
      <PostEditorView />
    </AdminShell>
  );
}
