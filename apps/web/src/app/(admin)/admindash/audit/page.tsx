import type { Metadata } from "next";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import AdminShell from "@/components/admin/AdminShell";
import AuditView from "@/components/admin/AuditView";

export const metadata: Metadata = {
  title: "Audit log · Altio admin",
  robots: ADMIN_ROBOTS,
};

export default function AuditPage() {
  return (
    <AdminShell>
      <AuditView />
    </AdminShell>
  );
}
