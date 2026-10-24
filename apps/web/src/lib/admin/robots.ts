import type { Metadata } from "next";

// What every admin page tells search engines: do not list it, do not follow its links,
// do not keep a copy, do not show a text snippet, do not index its pictures.
// (robots.txt, the page header sent by .htaccess and the fact that the admin pages are not
// uploaded to the live site are three more layers.)
export const ADMIN_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  noarchive: true,
  nosnippet: true,
  noimageindex: true,
  nocache: true,
};
