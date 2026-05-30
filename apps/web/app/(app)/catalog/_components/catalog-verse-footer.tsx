import { guesswhatExceptional } from './catalog-verse-font';
import s from '../page.module.css';

export default function CatalogVerseFooter() {
  return (
    <footer
      className={`${s.verseFooter} ${guesswhatExceptional.variable}`}
      dir="rtl"
      lang="ar"
      aria-label="Hadith narrated by Muslim"
    >
      <p className={s.verseIntro}>قال رسول الله ﷺ :</p>
      <blockquote className={s.verseQuote}>
        إذا مات الإنسان انقطع عمله إلا من ثلاث: صدقة جارية أو علم ينتفع به أو ولد صالح يدعو له
      </blockquote>
      <p className={s.verseAttribution}>رواه مسلم</p>
    </footer>
  );
}
