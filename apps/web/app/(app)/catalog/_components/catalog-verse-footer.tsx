import HadithVerseFooter from '../../_components/hadith-verse-footer';

export default function CatalogVerseFooter() {
  return (
    <HadithVerseFooter
      ariaLabel="Hadith narrated by Muslim"
      quoteBefore="إذا مات الإنسان انقطع عمله إلا من ثلاث: صدقة جارية أو "
      highlight="علم ينتفع به"
      quoteAfter=" أو ولد صالح يدعو له"
      attribution="رواه مسلم"
    />
  );
}
