"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Map as MapIcon, ZoomIn, ZoomOut, Maximize, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface FloorMap { id: string; name: string; imageUrl: string; }

export default function MapPanel() {
  const [floors, setFloors] = useState<FloorMap[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "maps"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().floors) {
        const floorData = docSnap.data().floors as FloorMap[];
        setFloors(floorData);
        if (floorData.length > 0 && !activeFloorId) setActiveFloorId(floorData[0].id);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeFloorId]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => setScale(1);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-orange-500" /></div>;

  const activeFloor = floors.find((f) => f.id === activeFloorId);

  return (
    <div className="w-full h-full flex flex-col p-8 relative font-sans">
      
      {/* Fejléc és Szintválasztó */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-orange-500/10 p-6 rounded-[2rem] mb-8 border border-orange-500/20 shrink-0 z-10">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-orange-500/20 rounded-2xl border border-orange-500/30">
            <MapIcon className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-orange-400 tracking-tight">Épület Térkép</h4>
            <p className="text-orange-500/60 font-medium">Terembeosztás és tájékozódás</p>
          </div>
        </div>
        
        <div className="flex gap-3 bg-black/40 p-2.5 rounded-2xl shadow-inner border border-white/5 overflow-x-auto w-full xl:w-auto custom-scrollbar touch-pan-x">
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => { setActiveFloorId(floor.id); setScale(1); }}
              className={`px-8 py-3.5 rounded-xl font-bold text-lg transition-all whitespace-nowrap border ${
                activeFloorId === floor.id 
                  ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] border-orange-400" 
                  : "bg-transparent text-white/50 border-transparent hover:bg-white/5 hover:text-white"
              }`}
            >
              {floor.name}
            </button>
          ))}
          {floors.length === 0 && <span className="p-4 text-orange-400/50 font-bold uppercase tracking-widest">Nincsenek feltöltött térképek.</span>}
        </div>
      </div>

      {/* Interaktív Térkép Terület */}
      <div className="flex-1 relative bg-[#121212] rounded-[2rem] border border-white/5 overflow-hidden shadow-inner flex items-center justify-center">
        
        <div className="absolute right-8 bottom-8 flex flex-col gap-4 z-20">
          <button onClick={handleZoomIn} className="bg-[#1a1a1a] p-4 rounded-2xl shadow-xl border border-white/10 text-white hover:text-orange-400 hover:border-orange-500/30 transition-all active:scale-95">
            <ZoomIn className="w-8 h-8" />
          </button>
          <button onClick={handleResetZoom} className="bg-[#1a1a1a] p-4 rounded-2xl shadow-xl border border-white/10 text-white hover:text-orange-400 hover:border-orange-500/30 transition-all active:scale-95">
            <Maximize className="w-8 h-8" />
          </button>
          <button onClick={handleZoomOut} className="bg-[#1a1a1a] p-4 rounded-2xl shadow-xl border border-white/10 text-white hover:text-orange-400 hover:border-orange-500/30 transition-all active:scale-95">
            <ZoomOut className="w-8 h-8" />
          </button>
        </div>

        {activeFloor && activeFloor.imageUrl ? (
          <div ref={constraintsRef} className="w-full h-full relative flex items-center justify-center">
            {/* Finom rács minta a térkép mögé (Grid) */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            <motion.div
              drag dragConstraints={constraintsRef} dragElastic={0.1} animate={{ scale }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="cursor-grab active:cursor-grabbing w-full h-full flex items-center justify-center"
            >
              <img 
                src={activeFloor.imageUrl} 
                alt={activeFloor.name} 
                className="max-w-none max-h-none object-contain pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-white/5 rounded-3xl p-4"
                style={{ width: "85%", height: "85%" }} 
              />
            </motion.div>
          </div>
        ) : (
          <div className="text-center text-white/30 p-12">
            <MapIcon className="w-24 h-24 mx-auto mb-6 opacity-20" />
            <h3 className="text-3xl font-black text-white/50 mb-2 tracking-tight">A térkép hamarosan elérhető</h3>
            <p className="text-xl font-medium">Az adminisztrátorok hamarosan feltöltik az alaprajzokat.</p>
          </div>
        )}
      </div>
    </div>
  );
}