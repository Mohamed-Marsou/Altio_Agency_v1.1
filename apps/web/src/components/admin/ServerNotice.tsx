import { getApiBase } from "@/lib/admin/client";
import ui from "./ui.module.scss";

// Shown when the dashboard cannot reach the admin server.
export default function ServerNotice({ message }: { message?: string }) {
  const hasBase = getApiBase() !== null;
  return (
    <div className={`${ui.notice} ${ui.noticeWarn}`} role="status">
      <strong>The admin server is not connected.</strong>
      <p>
        {hasBase
          ? message ?? "Start the site with npm run dev (it also starts the admin server), then reload this page."
          : "Editing only works while developing (npm run dev). On the live static site this page is read only until the backend exists."}
      </p>
    </div>
  );
}
