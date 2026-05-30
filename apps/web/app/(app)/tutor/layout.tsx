import HassonaNav from './_components/hassona-nav';

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HassonaNav />
      {children}
    </>
  );
}
