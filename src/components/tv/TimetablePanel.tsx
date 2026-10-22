"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Loader2, Users, Clock, CalendarDays } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, getDoc } from "firebase/firestore";

const days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];
const periods = ["1.", "2.", "3.", "4.", "5.", "6.", "7.", "8."];
const periodTimes: Record<string, string> = { "1.": "07:25 - 08:10", "2.": "08:20 - 09:05", "3.": "09:20 - 10:05", "4.": "10:20 - 11:05", "5.": "11:15 - 12:00", "6.": "12:20 - 13:05", "7.": "13:15 - 14:00", "8.": "14:10 - 14:55" };

type ScheduleData = Record<string, Record<string, { subject: string; room: string; teacher: string }>>;
type ClassDoc = { id: string; schedule: ScheduleData };

const getSubjectColor = (s: string) => {
  const str = s.toLowerCase();
  if (str.includes("mate") || str.includes("analízis")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (str.includes("magyar") || str.includes("irodalom")) return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  if (str.includes("töri") || str.includes("történelem")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (str.includes("angol") || str.includes("német") || str.includes("francia")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (str.includes("tesi") || str.includes("testnev")) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  if (str.includes("info") || str.includes("dig")) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  if (str.includes("fizika") || str.includes("kémia") || str.includes("bio")) return "bg-teal-500/10 text-teal-400 border-teal-500/20";
  return "bg-white/5 text-white/80 border-white/10";
};

export default function TimetablePanel() {
  const [classesData, setClassesData] = useState<ClassDoc[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"class" | "teacher">("class");
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const metaDoc = await getDoc(doc(db, "settings", "timetable_meta"));
      if (metaDoc.exists() && metaDoc.data().teachers) setTeachers(metaDoc.data().teachers.sort());
      onSnapshot(query(collection(db, "timetables")), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, schedule: doc.data().schedule || {} })).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        setClassesData(data);
        if (data.length > 0 && !selectedTarget && viewMode === "class") setSelectedTarget(data[0].id);
        setLoading(false);
      });
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (viewMode === "class" && classesData.length > 0) setSelectedTarget(classesData[0].id);
    if (viewMode === "teacher" && teachers.length > 0) setSelectedTarget(teachers[0]);
  }, [viewMode, classesData, teachers]);

  const getTeacherSchedule = (teacherName: string): ScheduleData => {
    const tSchedule: ScheduleData = {};
    days.forEach(day => { tSchedule[day] = {}; periods.forEach(period => { classesData.forEach(cls => { const lesson = cls.schedule[day]?.[period]; if (lesson && lesson.teacher === teacherName) { tSchedule[day][period] = { subject: lesson.subject, room: lesson.room, teacher: cls.id }; } }); }); });
    return tSchedule;
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-emerald-500" /></div>;

  const currentSchedule = viewMode === "class" ? classesData.find(c => c.id === selectedTarget)?.schedule || {} : getTeacherSchedule(selectedTarget);
  const optionsList = viewMode === "class" ? classesData.map(c => c.id) : teachers;

  return (
    <div className="w-full h-full flex flex-col relative gap-6">
      
      {/* SZUPERKOMPAKT EGY SOROS VEZÉRLŐSÁV */}
      <div className="flex flex-row justify-between items-center bg-[#121212]/80 backdrop-blur-md px-6 py-4 rounded-[1.5rem] shadow-lg border border-white/5 shrink-0 z-20">
        
        {/* Bal: Ikon és Cím */}
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
            <CalendarDays className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">Órarendek</h3>
        </div>

        {/* Jobb: Választók */}
        <div className="flex items-center gap-4">
          <div className="flex bg-black/50 border border-white/5 rounded-xl p-1 shrink-0">
            <button onClick={() => setViewMode("class")} className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${viewMode === "class" ? "bg-[#1a1a1a] text-white shadow-md border border-white/10" : "text-white/40 hover:text-white/70"}`}><GraduationCap className="w-4 h-4"/> Osztály</button>
            <button onClick={() => setViewMode("teacher")} className={`px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${viewMode === "teacher" ? "bg-[#1a1a1a] text-white shadow-md border border-white/10" : "text-white/40 hover:text-white/70"}`}><Users className="w-4 h-4"/> Tanár</button>
          </div>

          <select 
            value={selectedTarget} 
            onChange={(e) => setSelectedTarget(e.target.value)} 
            className="w-64 bg-[#1a1a1a] border border-white/10 text-white font-black text-lg px-4 py-2.5 rounded-xl outline-none focus:border-white/30 cursor-pointer transition-colors shadow-inner"
          >
            {optionsList.map(opt => <option key={opt} value={opt} className="bg-[#121212]">{opt}</option>)}
          </select>
        </div>
      </div>

      {/* TÁBLÁZAT (Maximalizálva a teljes hátralévő területre) */}
      <div className="flex-1 bg-[#121212]/80 backdrop-blur-md rounded-[2rem] shadow-xl border border-white/5 overflow-auto custom-scrollbar relative z-10 w-full flex flex-col">
        <table className="w-full h-full text-left border-collapse min-w-[1100px] flex-1">
          <thead className="bg-[#1a1a1a] sticky top-0 z-30 shadow-[0_1px_0_rgba(255,255,255,0.1)] h-16 shrink-0">
            <tr>
              <th className="p-4 border-b border-r border-white/5 font-bold text-center w-36 sticky left-0 z-40 bg-[#1a1a1a] shadow-[1px_0_0_rgba(255,255,255,0.1)]"><Clock className="w-6 h-6 text-white/30 mx-auto" /></th>
              {days.map(day => <th key={day} className="p-4 border-b border-r border-white/5 text-white font-black text-xl text-center bg-[#1a1a1a]">{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => (
              <tr key={period} className="hover:bg-white/[0.02] transition-colors group">
                <td className="p-4 border-b border-r border-white/5 bg-[#121212] sticky left-0 z-20 shadow-[1px_0_0_rgba(255,255,255,0.1)] group-hover:bg-[#161616] transition-colors h-full">
                   <div className="flex flex-col items-center justify-center text-center h-full">
                      <span className="text-3xl font-black text-white">{period.replace('.','')}</span>
                      <span className="text-xs font-bold text-white/40 mt-1 whitespace-nowrap tracking-wider">{periodTimes[period]}</span>
                   </div>
                </td>
                {days.map(day => {
                   const lesson = currentSchedule[day]?.[period];
                   return (
                     <td key={`${day}-${period}`} className="p-3 border-b border-r border-white/5 align-top w-[18%] h-[12vh] min-h-[120px]">
                        {lesson?.subject ? (
                          <div className={`w-full h-full min-h-[100px] p-4 rounded-xl border flex flex-col justify-between gap-2 transition-all hover:scale-[1.02] hover:shadow-[0_10px_20px_rgba(0,0,0,0.5)] ${getSubjectColor(lesson.subject)}`}>
                            <div className="font-black text-sm md:text-base leading-tight tracking-tight">{lesson.subject}</div>
                            <div className="flex justify-between items-end mt-1 pt-2 border-t border-white/10">
                              {lesson.room && <span className="text-xs font-black opacity-90 tracking-wider">🏠 {lesson.room}</span>}
                              {lesson.teacher && <span className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em] text-right">{viewMode === 'class' ? lesson.teacher : `Oszt: ${lesson.teacher}`}</span>}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full min-h-[100px] rounded-xl flex items-center justify-center bg-white/[0.02]"><span className="text-white/10 font-bold">-</span></div>
                        )}
                     </td>
                   )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}