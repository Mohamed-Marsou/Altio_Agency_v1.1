import { getNav, getWhatsAppUrl } from "@/lib/content";
import Logo from "@/components/ui/Logo/Logo";
import MorphButton from "@/components/ui/MorphButton/MorphButton";
import ThemeToggle from "@/components/ui/ThemeToggle/ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import NavLinks from "./NavLinks";
import styles from "./Navbar.module.scss";

type NavbarProps = {
  /** Path of the page being shown, used to highlight the active link. */
  currentPath?: string;
};

// The top bar. It is a SERVER component that assembles smaller parts:
//   Logo | NavLinks (client: sliding underline) | theme button
//        | LanguageSwitcher (client: popup) | MorphButton (CSS) | menu button
// The theme toggle works (light/dark, saved in localStorage) and so does the
// mobile menu (MobileMenu).
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
          <ThemeToggle label={labels.toggleTheme} />

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

          {/* Phones and tablets: the hamburger + full-screen menu (client component) */}
          <MobileMenu
            links={links}
            currentPath={currentPath}
            languages={languages}
            ctaHref={getWhatsAppUrl(cta.message)}
            ctaLabel={cta.label}
            ctaHoverLabel={cta.hoverLabel}
            openLabel={labels.openMenu}
            closeLabel={labels.closeMenu}
            title={labels.menuTitle}
          />
        </div>
      </div>
    </header>
  );
}
