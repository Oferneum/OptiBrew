'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function BeanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
      <ellipse cx="12" cy="12" rx="8" ry="10" transform="rotate(-20 12 12)" />
      <path d="M12 3c0 6-5 9-5 9s5 3 5 9" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="7.5" cy="15" r="1.5" fill="currentColor" strokeWidth="0" />
      <circle cx="12" cy="9" r="1.5" fill="currentColor" strokeWidth="0" />
      <circle cx="16.5" cy="13" r="1.5" fill="currentColor" strokeWidth="0" />
      <path d="M3 20h18" />
    </svg>
  );
}

const links = [
  { href: '/',          label: 'Home',    Icon: HomeIcon  },
  { href: '/shots/new', label: 'Log',     Icon: PlusIcon  },
  { href: '/shots',     label: 'History', Icon: ClockIcon },
  { href: '/beans',     label: 'Beans',   Icon: BeanIcon  },
  { href: '/analytics', label: 'Charts',  Icon: ChartIcon },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 px-4">
      <div className="max-w-lg mx-auto glass-nav rounded-2xl flex" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        {links.map(({ href, label, Icon }) => {
          const active =
            href === '/'          ? path === '/' :
            href === '/shots'     ? path === '/shots' :
            href === '/analytics' ? path.startsWith('/analytics') :
            path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center pt-3 pb-2 gap-1 text-[10px] font-medium transition-colors duration-150 ${
                active ? 'text-crema' : 'text-white/35 hover:text-white'
              }`}
            >
              <Icon />
              <span className="tracking-wide">{label}</span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-crema" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
