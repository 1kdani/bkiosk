"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  tag: string;
  color: string;
  template: "default" | "image-left" | "image-top" | "full-image";
  imageUrl?: string;
  isImageOnly?: boolean;
}

const dummyNews: NewsItem[] = [
  { 
    id: "d1", 
    tag: "Rendszer", 
    title: "Üdvözlünk az új Prémium TV Panelben", 
    content: "<p>Ez a rendszer a legmodernebb technológiákkal és dizájnnal készült. Érintsd meg a képernyőt a folytatáshoz.</p>", 
    color: "#3b82f6",
    template: "default"
  }
];

export default function IdleScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NewsItem[];
      setNews(newsData);
    });
    return () => unsubscribe();
  }, []);

  const displayNews = news.length > 0 ? news : dummyNews;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayNews.length);
    }, 15000); 
    return () => clearInterval(timer);
  }, [displayNews.length]);

  const currentNews = displayNews[currentIndex];
  const activeColor = currentNews?.color || "#3b82f6";
  const isFullImage = currentNews?.isImageOnly || currentNews?.template === 'full-image';
  const hasImage = currentNews?.imageUrl && currentNews?.template !== 'default';

  return (
    <div className="w-full h-full bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans">
      
      <style dangerouslySetInnerHTML={{ __html: `
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
        }
        .quill-content p { margin-bottom: 1rem; line-height: 1.6; color: #cbd5e1; }
        .quill-content strong { font-weight: 800; color: #ffffff; }
        .quill-content em { font-style: italic; }
        .quill-content ul { list-style-type: disc; padding-left: 2rem; margin-bottom: 1rem; color: #cbd5e1; }
        .quill-content ol { list-style-type: decimal; padding-left: 2rem; margin-bottom: 1rem; color: #cbd5e1; }
      `}} />

      <div className="absolute inset-0 noise-bg pointer-events-none z-0" />
      <motion.div animate={{ backgroundColor: activeColor }} transition={{ duration: 2, ease: "easeInOut" }} className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[150px] z-0 opacity-20" />
      <motion.div animate={{ backgroundColor: activeColor }} transition={{ duration: 2, ease: "easeInOut" }} className="absolute bottom-0 right-0 w-[800px] h-[800px] rounded-full blur-[200px] z-0 opacity-[0.15]" />

      <div className="w-full flex justify-between items-start z-20 px-12 pt-12 shrink-0">
        <div>
          <h2 className="text-2xl font-black tracking-[0.2em] uppercase text-white/80 drop-shadow-lg">SZTE Báthory István</h2>
          <motion.div animate={{ backgroundColor: activeColor }} transition={{ duration: 1 }} className="w-16 h-1.5 mt-3 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
        </div>
        <div className="text-right bg-white/5 backdrop-blur-2xl px-8 py-4 rounded-3xl border border-white/10 shadow-2xl">
          <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-md">
            {time ? time.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
          </h1>
          <p className="text-xl text-white/50 font-bold mt-2 uppercase tracking-widest">
            {time ? time.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', weekday: 'long' }) : "Betöltés..."}
          </p>
        </div>
      </div>

      <div className="flex-1 w-full flex items-center justify-center p-8 md:p-12 z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNews.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            // Solid bg-[#121212] hogy a színátmenetes maszk (fade out) tökéletesen egybeolvadjon
            className={`w-full max-w-7xl max-h-full rounded-[3rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex ${
              isFullImage 
                ? 'items-center justify-center bg-transparent border-none shadow-none h-full' 
                : currentNews.template === 'image-left' 
                  ? 'flex-row bg-[#121212] min-h-[500px]' 
                  : 'flex-col bg-[#121212]'
            }`}
          >
            
            {/* FULL IMAGE MÓD (Plakát) */}
            {isFullImage && currentNews.imageUrl ? (
               <img src={currentNews.imageUrl} alt="" className="max-w-full max-h-[75vh] object-contain rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-white/10" />
            ) : (
              <>
                {/* KÉP FELÜL MÓD */}
                {hasImage && currentNews.template === 'image-top' && (
                  <div className="w-full h-80 relative shrink-0">
                    <img src={currentNews.imageUrl!} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
                  </div>
                )}
                
                {/* KÉP BAL OLDALON MÓD */}
                {hasImage && currentNews.template === 'image-left' && (
                  <div className="w-1/2 relative shrink-0">
                    <img src={currentNews.imageUrl!} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#121212]" />
                  </div>
                )}
                
                {/* HA NINCS KÉP (VAGY DEFAULT A SABLON), EGY SZÍNES SÁV JELENIK MEG */}
                {!hasImage && !isFullImage && (
                  <div className="h-4 w-full shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.5)]" style={{ backgroundColor: activeColor }} />
                )}

                {/* SZÖVEGES TARTALOM KONTÉNER */}
                <div className={`flex flex-col flex-1 relative overflow-hidden ${currentNews.template === 'image-left' ? 'p-12 md:p-16' : 'p-10 md:p-12'}`}>
                  
                  {/* Belső Flex oszlop a szövegeknek */}
                  <div className="flex flex-col h-full relative">
                    <span className="inline-block px-6 py-2.5 text-sm font-black uppercase tracking-[0.2em] rounded-full mb-6 border shrink-0 w-max" style={{ backgroundColor: `${activeColor}15`, color: activeColor, borderColor: `${activeColor}30` }}>
                      {currentNews.tag}
                    </span>
                    
                    {currentNews.title && (
                      <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-[1.15] tracking-tight shrink-0">
                        {currentNews.title}
                      </h2>
                    )}
                    
                    {/* Megformázott szöveg konténer Fade Out effekttel */}
                    <div className="relative flex-1 overflow-hidden">
                      <div 
                        className="quill-content text-xl md:text-2xl text-slate-300 font-light pb-4"
                        dangerouslySetInnerHTML={{ __html: currentNews.content }} 
                      />
                      {/* Alsó színátmenet a szöveg levágásához */}
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#121212] to-transparent pointer-events-none" />
                    </div>

                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full flex flex-col items-center justify-center gap-4 z-20 pb-12 shrink-0">
        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.8, 0.2] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="w-3 h-3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)]" style={{ backgroundColor: activeColor }} />
        <span className="text-xs font-bold uppercase tracking-[0.4em] text-white/40">Érintse meg a képernyőt a belépéshez</span>
      </div>
    </div>
  );
}