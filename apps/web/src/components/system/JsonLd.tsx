// Puts structured data (JSON-LD) in the page for search engines. It is built by
// us from the shared business data, never from visitor input. The "<" character
// is escaped so the text can never close the <script> tag.
export default function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
