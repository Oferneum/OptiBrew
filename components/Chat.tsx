'use client';

import { useChat } from '@ai-sdk/react';
import { isTextUIPart } from 'ai';
import { useRef, useEffect, useState } from 'react';

export default function Chat() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto">

      {/* ── Message list ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#A1A1AA]">
              BrewAgent
            </p>
            <p className="text-white/40 text-sm">
              Ask me anything about your brew.
            </p>
          </div>
        )}

        {messages.map((m) => {
          const text = m.parts.filter(isTextUIPart).map((p) => p.text).join('');
          if (!text) return null;
          return (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                  ${m.role === 'user'
                    ? 'bg-gradient-to-br from-[#FF4500] to-[#FFC107] text-black font-semibold rounded-br-sm'
                    : 'glass text-white rounded-bl-sm'
                  }
                `}
              >
                {text}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ──────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="px-4 pb-6 pt-2 flex gap-2 items-end"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your espresso…"
          disabled={isLoading}
          inputMode="text"
          style={{ fontSize: '16px' }}
          className="
            flex-1 bg-white/5 border border-white/10 rounded-2xl
            px-4 py-3 text-white placeholder:text-white/30
            focus:outline-none focus:border-[#FF4500]/50
            disabled:opacity-50 min-h-[44px]
          "
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="
            btn-crema min-h-[44px] px-5 rounded-2xl font-black text-sm uppercase
            tracking-wider disabled:opacity-40 disabled:scale-100
          "
        >
          Send
        </button>
      </form>
    </div>
  );
}
