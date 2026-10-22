import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Báthory Porta",
  description: "Iskolai Kiosk Információs Rendszer Vezérlőpultja",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="hu"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#050505] text-white">
        {children}
        
        {/* Globális Toast értesítő */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            className: 'bg-[#1a1a1a] text-white border border-[#333] shadow-2xl rounded-xl',
            duration: 4000,
          }} 
        />
      </body>
    </html>
  );
}