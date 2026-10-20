import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import styles from "./ServiceArt.module.scss";

type ArtKind = "site" | "store" | "app" | "managed";

// The small illustrations of the four services. They are decorative (the
// text next to them says everything), so the whole thing is aria-hidden. The
// strings inside are sample content of the drawings, not site copy.

// A browser window with an address bar.
function Window({ url, children }: { url?: string; children: ReactNode }) {
  return (
    <div className={styles.serviceArtWindow}>
      {url && (
        <div className={styles.serviceArtWindowBar}>
          <i />
          <i />
          <i />
          <span>{url}</span>
        </div>
      )}
      <div className={styles.serviceArtWindowBody}>{children}</div>
    </div>
  );
}

// A small card floating over the picture. `delay` staggers the pop-in.
function Float({
  title,
  text,
  corner,
  good = false,
  delay,
}: {
  title: string;
  text: string;
  corner: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  good?: boolean;
  delay: number;
}) {
  return (
    <span
      className={clsx(
        styles.serviceArtFloat,
        styles[`serviceArtFloat${corner[0].toUpperCase()}${corner.slice(1)}`],
        good && styles.serviceArtFloatIsGood,
      )}
      style={{ "--delay": `${delay}s` } as CSSProperties}
    >
      <b>{title}</b>
      {text}
    </span>
  );
}

// A score ring. pathLength={100} means the circle is "100 long", so a value of
// 96 fills 96% of it (the animation moves the dash from empty to 100 - value).
function Ring({ value, label, delay }: { value: number; label: string; delay: number }) {
  return (
    <span className={styles.serviceArtScore}>
      <svg viewBox="0 0 36 36">
        <circle className={styles.serviceArtRingTrack} cx="18" cy="18" r="15" />
        <circle
          className={styles.serviceArtRingValue}
          cx="18"
          cy="18"
          r="15"
          pathLength={100}
          style={{ "--value": value, "--delay": `${delay}s` } as CSSProperties}
        />
        <text x="18" y="22" textAnchor="middle">
          {value}
        </text>
      </svg>
      {label}
    </span>
  );
}

function SiteArt() {
  return (
    <>
      <Window url="yourbusiness.ma">
        <span className={clsx(styles.serviceArtLine, styles.serviceArtLineStrong)} />
        <span className={styles.serviceArtLine} style={{ width: "90%" }} />
        <span className={styles.serviceArtLine} style={{ width: "60%" }} />
        <span className={styles.serviceArtPill} />
        <div className={styles.serviceArtScores}>
          <Ring value={96} label="Speed" delay={0.1} />
          <Ring value={94} label="SEO" delay={0.25} />
          <Ring value={97} label="Access" delay={0.4} />
        </div>
      </Window>
      <Float title="5 pages" text="Home, About, Services, Work, Contact" corner="topLeft" delay={0.5} />
      <Float title="WhatsApp" text="New enquiry just now" corner="bottomRight" good delay={0.9} />
    </>
  );
}

function StoreArt() {
  const products = [
    { name: "Linen shirt", stock: "In stock", tone: "a" },
    { name: "Denim jacket", stock: "In stock", tone: "b" },
    { name: "Canvas bag", stock: "2 left", tone: "c" },
  ];
  return (
    <>
      <Window url="yourshop.ma">
        <div className={styles.serviceArtProducts}>
          {products.map((product, index) => (
            <span
              key={product.name}
              className={styles.serviceArtProduct}
              style={{ "--delay": `${0.1 + index * 0.15}s` } as CSSProperties}
            >
              <i className={clsx(styles.serviceArtProductImage, styles[`serviceArtProductImage_${product.tone}`])} />
              <b>{product.name}</b>
              {product.stock}
            </span>
          ))}
        </div>
        <span className={styles.serviceArtCart}>
          Cart · 2 items
          <b>Checkout</b>
        </span>
      </Window>
      <Float title="Products" text="Add, price, restock in clicks" corner="topLeft" delay={0.5} />
      <Float title="New order #1042" text="Ready to prepare" corner="bottomRight" good delay={0.9} />
    </>
  );
}

function AppArt() {
  const rows = [
    { text: "Table for 4, 20:00", tag: "Confirmed", good: true },
    { text: "Consultation, 11:30", tag: "Pending", good: false },
    { text: "Delivery #88", tag: "Confirmed", good: true },
  ];
  return (
    <>
      <Window>
        <div className={styles.serviceArtDash}>
          <span className={styles.serviceArtSide}>
            <i />
            <i />
            <i />
            <i />
          </span>
          <div className={styles.serviceArtDashMain}>
            <div className={styles.serviceArtKpis}>
              <span>
                Bookings<b>128</b>
              </span>
              <span>
                Clients<b>342</b>
              </span>
              <span>
                Unpaid<b>5</b>
              </span>
            </div>
            {rows.map((row, index) => (
              <span
                key={row.text}
                className={styles.serviceArtRow}
                style={{ "--delay": `${0.2 + index * 0.18}s` } as CSSProperties}
              >
                {row.text}
                <em className={clsx(styles.serviceArtTag, row.good && styles.serviceArtTagIsGood)}>{row.tag}</em>
              </span>
            ))}
          </div>
        </div>
      </Window>
      <Float title="Integrations" text="WhatsApp, payments, email" corner="topRight" good delay={0.5} />
      <Float title="Admin panel" text="Add, edit, export in clicks" corner="bottomLeft" delay={0.9} />
    </>
  );
}

function ManagedArt() {
  const checks = [
    { name: "Hosting", tag: "Healthy", good: true },
    { name: "Security updates", tag: "Up to date", good: true },
    { name: "Backups", tag: "Last night", good: true },
    { name: "This month’s improvement", tag: "In progress", good: false },
  ];
  return (
    <>
      <Window>
        <span className={styles.serviceArtHealth}>
          <i className={styles.serviceArtHealthDot} />
          <b>All systems running</b>
          <em>Uptime 99.9%</em>
        </span>
        <div className={styles.serviceArtChecks}>
          {checks.map((check, index) => (
            <span
              key={check.name}
              className={styles.serviceArtRow}
              style={{ "--delay": `${0.2 + index * 0.18}s` } as CSSProperties}
            >
              {check.name}
              <em className={clsx(styles.serviceArtTag, check.good && styles.serviceArtTagIsGood)}>{check.tag}</em>
            </span>
          ))}
        </div>
      </Window>
      <Float title="Monthly report" text="What changed and what is next" corner="topLeft" delay={0.5} />
      <Float title="Priority support" text="Replied in 6 minutes" corner="bottomRight" good delay={0.9} />
    </>
  );
}

export default function ServiceArt({ kind }: { kind: ArtKind }) {
  return (
    <div className={styles.serviceArt} aria-hidden="true">
      {kind === "site" && <SiteArt />}
      {kind === "store" && <StoreArt />}
      {kind === "app" && <AppArt />}
      {kind === "managed" && <ManagedArt />}
    </div>
  );
}
