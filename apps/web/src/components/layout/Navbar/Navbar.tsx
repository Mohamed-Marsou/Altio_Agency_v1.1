import { Menu, Moon } from "lucide-react";
import { getNav, getWhatsAppUrl } from "@/lib/content";
import Logo from "@/components/ui/Logo/Logo";
import MorphButton from "@/components/ui/MorphButton/MorphButton";
import LanguageSwitcher from "./LanguageSwitcher";
import NavLinks from "./NavLinks";
import styles from "./Navbar.module.scss";

type NavbarProps = {
  /** Path of the page being shown, used to highlight the active link. */
  currentPath?: string;
};

// The top bar. It is a SERVER component that assembles smaller parts:
//   Logo | NavLinks (client: sliding underline) | theme button
//        | LanguageSwitcher (client: popup) | MorphButton (CSS) | menu button
// The theme toggle and the mobile menu button do nothing yet.
//
// MOBILE FIRST: on a phone we show  [logo] ........ [moon] [menu]
//               from the lg breakpoint we ALSO show the links, language, CTA.
export default function Navbar({ currentPath = "/" }: NavbarProps) {
  const { links, cta, languages, labels } = getNav();

  return (
    <header className={styles.navbarHeader}>
      <div className={styles.navbarContent}>
        <Logo label={labels.homeLink} />

        {/* Hidden on phones, visible from lg */}
        <nav className={styles.navbarLinksWrapper} aria-label={labels.mainNavigation}>
          <NavLinks links={links} currentPath={currentPath} />
        </nav>

        <div className={styles.navbarActions}>
          <button type="button" className={styles.navbarIconButton} aria-label={labels.toggleTheme}>
            <Moon size={18} aria-hidden="true" />
          </button>

          <div className={styles.navbarLanguageWrapper}>
            <LanguageSwitcher languages={languages} buttonLabel={labels.chooseLanguage} />
          </div>

          <div className={styles.navbarCtaWrapper}>
            <MorphButton
              href={getWhatsAppUrl(cta.message)}
              label={cta.label}
              hoverLabel={cta.hoverLabel}
            />
          </div>

          <button
            type="button"
            className={`${styles.navbarIconButton} ${styles.navbarMenuButton}`}
            aria-label={labels.openMenu}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
