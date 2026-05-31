'use client';

import { useChat } from '@ai-sdk/react';
import { isTextUIPart } from 'ai';
import { useRef, useEffect, useState } from 'react';

const PHRASES = [
  'Grinding the data…',
  'Tamping the knowledge…',
  'Pulling the perfect answer…',
  'Warming up the cup…',
  'Extracting insights…',
];

function BeanFace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 56" fill="none" className={className}>
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

export default function Chat() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput]       = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isLoading) { setPhraseIdx(0); return; }
    const id = setInterval(() => setPhraseIdx((i) => (i + 1) % PHRASES.length), 1500);
    return () => clearInterval(id);
  }, [isLoading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Message list ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {messages.length === 0 && (
          <div className="text-center py-10 space-y-4">
            <BeanFace className="w-20 h-24 mx-auto" />
            <div className="space-y-1">
              <p className="text-base font-black uppercase tracking-[0.25em] text-[#2C1E16]">Hey, I&apos;m Bean!</p>
              <p className="text-[#7A6858] text-sm">Ask me anything about your coffee.</p>
            </div>
          </div>
        )}

        {messages.map((m) => {
          const text = m.parts.filter(isTextUIPart).map((p) => p.text).join('');
          if (!text) return null;
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && <BeanFace className="w-7 h-9 shrink-0" />}
              <div
                className={`
                  max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                  ${isUser
                    ? 'bg-gradient-to-br from-[#2C1E16] to-[#5D4037] text-white font-semibold rounded-br-sm'
                    : 'glass text-[#2C1E16] rounded-bl-sm'
                  }
                `}
              >
                {text}
              </div>
            </div>
          );
        })}

        {error && (
          <div className="flex items-end gap-2 justify-start">
            <BeanFace className="w-7 h-9 shrink-0" />
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 max-w-[78%]">
              <p className="text-sm text-red-700 font-medium">
                Sorry, I&apos;m having trouble connecting right now. Please try again in a moment.
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
            <BeanFace className="w-8 h-10 shrink-0 bean-dance" />
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
              <p key={phraseIdx} className="text-sm text-[#7A6858] font-medium italic phrase-in">
                {PHRASES[phraseIdx]}
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="px-4 pb-6 pt-2 flex gap-2 items-end"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Bean about your espresso…"
          disabled={isLoading}
          inputMode="text"
          style={{ fontSize: '16px' }}
          className="
            flex-1 glass-input rounded-2xl px-4 py-3
            focus:outline-none disabled:opacity-50 min-h-[44px]
          "
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="
            btn-crema min-h-[44px] px-5 rounded-2xl text-sm uppercase
            tracking-wider disabled:opacity-40 disabled:scale-100
          "
        >
          Send
        </button>
      </form>
    </div>
  );
}
