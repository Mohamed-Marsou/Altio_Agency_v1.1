import type { Metadata } from "next";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import AdminShell from "@/components/admin/AdminShell";
import ProjectListView from "@/components/admin/ProjectListView";

export const metadata: Metadata = { title: "Projects · Altio admin", robots: ADMIN_ROBOTS };

export default function AdminProjectsPage() {
  return (
    <AdminShell>
      <ProjectListView />
    </AdminShell>
  );
}
