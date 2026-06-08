import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.col}>
          <Link href="/" className={styles.wordmark}>
            javierpato
          </Link>
          <p className={styles.claim}>
            Diseño que sabe quedarse callado.
          </p>
        </div>

        <div className={styles.col}>
          <span className={styles.label}>Sitio</span>
          <ul className={styles.list}>
            <li><Link href="/work">Work</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/lab">Lab</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <span className={styles.label}>Contacto</span>
          <a href="mailto:hola@javierpato.es" className={styles.email}>
            hola@javierpato.es
          </a>
          <ul className={styles.list}>
            <li><a href="https://instagram.com/javierpato" target="_blank" rel="noreferrer">Instagram</a></li>
            <li><a href="https://linkedin.com/in/javierpato" target="_blank" rel="noreferrer">LinkedIn</a></li>
            <li><a href="https://are.na/javier-pato" target="_blank" rel="noreferrer">Are.na</a></li>
          </ul>
        </div>
      </div>

      <div className={styles.legal}>
        <span>© 2026 Javier Pato</span>
        <span>Built with care</span>
        <span className={styles.lang}>ES &middot; EN</span>
      </div>
    </footer>
  );
}
