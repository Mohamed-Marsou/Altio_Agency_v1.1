import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import ProjectEditorView from "@/components/admin/ProjectEditorView";

export const metadata: Metadata = { title: "Edit project · Altio admin", robots: { index: false, follow: false } };

export default function AdminProjectEditPage() {
  return (
    <AdminShell>
      <ProjectEditorView />
    </AdminShell>
  );
}
