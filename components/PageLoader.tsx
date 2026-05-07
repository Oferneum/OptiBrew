import CoffeeCupLoader from './CoffeeCupLoader';

export default function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <CoffeeCupLoader size={52} />
      <p className="text-[#7A6858] text-[10px] font-bold uppercase tracking-[0.2em]">Loading…</p>
    </div>
  );
}
