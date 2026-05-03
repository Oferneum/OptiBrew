import React from 'react';
import { Target } from 'lucide-react';

interface RecommendationCardProps {
  rec: {
    diagnosis: string;
  };
}

export default function RecommendationCard({ rec }: RecommendationCardProps) {
  if (!rec || !rec.diagnosis) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E5E1DA] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      {/* אלמנט עיצובי עדין ברקע */}
      <div className="absolute -right-4 -top-4 text-[#F3F1ED] opacity-50">
        <Target size={120} strokeWidth={1} />
      </div>

      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-2">
          <div className="bg-[#8A7B72] p-1 rounded-md">
            <Target size={14} className="text-white" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A7B72]">
            Dialed AI
          </span>
        </div>
        
        <p className="text-[17px] text-[#3E362E] leading-relaxed font-medium">
          {rec.diagnosis}
        </p>
      </div>
    </div>
  );
}