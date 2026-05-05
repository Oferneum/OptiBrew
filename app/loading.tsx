import CoffeeCupLoader from '@/components/CoffeeCupLoader';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#050505]">
      <CoffeeCupLoader size={64} />
      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#A1A1AA] animate-pulse">
        Loading
      </p>
    </div>
  );
}
