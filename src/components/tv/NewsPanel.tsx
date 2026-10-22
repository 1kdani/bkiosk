"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Loader2, X } from "lucide-react";

interface NewsItem { id: string; title: string; content: string; tag: string; imageUrl?: string; color?: string; }

export default function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NewsItem[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-blue-500" /></div>;

  return (
    <div className="w-full h-full p-8 md:p-10 relative">
      
      {/* Sötét módú Quill formázások a belső tartalmakhoz és szigorú csonkolás (clamp) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .quill-content { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .quill-content p { margin-bottom: 1.25rem; line-height: 1.7; color: #94a3b8; }
        .quill-content strong { font-weight: 800; color: #ffffff; }
        .quill-content em { font-style: italic; }
        .quill-content h1, .quill-content h2, .quill-content h3 { font-weight: 900; color: #ffffff; margin-top: 2rem; margin-bottom: 1rem; line-height: 1.2; }
        .quill-content h1 { font-size: 2.25rem; } .quill-content h2 { font-size: 1.875rem; } .quill-content h3 { font-size: 1.5rem; }
        .quill-content ul { list-style-type: disc; padding-left: 2rem; margin-bottom: 1.25rem; color: #94a3b8; }
        .quill-content ol { list-style-type: decimal; padding-left: 2rem; margin-bottom: 1.25rem; color: #94a3b8; }
        .quill-content li { margin-bottom: 0.5rem; }
        .quill-content u { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 2px; text-decoration-color: ${selectedNews?.color || '#3b82f6'}; }
        
        /* A kártyákon lévő szöveg szigorú szabályozása, hogy sose lógjon ki */
        .line-clamp-html {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
        .line-clamp-html img, .line-clamp-html iframe { display: none !important; }
        .line-clamp-html p { margin-bottom: 0 !important; display: inline; }
      `}} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {news.map((item) => (
          <button 
            key={item.id} 
            onClick={() => setSelectedNews(item)} 
            className="bg-[#121212] rounded-[2rem] p-8 text-left border border-white/5 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all duration-400 flex flex-col h-[28rem] group overflow-hidden"
          >
            {item.imageUrl ? (
              <div className="w-full h-56 rounded-[1.5rem] overflow-hidden mb-6 shrink-0 relative bg-white/5 border border-white/5">
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100" />
              </div>
            ) : (
              <div className="h-3 w-full rounded-full mb-6 shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{ backgroundColor: item.color || '#3b82f6' }} />
            )}
            
            <div className="flex flex-col flex-1 min-h-0">
              <span className="inline-block px-4 py-1.5 rounded-lg font-black uppercase text-[11px] tracking-widest w-max mb-4 border" style={{ backgroundColor: `${item.color || '#3b82f6'}15`, color: item.color || '#3b82f6', borderColor: `${item.color || '#3b82f6'}30` }}>
                {item.tag}
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4 line-clamp-2 leading-[1.1] tracking-tight group-hover:text-blue-400 transition-colors shrink-0">{item.title}</h3>
              
              {/* Szigorú korlát a tartalomra */}
              <div className="text-sm text-slate-400 opacity-80 overflow-hidden relative max-h-[4.5rem]">
                <div className="line-clamp-html" dangerouslySetInnerHTML={{ __html: item.content }} />
              </div>
              
              <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white transition-colors shrink-0">
                Teljes cikk <span className="text-lg leading-none group-hover:translate-x-2 transition-transform duration-300">→</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedNews && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            /* JAVÍTÁS: items-start használata a centering helyett, így sosem vágja le a tetejét */
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex justify-center items-start p-6 md:p-12 overflow-y-auto custom-scrollbar"
          >
            {/* JAVÍTÁS: my-auto segít abban, hogy ha a tartalom kifér, akkor középre zárja, de ha magasabb a képernyőnél, akkor engedi fentről indulni */}
            <motion.div 
              initial={{ scale: 0.95, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 30 }} 
              className="bg-[#0a0a0a] w-full max-w-6xl my-auto rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,1)] border border-white/10 flex flex-col md:flex-row relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedNews(null)} 
                className="absolute top-8 right-8 z-50 bg-white/10 backdrop-blur-md text-white p-4 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl border border-white/10 active:scale-95"
              >
                <X className="w-7 h-7" />
              </button>
              
              {selectedNews.imageUrl && (
                <div className="w-full md:w-2/5 h-[350px] md:h-auto shrink-0 bg-white/5 relative border-r border-white/5">
                  <img src={selectedNews.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0a] md:block hidden" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent md:hidden block" />
                </div>
              )}
              
              <div className={`flex-1 p-10 md:p-16 ${selectedNews.imageUrl ? 'max-h-[85vh] overflow-y-auto custom-scrollbar' : 'p-12 md:p-24'}`}>
                <span className="inline-block px-5 py-2 rounded-xl font-black uppercase text-xs tracking-[0.2em] mb-8 border" style={{ borderColor: `${selectedNews.color || '#3b82f6'}40`, color: selectedNews.color || '#3b82f6', backgroundColor: `${selectedNews.color || '#3b82f6'}10` }}>
                  {selectedNews.tag}
                </span>
                
                <h2 className="text-4xl md:text-6xl font-black text-white mb-10 leading-[1.05] tracking-tighter drop-shadow-lg">
                  {selectedNews.title}
                </h2>
                
                <div className="quill-content text-xl font-light" dangerouslySetInnerHTML={{ __html: selectedNews.content }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}