import type { Metadata } from "next";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import AdminShell from "@/components/admin/AdminShell";
import PostEditorView from "@/components/admin/PostEditorView";

export const metadata: Metadata = { title: "Edit post · Altio admin", robots: ADMIN_ROBOTS };

// Which item to edit comes from the address (?slug=...), read in the browser.
export default function AdminPostEditPage() {
  return (
    <AdminShell>
      <PostEditorView />
    </AdminShell>
  );
}
