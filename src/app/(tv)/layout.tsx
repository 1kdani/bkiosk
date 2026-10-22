import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Báthory Kiosk",
};

export default function TvLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // JAVÍTÁS: Levettük az overflow-hidden-t, hogy működjön a belső scroll!
    <div className="w-screen h-screen bg-[#f1f5f9] text-slate-900 select-none overflow-hidden touch-manipulation font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Letisztult, rejtett görgetősáv az egész TV appra */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.7); }
        
        /* Képek húzásának tiltása (TV képernyőn zavaró) */
        img { -webkit-user-drag: none; -khtml-user-drag: none; -moz-user-drag: none; -o-user-drag: none; user-drag: none; }
      `}} />
      {children}
    </div>
  );
}