import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import AuditView from "@/components/admin/AuditView";

export const metadata: Metadata = {
  title: "Audit log · Altio admin",
  robots: { index: false, follow: false },
};

export default function AuditPage() {
  return (
    <AdminShell>
      <AuditView />
    </AdminShell>
  );
}
