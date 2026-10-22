"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Plus, Trash2, Loader2, BellRing, Map as MapIcon, Image as ImageIcon, Upload } from "lucide-react";

interface BellClass { id: string; period: string; time: string; breakText: string; }
interface FloorMap { id: string; name: string; imageUrl: string; }

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [bells, setBells] = useState<BellClass[]>([]);
  const [savingBells, setSavingBells] = useState(false);
  const [floors, setFloors] = useState<FloorMap[]>([]);
  const [savingMaps, setSavingMaps] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const bellSnap = await getDoc(doc(db, "settings", "bells"));
        if (bellSnap.exists() && bellSnap.data().schedule) setBells(bellSnap.data().schedule);
        else setBells([{ id: "1", period: "1.", time: "08:00 - 08:45", breakText: "10 perc" }]);

        const mapSnap = await getDoc(doc(db, "settings", "maps"));
        if (mapSnap.exists() && mapSnap.data().floors) setFloors(mapSnap.data().floors);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  const handleSaveBells = async () => {
    setSavingBells(true);
    try { await setDoc(doc(db, "settings", "bells"), { schedule: bells }); alert("Mentve!"); } 
    catch (e) { alert("Hiba mentéskor!"); }
    setSavingBells(false);
  };

  const uploadImageToCloudinary = async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "bathory_preset"); 
    const res = await fetch("https://api.cloudinary.com/v1_1/rfcmhupl/image/upload", { method: "POST", body: data });
    const fileData = await res.json();
    return fileData.secure_url;
  };

  const handleImageUpload = async (floorId: string, file: File) => {
    setUploadingId(floorId);
    try {
      const url = await uploadImageToCloudinary(file);
      setFloors(floors.map(f => f.id === floorId ? { ...f, imageUrl: url } : f));
    } catch (error) { alert("Hiba a kép feltöltésekor!"); } 
    finally { setUploadingId(null); }
  };

  const handleSaveMaps = async () => {
    setSavingMaps(true);
    try { await setDoc(doc(db, "settings", "maps"), { floors }); alert("Mentve!"); } 
    catch (e) { alert("Hiba mentéskor!"); }
    setSavingMaps(false);
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-blue-500" /></div>;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 pb-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Rendszer Beállítások</h1>
        <p className="text-white/50 mt-2 font-medium">Kezeld a statikus tartalmakat a TV panelekhez.</p>
      </div>

      {/* CSENGETÉSI REND SZEKCIÓ */}
      <div className="bg-[#121212] p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-white/5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20"><BellRing className="w-7 h-7 text-purple-400" /></div>
            <h2 className="text-2xl font-black text-white tracking-tight">Csengetési Rend</h2>
          </div>
          <button onClick={handleSaveBells} disabled={savingBells} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-50 active:scale-95">
            {savingBells ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Mentés
          </button>
        </div>

        <div className="space-y-4">
          {bells.map((bell, index) => (
            <div key={bell.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[#1a1a1a] p-4 md:p-5 rounded-2xl border border-white/5">
              <div className="font-black text-white/30 text-xl w-8 text-center shrink-0">{index + 1}.</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <input type="text" placeholder="1." value={bell.period} onChange={(e) => setBells(bells.map(b => b.id === bell.id ? { ...b, period: e.target.value } : b))} className="w-full px-4 py-3 bg-[#121212] border border-white/10 rounded-xl outline-none focus:border-purple-500 text-white font-bold placeholder:text-white/20" />
                <input type="text" placeholder="08:00 - 08:45" value={bell.time} onChange={(e) => setBells(bells.map(b => b.id === bell.id ? { ...b, time: e.target.value } : b))} className="w-full px-4 py-3 bg-[#121212] border border-white/10 rounded-xl outline-none focus:border-purple-500 text-white font-mono font-bold placeholder:text-white/20" />
                <input type="text" placeholder="10 perc" value={bell.breakText} onChange={(e) => setBells(bells.map(b => b.id === bell.id ? { ...b, breakText: e.target.value } : b))} className="w-full px-4 py-3 bg-[#121212] border border-white/10 rounded-xl outline-none focus:border-purple-500 text-white font-bold placeholder:text-white/20" />
              </div>
              <button onClick={() => setBells(bells.filter(b => b.id !== bell.id))} className="w-full sm:w-auto mt-2 sm:mt-0 text-red-500 hover:bg-red-500/10 p-3 rounded-xl transition-all border border-transparent hover:border-red-500/20 flex justify-center">
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
          ))}
          <button onClick={() => setBells([...bells, { id: Date.now().toString(), period: "", time: "", breakText: "" }])} className="text-purple-400 font-bold uppercase tracking-widest text-sm hover:bg-purple-500/10 px-6 py-4 rounded-2xl flex items-center justify-center gap-2 w-full transition-colors border border-dashed border-purple-500/30">
            <Plus className="w-5 h-5" /> Új tanóra hozzáadása
          </button>
        </div>
      </div>

      {/* ISKOLA TÉRKÉP SZEKCIÓ */}
      <div className="bg-[#121212] p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-white/5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20"><MapIcon className="w-7 h-7 text-orange-400" /></div>
            <h2 className="text-2xl font-black text-white tracking-tight">Térkép Alaprajzok</h2>
          </div>
          <button onClick={handleSaveMaps} disabled={savingMaps} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white px-6 py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)] disabled:opacity-50 active:scale-95">
            {savingMaps ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Mentés
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {floors.map((floor) => (
            <div key={floor.id} className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden flex flex-col">
              <div className="p-5 bg-[#121212]/50 border-b border-white/5 flex items-center gap-4">
                <input type="text" placeholder="Szint neve (pl. 1. emelet)" value={floor.name} onChange={(e) => setFloors(floors.map(f => f.id === floor.id ? { ...f, name: e.target.value } : f))} className="flex-1 px-4 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-xl outline-none focus:border-orange-500 text-white font-black" />
                <button onClick={() => setFloors(floors.filter(f => f.id !== floor.id))} className="text-red-500 hover:bg-red-500/10 p-2.5 rounded-xl border border-transparent hover:border-red-500/20"><Trash2 className="w-5 h-5" /></button>
              </div>
              
              <div className="p-8 flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
                {floor.imageUrl ? (
                  <div className="relative w-full h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden group">
                    <img src={floor.imageUrl} alt="Alaprajz" className="w-full h-full object-contain p-4" />
                    <label className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <span className="text-white font-bold flex items-center gap-2 bg-orange-600 px-6 py-3 rounded-xl"><Upload className="w-5 h-5"/> Kép cseréje</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(floor.id, e.target.files[0])} />
                    </label>
                  </div>
                ) : (
                  <label className="w-full h-full border-2 border-dashed border-white/10 hover:border-orange-500/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#121212]">
                    {uploadingId === floor.id ? (
                      <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 text-white/20 mb-3" />
                        <span className="text-sm font-bold uppercase tracking-widest text-white/40">Alaprajz feltöltése</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(floor.id, e.target.files[0])} disabled={uploadingId === floor.id} />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setFloors([...floors, { id: Date.now().toString(), name: "Új emelet", imageUrl: "" }])} className="mt-8 text-orange-400 font-bold uppercase tracking-widest text-sm hover:bg-orange-500/10 px-6 py-4 rounded-2xl flex items-center justify-center gap-2 w-full transition-colors border border-dashed border-orange-500/30">
          <Plus className="w-5 h-5" /> Új emelet / térkép hozzáadása
        </button>
      </div>
    </div>
  );
}