"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useStore } from "@/store/useStore";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser, setUserData } = useStore(); 
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data.name || "Felhasználó", data.permissions || {
              manageNews: false, manageTimetable: false, manageSettings: false, manageUsers: false
            });
          } else {
            setUserData(null, null);
          }
        } catch (error) {
          console.error("Hiba a jogosultság lekérésekor:", error);
        }
      } else {
        setUser(null);
        setUserData(null, null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setUserData]);

  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== "/admin/login") {
      router.replace("/admin/login");
    } else if (user && pathname === "/admin/login") {
      router.replace("/admin");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <div className="hidden">{children}</div>
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-[#050505]">{children}</div>;
  }

  return (
    // JAVÍTÁS: Reszponzív flex struktúra (Mobilon oszlop, gépen sor)
    <div className="h-[100dvh] bg-[#050505] text-white flex flex-col md:flex-row font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}