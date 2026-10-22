"use client";

import { useIdle } from "@/hooks/useIdle";
import { AnimatePresence, motion } from "framer-motion";
import IdleScreen from "@/components/tv/IdleScreen";
import InteractiveDashboard from "@/components/tv/InteractiveDashboard";

export default function TvPage() {
  const isIdle = useIdle(15000);

  return (
    <main className="w-screen h-screen bg-[#050505] text-white overflow-hidden relative">
      <AnimatePresence mode="wait">
        {isIdle ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <IdleScreen />
          </motion.div>
        ) : (
          <motion.div
            key="interactive"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <InteractiveDashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}