import { guesswhatExceptional } from './hadith-verse-font';
import s from './hadith-verse-footer.module.css';

type HadithVerseFooterProps = {
  ariaLabel: string;
  quoteBefore: string;
  highlight: string;
  quoteAfter: string;
  attribution: string;
};

export default function HadithVerseFooter({
  ariaLabel,
  quoteBefore,
  highlight,
  quoteAfter,
  attribution,
}: HadithVerseFooterProps) {
  return (
    <footer
      className={`${s.verseFooter} ${guesswhatExceptional.variable}`}
      dir="rtl"
      lang="ar"
      aria-label={ariaLabel}
    >
      <p className={s.verseIntro}>قال رسول الله ﷺ :</p>
      <blockquote className={s.verseQuote}>
        &ldquo;{quoteBefore}
        <span className={s.verseHighlight}>{highlight}</span>
        {quoteAfter}&rdquo;
      </blockquote>
      <p className={s.verseAttribution}>{attribution}</p>
    </footer>
  );
}
