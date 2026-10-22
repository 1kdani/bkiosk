"use client";

import { useState, useEffect } from "react";
import { BellRing, Loader2, Clock } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface BellClass { id: string; period: string; time: string; breakText: string; }

export default function BellsPanel() {
  const [bells, setBells] = useState<BellClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBells = async () => {
      const bellSnap = await getDoc(doc(db, "settings", "bells"));
      if (bellSnap.exists() && bellSnap.data().schedule) setBells(bellSnap.data().schedule);
      setLoading(false);
    };
    fetchBells();
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-purple-500" /></div>;

  return (
    <div className="w-full h-full p-8 relative flex flex-col">
      
      {/* Fejléc */}
      <div className="flex items-center gap-6 bg-purple-500/10 p-6 rounded-[2rem] mb-8 border border-purple-500/20 shrink-0 z-10">
        <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center shadow-inner">
          <BellRing className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h4 className="text-3xl font-black text-purple-400 tracking-tight">Csengetési Rend</h4>
          <p className="text-purple-500/60 font-bold uppercase tracking-widest text-sm mt-1">Tanórák és szünetek beosztása</p>
        </div>
      </div>

      {/* Görgethető Táblázat Konténer */}
      <div className="flex-1 bg-[#121212] rounded-[2rem] shadow-xl border border-white/5 overflow-auto custom-scrollbar relative z-10 w-full h-full">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="bg-[#1a1a1a] sticky top-0 z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">
            <tr>
              <th className="p-8 border-b border-white/5 text-white/40 font-bold uppercase tracking-[0.2em] text-sm w-40 text-center">Tanóra</th>
              <th className="p-8 border-b border-white/5 text-white font-black text-2xl tracking-tight">Időtartam</th>
              <th className="p-8 border-b border-white/5 text-white/40 font-bold uppercase tracking-[0.2em] text-sm text-right">Szünet</th>
            </tr>
          </thead>
          <tbody>
            {bells.map((bell) => (
              <tr key={bell.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0 group">
                <td className="p-8 text-center">
                  <div className="p-10 w-14 h-14 mx-auto bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center text-2xl font-black text-white group-hover:bg-purple-500/20 group-hover:border-purple-500/40 group-hover:text-purple-400 transition-all shadow-inner">
                    {bell.period.replace('.', '')}
                  </div>
                </td>
                <td className="p-8">
                  <div className="flex items-center gap-5">
                    <Clock className="w-7 h-7 text-white/20 group-hover:text-purple-400 transition-colors" />
                    <span className="text-4xl font-light text-white tracking-tighter drop-shadow-md">{bell.time}</span>
                  </div>
                </td>
                <td className="p-8 text-right">
                  {bell.breakText && bell.breakText !== "-" && (
                    <span className="inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                      {bell.breakText} szünet
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}