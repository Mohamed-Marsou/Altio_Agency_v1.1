import type { Metadata } from "next";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import AdminShell from "@/components/admin/AdminShell";
import UserFormView from "@/components/admin/UserFormView";

export const metadata: Metadata = { title: "Edit admin · Altio admin", robots: ADMIN_ROBOTS };

export default function AdminUserEditPage() {
  return (
    <AdminShell>
      <UserFormView />
    </AdminShell>
  );
}
