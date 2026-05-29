import Chat from '@/components/Chat';

export default function ChatPage() {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <header className="px-4 pt-8 pb-4">
        <div className="w-10 h-0.5 bg-gradient-to-r from-[#FF4500] to-[#FFC107] mb-2 rounded-full" />
        <h1 className="text-2xl font-black uppercase tracking-tight text-[#2C1E16]">
          BrewAgent
        </h1>
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#7A6858] mt-0.5">
          Ask anything about your coffee
        </p>
      </header>

      <div className="flex-1 flex flex-col">
        <Chat />
      </div>
    </div>
  );
}
