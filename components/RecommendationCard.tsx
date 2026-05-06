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
    <div className="relative overflow-hidden rounded-2xl glass p-6">
      <div className="absolute -right-4 -top-4 text-[#C8B49A] opacity-40">
        <Target size={120} strokeWidth={1} />
      </div>

      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-2">
          <div className="bg-[#7A6858] p-1 rounded-md">
            <Target size={14} className="text-[#FFFBF4]" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A6858]">
            Dialed AI
          </span>
        </div>

        <p className="text-[17px] text-[#2C1E16] leading-relaxed font-medium">
          {rec.diagnosis}
        </p>
      </div>
    </div>
  );
}
