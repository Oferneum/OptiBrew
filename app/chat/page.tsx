import Chat from '@/components/Chat';

function BeanFaceSmall() {
  return (
    <svg viewBox="0 0 44 56" fill="none" className="w-8 h-10">
      <ellipse cx="22" cy="29" rx="16" ry="21" fill="#5D4037" />
      <ellipse cx="16" cy="18" rx="5" ry="8" fill="#7B5B4A" opacity="0.45" transform="rotate(-18 16 18)" />
      <path d="M22 8 C15 22 15 36 22 50" stroke="#3C2A21" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="27" r="3"   fill="#FAF3E6" />
      <circle cx="28" cy="27" r="3"   fill="#FAF3E6" />
      <circle cx="17" cy="28" r="1.5" fill="#2C1E16" />
      <circle cx="29" cy="28" r="1.5" fill="#2C1E16" />
      <circle cx="17.8" cy="27.2" r="0.6" fill="white" opacity="0.8" />
      <circle cx="29.8" cy="27.2" r="0.6" fill="white" opacity="0.8" />
      <path d="M15 35 Q22 42 29 35" stroke="#FAF3E6" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function ChatPage() {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <header className="px-4 pt-8 pb-4">
        <div className="w-10 h-0.5 bg-gradient-to-r from-[#5D4037] to-[#8D6E63] mb-4 rounded-full" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#2C1E16] flex items-center justify-center shrink-0">
            <BeanFaceSmall />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#2C1E16] leading-none">
              Bean
            </h1>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#7A6858] mt-0.5">
              Your personal coffee assistant
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        <Chat />
      </div>
    </div>
  );
}
