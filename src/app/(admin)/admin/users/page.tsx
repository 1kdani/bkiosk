"use client";

import { useState, useEffect } from "react";
import { db, firebaseConfig } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { UserPlus, Shield, Loader2, Trash2, Edit2, X, CheckSquare, Square, Mail } from "lucide-react";
import { useStore, UserPermissions } from "@/store/useStore";

interface UserData { id: string; email: string; name: string; permissions: UserPermissions; createdAt: string; }

export default function UsersAdminPage() {
  const { permissions: currentUserPerms } = useStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const defaultPerms: UserPermissions = { manageNews: false, manageTimetable: false, manageSettings: false, manageUsers: false };
  const [formData, setFormData] = useState({ name: "", email: "", permissions: defaultPerms });

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserData[]);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if (currentUserPerms?.manageUsers) fetchUsers(); }, [currentUserPerms]);

  const togglePermission = (key: keyof UserPermissions) => {
    setFormData(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }));
  };

  const handleEdit = (u: UserData) => {
    setFormData({ name: u.name || "", email: u.email, permissions: u.permissions || defaultPerms });
    setEditingId(u.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData({ name: "", email: "", permissions: defaultPerms });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "users", editingId), { name: formData.name, permissions: formData.permissions });
        alert("Sikeres mentés!");
      } else {
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);
        const randomPassword = Math.random().toString(36).slice(-10) + "A1!"; 
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, randomPassword);
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: formData.email, name: formData.name, permissions: formData.permissions, createdAt: new Date().toISOString(),
        });

        await sendPasswordResetEmail(secondaryAuth, formData.email);
        await signOut(secondaryAuth);
        alert("Fiók létrehozva! Email elküldve.");
      }
      handleCancel(); fetchUsers();
    } catch (error: any) { alert("Hiba: " + error.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Biztosan törölni akarod a felhasználót?")) {
      await deleteDoc(doc(db, "users", userId));
      fetchUsers();
    }
  };

  if (!currentUserPerms?.manageUsers) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/30 p-12 text-center">
        <Shield className="w-24 h-24 mb-6 text-white/10" />
        <h2 className="text-3xl font-black text-white/50 mb-2 tracking-tight">Nincs jogosultságod</h2>
        <p className="text-lg">Ezt az oldalt csak a fő rendszergazdák láthatják.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Adminok kezelése</h1>
          <p className="text-white/50 mt-2 font-medium">Fiókok létrehozása és részletes jogosultságok kezelése.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 md:py-3 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95">
            <UserPlus className="w-5 h-5" /> Új admin
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121212] p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-white/5 animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 border-b border-white/5 pb-6">
            <h2 className="text-2xl font-black text-white tracking-tight">{editingId ? "Felhasználó módosítása" : "Új fiók generálása"}</h2>
            {!editingId && <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2"><Mail className="w-4 h-4"/> Beállító emailt kap</span>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">Teljes Név</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white font-black text-lg" placeholder="pl. Kiss János" />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">Email cím (Bejelentkezéshez)</label>
                <input required disabled={!!editingId} type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white font-bold disabled:bg-[#121212] disabled:text-white/20 disabled:cursor-not-allowed" placeholder="tanar@bathory.hu" />
                {editingId && <p className="text-xs text-white/30 mt-3 font-medium">Az email cím biztonsági okokból utólag nem módosítható.</p>}
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-8 rounded-[2rem] border border-white/5">
              <label className="block text-xs font-black text-white/70 mb-6 uppercase tracking-[0.2em]">Részletes Jogosultságok</label>
              <div className="space-y-5">
                {[
                  { key: "manageNews", icon: "Hírek", desc: "Hírek létrehozása, szerkesztése, törlése", color: "blue" },
                  { key: "manageTimetable", icon: "Órarend", desc: "Osztályok és tanárok adatainak módosítása", color: "emerald" },
                  { key: "manageSettings", icon: "Rendszer", desc: "Csengetési rend és Térkép módosítása", color: "orange" },
                  { key: "manageUsers", icon: "Adminok", desc: "Munkatársak meghívása és jogosultságok", color: "red" },
                ].map((perm) => (
                  <button key={perm.key} type="button" onClick={() => togglePermission(perm.key as keyof UserPermissions)} className="flex items-center gap-4 w-full text-left group bg-[#121212] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                    {formData.permissions[perm.key as keyof UserPermissions] ? 
                      <CheckSquare className={`w-7 h-7 text-${perm.color}-500`} /> : 
                      <Square className="w-7 h-7 text-white/20 group-hover:text-white/40" />
                    }
                    <div>
                      <div className="font-black text-white mb-0.5">{perm.icon}</div>
                      <div className="text-xs text-white/40 font-medium">{perm.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 mt-10 pt-8 border-t border-white/5">
            <button type="button" onClick={handleCancel} className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
              <X className="w-5 h-5" /> Mégse
            </button>
            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              {editingId ? "Jogosultságok Mentése" : "Fiók Létrehozása"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-[#121212] rounded-[2rem] shadow-xl border border-white/5 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#1a1a1a] border-b border-white/5 text-white/30 text-xs font-bold uppercase tracking-widest">
                <th className="px-8 py-6">Név / Email</th>
                <th className="px-8 py-6">Aktív Jogosultságok</th>
                <th className="px-8 py-6 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-black text-white text-lg">{u.name || "Nincs megadva"}</p>
                    <p className="text-sm font-medium text-white/40 mt-1">{u.email}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-2 flex-wrap max-w-sm">
                      {u.permissions?.manageNews && <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider rounded-lg">Hírek</span>}
                      {u.permissions?.manageTimetable && <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider rounded-lg">Órarend</span>}
                      {u.permissions?.manageSettings && <span className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-wider rounded-lg">Rendszer</span>}
                      {u.permissions?.manageUsers && <span className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider rounded-lg">Adminok</span>}
                      {(!u.permissions || Object.values(u.permissions).every(v => !v)) && <span className="text-white/20 text-sm font-bold italic">Nincs jogosultsága</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right flex items-center justify-end gap-3 h-full">
                    <button onClick={() => handleEdit(u)} className="text-blue-400 hover:bg-blue-500/10 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors border border-transparent hover:border-blue-500/20">
                      <Edit2 className="w-4 h-4" /> Szerkesztés
                    </button>
                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:bg-red-500/10 p-2.5 rounded-xl transition-colors border border-transparent hover:border-red-500/20">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}