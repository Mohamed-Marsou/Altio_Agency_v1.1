import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import ProjectListView from "@/components/admin/ProjectListView";

export const metadata: Metadata = { title: "Projects · Altio admin", robots: { index: false, follow: false } };

export default function AdminProjectsPage() {
  return (
    <AdminShell>
      <ProjectListView />
    </AdminShell>
  );
}
