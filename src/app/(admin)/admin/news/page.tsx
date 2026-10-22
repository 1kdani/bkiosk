"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { Plus, Trash2, Edit2, Loader2, X, Palette, LayoutTemplate, UploadCloud } from "lucide-react";
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="p-8 text-white/40 font-bold text-center">Szerkesztő betöltése...</div>
}) as any;

interface NewsItem { id: string; title: string; content: string; tag: string; color: string; template: "default" | "image-left" | "image-top"; imageUrl?: string; }
interface NewsFormData { title: string; content: string; tag: string; color: string; template: "default" | "image-left" | "image-top"; imageUrl: string; }

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['clean']
  ],
};

export default function NewsAdminPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const defaultForm: NewsFormData = { title: "", content: "", tag: "Információ", color: "#3b82f6", template: "default", imageUrl: "" };
  const [formData, setFormData] = useState<NewsFormData>(defaultForm);

  const fetchNews = async () => {
    try {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      setNews(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as NewsItem[]);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNews(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "bathory_preset"); 
      const res = await fetch("https://api.cloudinary.com/v1_1/te_cloud_neved/image/upload", { method: "POST", body: data });
      const fileData = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: fileData.secure_url }));
    } catch (error) { alert("Hiba a kép feltöltésekor!"); } 
    finally { setIsUploadingImage(false); }
  };

  const handleEdit = (item: NewsItem) => {
    setFormData({ title: item.title, content: item.content, tag: item.tag, color: item.color, template: item.template, imageUrl: item.imageUrl || "" });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData(defaultForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) await updateDoc(doc(db, "news", editingId), { ...formData });
      else await addDoc(collection(db, "news"), { ...formData, createdAt: serverTimestamp() });
      handleCancel();
      fetchNews();
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Biztosan törölni szeretnéd ezt a hírt?")) {
      await deleteDoc(doc(db, "news", id));
      fetchNews();
    }
  };

  return (
    <div className="w-full space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Hírek kezelése</h1>
          <p className="text-white/50 mt-2 font-medium">Szerkeszd a TV-n futó híreket Word-szerű formázással.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 md:py-3 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95">
            <Plus className="w-5 h-5" /> Új hír
          </button>
        )}
      </div>

      {/* Sötét módú Quill és Űrlap */}
      <style dangerouslySetInnerHTML={{ __html: `
        .ql-toolbar.ql-snow { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); border-radius: 1rem 1rem 0 0; padding: 12px; }
        .ql-container.ql-snow { border-color: rgba(255,255,255,0.1); border-radius: 0 0 1rem 1rem; color: white; font-size: 16px; font-family: inherit; }
        .ql-stroke { stroke: rgba(255,255,255,0.6) !important; }
        .ql-fill { fill: rgba(255,255,255,0.6) !important; }
        .ql-picker-label { color: rgba(255,255,255,0.6) !important; }
        .ql-picker-options { background-color: #1a1a1a !important; border-color: rgba(255,255,255,0.1) !important; }
        .ql-editor.ql-blank::before { color: rgba(255,255,255,0.3); font-style: normal; }
      `}} />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121212] p-6 md:p-10 rounded-[2rem] shadow-2xl border border-white/5 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6 mb-10 border-b border-white/5 pb-6">
            <h2 className="text-2xl font-black text-white tracking-tight">{editingId ? "Hír módosítása" : "Új hír létrehozása"}</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 bg-[#1a1a1a] px-5 py-3 rounded-2xl border border-white/5">
                <Palette className="w-5 h-5 text-white/40" />
                <span className="text-sm font-bold text-white/70">TV Szín:</span>
                <input type="color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
              </div>
              <div className="flex items-center gap-3 bg-[#1a1a1a] px-5 py-3 rounded-2xl border border-white/5">
                <LayoutTemplate className="w-5 h-5 text-white/40" />
                <span className="text-sm font-bold text-white/70">Sablon:</span>
                <select value={formData.template} onChange={(e) => setFormData({...formData, template: e.target.value as any})} className="bg-transparent font-bold text-white outline-none">
                  <option value="default" className="bg-[#1a1a1a]">Középen (Nincs kép)</option>
                  <option value="image-left" className="bg-[#1a1a1a]">Kép bal oldalon</option>
                  <option value="image-top" className="bg-[#1a1a1a]">Kép felül</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">Hír címe</label>
                <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white font-black text-xl" placeholder="pl. Gólyabál 2026" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">Címke (Tag)</label>
                <input required type="text" value={formData.tag} onChange={(e) => setFormData({...formData, tag: e.target.value})} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white font-bold" placeholder="pl. Kiemelt" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">Borítókép (Opcionális)</label>
              {formData.imageUrl ? (
                <div className="relative w-full h-[180px] rounded-2xl overflow-hidden border border-white/10 group">
                  <img src={formData.imageUrl} alt="Előnézet" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData({...formData, imageUrl: ""})} className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition-all shadow-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="w-full h-[180px] border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#1a1a1a] group">
                  {isUploadingImage ? (
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-white/20 mb-3 group-hover:text-blue-400 transition-colors" />
                      <span className="text-sm font-bold text-white/40 group-hover:text-blue-400">Kattints a kép feltöltéséhez</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                </label>
              )}
            </div>
          </div>

          <div className="mb-10">
            <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">Hír szövege</label>
            <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden h-[300px] flex flex-col">
              <ReactQuill value={formData.content} onChange={(content: string) => setFormData({...formData, content})} modules={modules} className="flex-1 flex flex-col" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 border-t border-white/5 pt-8">
            <button type="button" onClick={handleCancel} className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
              <X className="w-5 h-5" /> Mégse
            </button>
            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50">
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />} {editingId ? "Mentés" : "Közzététel"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <div key={item.id} className="bg-[#121212] rounded-[2rem] shadow-xl border border-white/5 flex flex-col overflow-hidden group hover:border-white/20 transition-all">
              {item.imageUrl ? (
                <div className="w-full h-48 relative">
                  <img src={item.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent" />
                </div>
              ) : (
                <div className="h-3 w-full shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{ backgroundColor: item.color }} />
              )}
              <div className="p-8 flex-1 flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest w-max mb-4 px-3 py-1 rounded-lg border" style={{ borderColor: `${item.color}40`, color: item.color, backgroundColor: `${item.color}10` }}>
                  {item.tag}
                </span>
                <h3 className="text-2xl font-black text-white mb-3 leading-tight tracking-tight">{item.title}</h3>
                <div className="text-white/40 text-sm mb-6 line-clamp-3" dangerouslySetInnerHTML={{ __html: item.content }} />
                
                <div className="pt-6 border-t border-white/5 flex justify-between items-center mt-auto">
                  <button onClick={() => handleEdit(item)} className="text-blue-400 hover:bg-blue-500/10 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
                    <Edit2 className="w-4 h-4" /> Szerkesztés
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-500/10 p-2.5 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}