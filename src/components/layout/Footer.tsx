// University of Ruhuna - Faculty of Agriculture
// Platform Footer: Curriculum Details, Attribution & Disclaimer

import React from 'react';
import { BookOpen, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';
import { useGradeStore } from '../../store/useGradeStore';

export const Footer: React.FC = () => {
  const { setActiveTab, setShowOnboarding } = useGradeStore();

  return (
    <footer className="mt-auto mb-16 md:mb-0 border-t border-neutral-200 bg-white/80 backdrop-blur-xs text-neutral-600 transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Brand & Creator Attribution */}
          <div className="md:col-span-4 space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-lg">🌿</span>
              <span className="font-black text-neutral-900 text-sm tracking-tight">
                Ruhuna Agri GPA
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                UoR
              </span>
            </div>
            <div className="text-xs text-neutral-700 font-medium">
              Powered by{' '}
              <span className="font-extrabold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                Gelitha Jayawickrama (47th Batch)
              </span>
            </div>
          </div>

          {/* Curriculum Handbook Reference */}
          <div className="md:col-span-4 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 shadow-2xs">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Curriculum: Undergraduate Handbook 2023/24</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Faculty of Agriculture, University of Ruhuna • ARMT, ABM &amp; GT Degrees
            </p>
          </div>

          {/* Fun Side-Project Disclaimer & Quick Actions */}
          <div className="md:col-span-4 space-y-1 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-end gap-1.5 text-[11px] font-bold text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Not responsible for errors — just a side project for fun</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Always verify official grades &amp; degree criteria with Faculty Dean's Office.
            </p>
            <div className="pt-1 flex items-center justify-center md:justify-end gap-3 text-xs">
              <button
                onClick={() => setActiveTab('requirements')}
                className="text-neutral-500 hover:text-emerald-700 font-semibold underline underline-offset-2 transition"
              >
                Degree Regulations
              </button>
              <span>•</span>
              <button
                onClick={() => setShowOnboarding(true)}
                className="text-neutral-500 hover:text-emerald-700 font-semibold underline underline-offset-2 transition"
              >
                Onboarding Guide
              </button>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
