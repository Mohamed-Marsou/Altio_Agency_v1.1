import type { Metadata } from "next";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import AdminShell from "@/components/admin/AdminShell";
import ProjectEditorView from "@/components/admin/ProjectEditorView";

export const metadata: Metadata = { title: "Edit project · Altio admin", robots: ADMIN_ROBOTS };

export default function AdminProjectEditPage() {
  return (
    <AdminShell>
      <ProjectEditorView />
    </AdminShell>
  );
}
