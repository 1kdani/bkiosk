"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Loader2, X } from "lucide-react";

interface NewsItem { 
  id: string; 
  title: string; 
  content: string; 
  tag: string; 
  imageUrl?: string; 
  color?: string; 
  template?: string; 
  isImageOnly?: boolean; 
}

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
      
      <style dangerouslySetInnerHTML={{ __html: `
        .quill-content { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .quill-content p { margin-bottom: 1rem; line-height: 1.7; color: #94a3b8; }
        .quill-content strong { font-weight: 800; color: #ffffff; }
        .quill-content em { font-style: italic; }
        .quill-content h1, .quill-content h2, .quill-content h3 { font-weight: 900; color: #ffffff; margin-top: 2rem; margin-bottom: 1rem; line-height: 1.2; }
        .quill-content h1 { font-size: 2.25rem; } .quill-content h2 { font-size: 1.875rem; } .quill-content h3 { font-size: 1.5rem; }
        .quill-content ul { list-style-type: disc; padding-left: 2rem; margin-bottom: 1rem; color: #94a3b8; }
        .quill-content ol { list-style-type: decimal; padding-left: 2rem; margin-bottom: 1rem; color: #94a3b8; }
        .quill-content li { margin-bottom: 0.5rem; }
        .quill-content u { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 2px; text-decoration-color: ${selectedNews?.color || '#3b82f6'}; }
        
        /* Előnézeti kártyákon a képeket és beágyazott elemeket elrejtjük a szövegből */
        .preview-content img, .preview-content iframe { display: none !important; }
      `}} />

      {/* RÁCSNÉZET A MENÜBEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {news.map((item) => {
          const isFullImage = item.isImageOnly || item.template === 'full-image';
          const hasImage = !!item.imageUrl && item.template !== 'default';

          return (
          <button 
            key={item.id} 
            onClick={() => setSelectedNews(item)} 
            // Okos kártya méretezés: Ha kép bal oldalon van, 2 oszlopot foglal el!
            className={`bg-[#121212] rounded-[2rem] p-8 text-left border border-white/5 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all duration-400 flex overflow-hidden group ${
              item.template === 'image-left' && !isFullImage ? 'flex-row col-span-1 md:col-span-2 h-[28rem] gap-8 p-0' : 'flex-col h-[28rem]'
            }`}
          >
            
            {/* KÁRTYA KÉP RÉSZE */}
            {hasImage ? (
              <div className={`overflow-hidden shrink-0 relative bg-white/5 border-white/5 ${
                  isFullImage ? 'w-full h-full rounded-[1.5rem]' 
                  : item.template === 'image-left' ? 'w-1/2 h-full' 
                  : 'w-full h-48 mb-6 rounded-[1.5rem] border'
                }`}
              >
                <img src={item.imageUrl!} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100" />
                {item.template === 'image-left' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#121212]" />
                )}
              </div>
            ) : (
              <div className="h-3 w-full rounded-full mb-6 shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{ backgroundColor: item.color || '#3b82f6' }} />
            )}
            
            {/* KÁRTYA SZÖVEGES RÉSZE */}
            {!isFullImage && (
              <div className={`flex flex-col flex-1 min-h-0 relative ${item.template === 'image-left' ? 'py-8 pr-8' : ''}`}>
                <span className="inline-block px-4 py-1.5 rounded-lg font-black uppercase text-[11px] tracking-widest w-max mb-4 border shrink-0" style={{ backgroundColor: `${item.color || '#3b82f6'}15`, color: item.color || '#3b82f6', borderColor: `${item.color || '#3b82f6'}30` }}>
                  {item.tag}
                </span>
                
                {item.title && (
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-3 leading-[1.2] tracking-tight group-hover:text-blue-400 transition-colors shrink-0">
                    {item.title}
                  </h3>
                )}
                
                {/* Formázott szöveg elhalványodó (Fade out) véggel */}
                <div className="relative flex-1 overflow-hidden min-h-[4rem]">
                  <div className="quill-content preview-content text-sm text-slate-400 opacity-80" dangerouslySetInnerHTML={{ __html: item.content }} />
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#121212] to-transparent pointer-events-none" />
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white transition-colors shrink-0">
                  Kibontás <span className="text-lg leading-none group-hover:translate-x-2 transition-transform duration-300">→</span>
                </div>
              </div>
            )}
          </button>
        )})}
      </div>

      {/* POPUP MODAL NÉZET A HÍRRE KATTINTVA */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex justify-center items-start p-6 md:p-12 overflow-y-auto custom-scrollbar"
          >
            {/* Középre zárt, elegáns sötét konténer */}
            <motion.div 
              initial={{ scale: 0.95, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 30 }} 
              className={`bg-[#0a0a0a] w-full max-w-6xl my-auto rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,1)] border border-white/10 flex relative overflow-hidden ${
                selectedNews.isImageOnly || selectedNews.template === 'full-image' 
                  ? 'flex-col items-center justify-center p-4 bg-transparent border-none shadow-none' 
                  : selectedNews.imageUrl && selectedNews.template === 'image-left' 
                    ? 'flex-row min-h-[500px]' 
                    : 'flex-col'
              }`}
            >
              <button 
                onClick={() => setSelectedNews(null)} 
                className="absolute z-50 top-8 right-8 bg-white/10 backdrop-blur-md text-white p-4 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl border border-white/10 active:scale-95"
              >
                <X className="w-7 h-7" />
              </button>
              
              {/* CSAK KÉP MÓD (Plakát) */}
              {(selectedNews.isImageOnly || selectedNews.template === 'full-image') && selectedNews.imageUrl ? (
                  <img src={selectedNews.imageUrl} alt="" className="max-w-full max-h-[85vh] object-contain rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,1)] border border-white/10" />
              ) : (
                /* NORMÁL ÉS KÉPES SABLONOK */
                <>
                  {/* Kép Felül */}
                  {selectedNews.imageUrl && selectedNews.template === 'image-top' && (
                    <div className="w-full h-72 md:h-96 relative shrink-0">
                      <img src={selectedNews.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
                    </div>
                  )}

                  {/* Kép Bal oldalon */}
                  {selectedNews.imageUrl && selectedNews.template === 'image-left' && (
                    <div className="w-1/2 relative shrink-0 border-r border-white/5">
                      {/* Az absolute képpel kitöltjük a rendelkezésre álló flex magasságot torzulás nélkül */}
                      <img src={selectedNews.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0a]" />
                    </div>
                  )}

                  {/* Színes vonal, ha nincs kép */}
                  {(!selectedNews.imageUrl || selectedNews.template === 'default') && (
                    <div className="h-4 w-full shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.5)]" style={{ backgroundColor: selectedNews.color || '#3b82f6' }} />
                  )}
                  
                  {/* Szöveges tartalom beépített gördüléssel */}
                  <div className={`flex-1 flex flex-col justify-center w-full h-full overflow-hidden ${selectedNews.template === 'image-left' ? 'p-10 md:p-16' : 'p-8 md:p-12'}`}>
                    
                    {/* BELSŐ GÖRGETÉS A CIKKBEN: max-h-[75vh] és overflow-y-auto */}
                    <div className={`w-full h-full flex flex-col max-h-[75vh] overflow-y-auto custom-scrollbar ${!selectedNews.imageUrl || selectedNews.template === 'default' ? 'max-w-5xl mx-auto' : ''}`}>
                      <span className="inline-block px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-[0.2em] mb-6 border shrink-0 w-max" style={{ borderColor: `${selectedNews.color || '#3b82f6'}40`, color: selectedNews.color || '#3b82f6', backgroundColor: `${selectedNews.color || '#3b82f6'}15` }}>
                        {selectedNews.tag}
                      </span>
                      
                      {selectedNews.title && (
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-[1.1] tracking-tight drop-shadow-lg shrink-0">
                          {selectedNews.title}
                        </h2>
                      )}
                      
                      {/* A cikk belső szövege - ITT MINDEN FORMÁZÁS ÉL ÉS GÖRGETHETŐ! */}
                      <div className={`quill-content font-light ${selectedNews.template === 'image-top' ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'}`} dangerouslySetInnerHTML={{ __html: selectedNews.content }} />
                    </div>
                    
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}