"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Save, Loader2, CalendarDays, Plus, Trash2, Settings2, UploadCloud } from "lucide-react";

const days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];
const periods = ["1.", "2.", "3.", "4.", "5.", "6.", "7.", "8."];
type ScheduleData = Record<string, Record<string, { subject: string; room: string; teacher: string }>>;
interface MetaData { subjects: string[]; teachers: string[]; rooms: string[]; classes: string[]; }

export default function TimetableAdminPage() {
  const [metaData, setMetaData] = useState<MetaData>({ subjects: [], teachers: [], rooms: [], classes: ["9.A"] });
  const [selectedClass, setSelectedClass] = useState("9.A");
  const [schedule, setSchedule] = useState<ScheduleData>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showMetaSettings, setShowMetaSettings] = useState(false);
  const [newMetaValue, setNewMetaValue] = useState("");
  const [activeMetaTab, setActiveMetaTab] = useState<keyof MetaData>("classes");

  useEffect(() => {
    const fetchMeta = async () => {
      const metaDoc = await getDoc(doc(db, "settings", "timetable_meta"));
      if (metaDoc.exists()) {
        const data = metaDoc.data() as MetaData;
        setMetaData({ ...data, classes: data.classes || ["9.A"] });
        if (data.classes && data.classes.length > 0) setSelectedClass(data.classes[0]);
      } else {
        await setDoc(doc(db, "settings", "timetable_meta"), { subjects: [], teachers: [], rooms: [], classes: ["9.A"] });
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!selectedClass) return;
      setLoading(true);
      const scheduleDoc = await getDoc(doc(db, "timetables", selectedClass));
      if (scheduleDoc.exists() && scheduleDoc.data().schedule) setSchedule(scheduleDoc.data().schedule);
      else setSchedule({});
      setLoading(false);
    };
    fetchSchedule();
  }, [selectedClass]);

  const handleAddMeta = async () => {
    if (!newMetaValue.trim()) return;
    await updateDoc(doc(db, "settings", "timetable_meta"), { [activeMetaTab]: arrayUnion(newMetaValue.trim()) });
    setMetaData(prev => ({ ...prev, [activeMetaTab]: [...prev[activeMetaTab], newMetaValue.trim()] }));
    if (activeMetaTab === "classes" && metaData.classes.length === 0) setSelectedClass(newMetaValue.trim());
    setNewMetaValue("");
  };

  const handleRemoveMeta = async (value: string) => {
    await updateDoc(doc(db, "settings", "timetable_meta"), { [activeMetaTab]: arrayRemove(value) });
    setMetaData(prev => ({ ...prev, [activeMetaTab]: prev[activeMetaTab].filter(item => item !== value) }));
  };

  const handleChange = (day: string, period: string, field: "subject" | "room" | "teacher", value: string) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [period]: { ...prev[day]?.[period], [field]: value } } }));
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    await setDoc(doc(db, "timetables", selectedClass), { schedule });
    setSaving(false);
    alert(`${selectedClass} órarendje mentve!`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Figyelem! Az importálás felülírja a jelenlegi órarendeket és alapadatokat. Biztosan folytatod?")) {
      e.target.value = ""; return;
    }

    setIsImporting(true);
    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames.find(n => n.includes("Órarend")) || workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

      const newSubjects = new Set<string>();
      const newTeachers = new Set<string>();
      const newRooms = new Set<string>();
      const classSchedules: Record<string, ScheduleData> = {};

      rows.forEach(row => {
        const day = row['Nap'];
        let periodRaw = row['Óra (adott napon belül)'];
        if (!day || periodRaw === undefined || !["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"].includes(day)) return;

        const period = periodRaw + ".";
        const subject = row['Tantárgy'] ? String(row['Tantárgy']).trim() : "";
        const teacher = row['Tanár'] ? String(row['Tanár']).trim() : "";
        const room = row['Helyiség'] ? String(row['Helyiség']).trim() : "";

        if (subject) newSubjects.add(subject);
        if (teacher) newTeachers.add(teacher);
        if (room) newRooms.add(room);

        let rawClass = row['Osztály'] ? String(row['Osztály']).trim() : (row['Csoport'] ? String(row['Csoport']).trim().split(" ")[0] : "");
        if (!rawClass || rawClass === "nan") return;

        let resolvedClasses: string[] = [];
        const match = rawClass.match(/^(\d+)(.*)$/);
        if (match) {
          const grade = match[1]; const rest = match[2].toUpperCase().trim();
          if (rest === "KNY") resolvedClasses.push(`${grade}.KNY`);
          else if (/^[A-I]+$/.test(rest)) { for (const letter of rest) resolvedClasses.push(`${grade}.${letter}`); }
          else if (rest === "") resolvedClasses.push(`${grade}. évfolyam`);
          else resolvedClasses.push(`${grade}.${rest}`);
        } else { resolvedClasses.push(rawClass); }

        resolvedClasses.forEach(cls => {
          if (!classSchedules[cls]) classSchedules[cls] = {};
          if (!classSchedules[cls][day]) classSchedules[cls][day] = {};
          classSchedules[cls][day][period] = { subject, room, teacher };
        });
      });

      const finalSubjects = Array.from(newSubjects).sort();
      const finalTeachers = Array.from(newTeachers).sort();
      const finalRooms = Array.from(newRooms).sort();
      const finalClasses = Object.keys(classSchedules).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      await setDoc(doc(db, "settings", "timetable_meta"), { subjects: finalSubjects, teachers: finalTeachers, rooms: finalRooms, classes: finalClasses });

      const chunkArray = (arr: any[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
      for (const chunk of chunkArray(finalClasses, 20)) {
        await Promise.all(chunk.map(cls => setDoc(doc(db, "timetables", cls), { schedule: classSchedules[cls] })));
      }

      setMetaData({ subjects: finalSubjects, teachers: finalTeachers, rooms: finalRooms, classes: finalClasses });
      if (finalClasses.length > 0) { setSelectedClass(finalClasses[0]); setSchedule(classSchedules[finalClasses[0]]); }
      alert("Sikeres importálás!");
    } catch (error) { alert("Hiba az importálás során!"); } 
    finally { setIsImporting(false); if (e.target) e.target.value = ""; }
  };

  return (
    <div className="w-full space-y-8 pb-10">
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Órarendek</h1>
          <p className="text-white/50 mt-2 font-medium">Osztályok és tanárok adatainak rögzítése.</p>
        </div>
        
        {/* MOBILON WRAP, GÉPEN EGYMÁS MELLETT */}
        <div className="flex flex-wrap md:flex-nowrap gap-4 w-full xl:w-auto">
          <label className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 md:py-3 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 cursor-pointer transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            {isImporting ? "Importálás..." : "Excel Import"}
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isImporting || loading} />
          </label>
          <button onClick={() => setShowMetaSettings(!showMetaSettings)} className="w-full md:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-4 md:py-3 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all">
            <Settings2 className="w-5 h-5 text-white/50" /> {showMetaSettings ? "Rejtés" : "Alapadatok"}
          </button>
          <button onClick={handleSaveSchedule} disabled={saving || loading || isImporting} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 md:py-3 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Mentés
          </button>
        </div>
      </div>

      {/* META BEÁLLÍTÁSOK (Tantárgyak, Termek, Tanárok) */}
      {showMetaSettings && (
        <div className="bg-[#121212] p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/5 animate-in fade-in slide-in-from-top-4">
          <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-8 pb-2">
            {[ {id: "classes", name: "Osztályok"}, {id: "subjects", name: "Tantárgyak"}, {id: "teachers", name: "Tanárok"}, {id: "rooms", name: "Termek"} ].map(tab => (
              <button key={tab.id} onClick={() => setActiveMetaTab(tab.id as keyof MetaData)} className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-colors ${activeMetaTab === tab.id ? "bg-blue-600 text-white" : "bg-[#1a1a1a] text-white/40 hover:bg-white/5"}`}>
                {tab.name}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input type="text" value={newMetaValue} onChange={(e) => setNewMetaValue(e.target.value)} placeholder={`Új ${activeMetaTab} hozzáadása...`} className="flex-1 px-5 py-4 bg-[#1a1a1a] border border-white/5 rounded-xl outline-none focus:border-blue-500 text-white font-bold" />
            <button onClick={handleAddMeta} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-black flex items-center justify-center"><Plus className="w-6 h-6"/></button>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pr-2">
            {metaData[activeMetaTab].map(item => (
              <div key={item} className="flex justify-between items-center bg-[#1a1a1a] px-4 py-3 rounded-xl border border-white/5 text-sm font-bold text-white/80">
                <span className="truncate pr-2">{item}</span> 
                <button onClick={() => handleRemoveMeta(item)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors shrink-0"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OSZTÁLY VÁLASZTÓ */}
      <div className="bg-[#121212] p-6 rounded-3xl shadow-sm border border-white/5 flex flex-col sm:flex-row items-center gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 hidden sm:block"><CalendarDays className="w-6 h-6 text-emerald-400" /></div>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full sm:w-auto px-6 py-4 bg-[#1a1a1a] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none font-black text-white text-xl uppercase tracking-widest cursor-pointer">
          {metaData.classes.map(c => <option key={c} value={c} className="bg-[#121212]">{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-12 h-12 animate-spin text-emerald-500" /></div>
      ) : (
        /* HORIZONTÁLISAN GÖRGETHETŐ TÁBLÁZAT KONTÉNER */
        <div className="bg-[#121212] rounded-[2rem] shadow-xl border border-white/5 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr>
                <th className="p-6 bg-[#1a1a1a] border-b border-r border-white/5 font-bold text-center w-24 text-white/30 uppercase tracking-widest">Óra</th>
                {days.map(day => <th key={day} className="p-6 bg-[#1a1a1a] border-b border-white/5 font-black text-center text-white text-lg tracking-wide">{day}</th>)}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period} className="hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0">
                  <td className="p-6 border-r border-white/5 text-center font-black text-white/50 bg-[#1a1a1a]/50 text-2xl">{period.replace('.','')}</td>
                  {days.map((day) => {
                    const lesson = schedule[day]?.[period] || { subject: "", room: "", teacher: "" };
                    return (
                      <td key={`${day}-${period}`} className="p-4 align-top">
                        <div className="flex flex-col gap-3 bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 focus-within:border-emerald-500/50 transition-all">
                          <select value={lesson.subject} onChange={(e) => handleChange(day, period, "subject", e.target.value)} className="w-full px-3 py-2 text-sm font-black border border-white/10 rounded-xl outline-none bg-[#121212] text-white">
                            <option value="">- Tantárgy -</option>{metaData.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <div className="flex gap-3">
                            <select value={lesson.room} onChange={(e) => handleChange(day, period, "room", e.target.value)} className="w-1/2 px-2 py-2 text-xs font-bold border border-white/10 rounded-xl outline-none bg-[#121212] text-white/70">
                              <option value="">- Terem -</option>{metaData.rooms.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <select value={lesson.teacher} onChange={(e) => handleChange(day, period, "teacher", e.target.value)} className="w-1/2 px-2 py-2 text-xs font-bold border border-white/10 rounded-xl outline-none bg-[#121212] text-white/70">
                              <option value="">- Tanár -</option>{metaData.teachers.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}