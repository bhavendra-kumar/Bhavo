import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-6 border-t border-slate-200" style={{ background: "#f8fafc" }}>
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
          <span>Made with</span>
          <Heart size={14} className="text-rose-500 fill-rose-500" />
          <span>by Bhavo</span>
        </div>
        
        <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
          <Link href="/terms" className="hover:text-teal-600 transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-teal-600 transition-colors">Privacy Policy</Link>
          <Link href="/help" className="hover:text-teal-600 transition-colors">Help Center</Link>
        </div>
      </div>
    </footer>
  );
}
