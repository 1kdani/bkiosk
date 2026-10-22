"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Newspaper, CalendarDays, Map, BellRing, ChevronLeft } from "lucide-react";
import BellsPanel from "./BellsPanel";
import NewsPanel from "./NewsPanel";
import TimetablePanel from "./TimetablePanel";
import MapPanel from "./MapPanel";

const menuItems = [
  { id: "news", title: "Aktuális Hírek", desc: "Események, információk", icon: Newspaper, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "timetable", title: "Órarendek", desc: "Osztály és tanár nézet", icon: CalendarDays, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "map", title: "Térkép", desc: "Épület beosztás", icon: Map, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { id: "bells", title: "Csengetési Rend", desc: "Órák és szünetek", icon: BellRing, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
];

export default function InteractiveDashboard() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans">
      
      {/* HÁTTÉR EFFEKTEK (Egyezik az IdleScreen-nel a sima átmenetért) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
        }
      `}} />
      <div className="absolute inset-0 noise-bg pointer-events-none z-0" />
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[200px] z-0 pointer-events-none" />

      {/* LEBEGŐ FEJLÉC (Mint az IdleScreen-en!) */}
      <div className="absolute top-12 left-12 right-12 flex justify-between items-start z-50 pointer-events-none">
        
        {/* Bal oldal: Cím VAGY Vissza gomb */}
        <div className="pointer-events-auto">
          <AnimatePresence mode="wait">
            {!activeTab ? (
              <motion.div key="title" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-black tracking-[0.2em] uppercase text-white/80 drop-shadow-lg">SZTE Báthory István</h2>
                <div className="w-16 h-1.5 mt-3 rounded-full bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              </motion.div>
            ) : (
              <motion.button 
                key="back"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onClick={() => setActiveTab(null)} 
                className="flex items-center gap-4 bg-white/5 backdrop-blur-2xl px-6 py-4 rounded-[1.5rem] border border-white/10 hover:bg-white/10 transition-all shadow-2xl active:scale-95 group"
              >
                <ChevronLeft className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
                <span className="text-xl font-black uppercase tracking-[0.15em] text-white">Vissza a menübe</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        {/* Jobb oldal: Idő */}
        <div className="text-right bg-white/5 backdrop-blur-2xl px-8 py-4 rounded-3xl border border-white/10 shadow-2xl pointer-events-auto">
          <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-md">
            {time ? time.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
          </h1>
          <p className="text-xl text-white/50 font-bold mt-2 uppercase tracking-widest">
            {time ? time.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', weekday: 'long' }) : "Betöltés..."}
          </p>
        </div>
      </div>

      {/* FŐ TARTALOM TERÜLETE */}
      <div className="flex-1 w-full h-full pt-[170px] pb-10 px-10 z-10 flex flex-col relative">
        <AnimatePresence mode="wait">
          {!activeTab ? (
            <motion.div 
              key="grid" 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              transition={{ duration: 0.4, ease: "easeOut" }} 
              className="h-full flex items-center justify-center"
            >
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-8 w-full max-w-7xl">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button 
                      key={item.id} 
                      whileHover={{ y: -8, scale: 1.02 }} 
                      whileTap={{ scale: 0.97 }} 
                      onClick={() => setActiveTab(item.id)} 
                      className="bg-[#121212]/80 backdrop-blur-xl rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center border border-white/5 transition-all hover:border-white/20 hover:bg-[#1a1a1a] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] group h-[340px]"
                    >
                      <div className={`${item.bg} ${item.border} border w-28 h-28 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                        <Icon className={`w-12 h-12 ${item.color} drop-shadow-lg`} />
                      </div>
                      <h3 className="text-3xl font-black text-white mb-3 tracking-tight group-hover:text-white transition-colors">{item.title}</h3>
                      <p className="text-lg text-white/40 font-medium px-4">{item.desc}</p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="panel" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }} 
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full flex flex-col"
            >
              {/* MAGA A PANEL TARTALMA (Immár fejléc nélkül, kitöltve a teret) */}
              {activeTab === "bells" && <BellsPanel />}
              {activeTab === "news" && <NewsPanel />}
              {activeTab === "timetable" && <TimetablePanel />}
              {activeTab === "map" && <MapPanel />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}