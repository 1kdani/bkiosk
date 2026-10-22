"use client";

import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Newspaper, MonitorPlay, Users, Zap } from "lucide-react";

export default function AdminPage() {
  const { userName } = useStore();
  const [stats, setStats] = useState({ news: 0, timetable: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const newsSnap = await getCountFromServer(collection(db, "news"));
        const timetableSnap = await getCountFromServer(collection(db, "timetables"));
        const usersSnap = await getCountFromServer(collection(db, "users"));
        
        setStats({
          news: newsSnap.data().count,
          timetable: timetableSnap.data().count,
          users: usersSnap.data().count,
        });
      } catch (error) {
        console.error("Hiba a statisztikák lekérésekor", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="w-full space-y-8 md:space-y-12 pb-10">
      <div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">Üdvözlünk, {userName || "Kolléga"}! 👋</h1>
        <p className="text-lg text-white/50 mt-3 font-medium">Itt kezelheted a portán lévő Kiosk TV összes tartalmát.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="bg-[#121212] p-8 rounded-[2rem] shadow-xl border border-white/5 flex items-center gap-6 hover:border-blue-500/30 transition-colors">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center shrink-0"><Newspaper className="w-8 h-8 text-blue-400"/></div>
          <div><p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Aktív Hírek</p><p className="text-4xl font-black text-white">{loading ? "..." : stats.news}</p></div>
        </div>
        <div className="bg-[#121212] p-8 rounded-[2rem] shadow-xl border border-white/5 flex items-center gap-6 hover:border-emerald-500/30 transition-colors">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0"><MonitorPlay className="w-8 h-8 text-emerald-400"/></div>
          <div><p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Órarend Osztályok</p><p className="text-4xl font-black text-white">{loading ? "..." : stats.timetable}</p></div>
        </div>
        <div className="bg-[#121212] p-8 rounded-[2rem] shadow-xl border border-white/5 flex items-center gap-6 hover:border-purple-500/30 transition-colors">
          <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center shrink-0"><Users className="w-8 h-8 text-purple-400"/></div>
          <div><p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Adminok</p><p className="text-4xl font-black text-white">{loading ? "..." : stats.users}</p></div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-blue-500/20">
        <Zap className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 rotate-12" />
        <h2 className="text-2xl md:text-3xl font-black mb-8 flex items-center gap-4 tracking-tight">
          <span className="bg-white/10 p-3 rounded-2xl border border-white/10">🚀</span> Gyorstalpaló a rendszerhez
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="bg-[#050505]/40 p-6 rounded-3xl border border-white/5">
            <h3 className="font-black text-blue-300 text-xl mb-3 tracking-wide">Hírek közzététele</h3>
            <p className="text-white/60 leading-relaxed font-medium">A Hírek menüpontban Word-szerűen formázhatod a szövegeket. Egy hír állhat csak egyetlen képből is. Kérlek figyelj arra, hogy a TV-n a nagyon hosszú szövegek nehezen olvashatók, próbálj lényegretörő lenni!</p>
          </div>
          <div className="bg-[#050505]/40 p-6 rounded-3xl border border-white/5">
            <h3 className="font-black text-emerald-300 text-xl mb-3 tracking-wide">Színek és Sablonok</h3>
            <p className="text-white/60 leading-relaxed font-medium">Minden hírhez egyedi háttérszínt és elrendezési sablont adhatsz meg. A TV kijelzője intelligensen felveszi a hírhez beállított színt és formátumot.</p>
          </div>
        </div>
      </div>
    </div>
  );
}