import { redirect } from "next/navigation";

// /cookies/ has no page of its own: the cookie information lives in the Privacy
// page. With the static export this builds a small page that redirects the
// visitor to /privacy/#cookies (the footer link keeps working).
export default function CookiesPage() {
  redirect("/privacy/#cookies");
}
