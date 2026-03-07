'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

type DropdownItem = { label: string; href: string };
type NavItem = { label: string; href?: string; children?: DropdownItem[] };

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Blockchain',
    children: [
      { label: 'Blocks', href: '/blocks' },
      { label: 'Transactions', href: '/txs' },
      { label: 'Accounts', href: '/analytics' },
    ],
  },
  {
    label: 'Tokens',
    children: [
      { label: 'Token List (ERC-20)', href: '/tokens' },
      { label: 'QFC Tokenomics', href: '/token/qfc' },
    ],
  },
  {
    label: 'Contracts',
    children: [
      { label: 'Verified Contracts', href: '/contracts' },
    ],
  },
  { label: 'AI Inference', href: '/inference' },
  {
    label: 'Network',
    children: [
      { label: 'Validators', href: '/network' },
      { label: 'Analytics', href: '/analytics' },
      { label: 'Governance', href: '/governance/models' },
    ],
  },
];

function Dropdown({ item, active }: { item: NavItem; active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${
          active ? 'text-white' : 'text-slate-400 hover:text-white'
        }`}
      >
        {item.label}
        <svg className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && item.children && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-slate-800 bg-slate-950 py-1 shadow-xl">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(item: NavItem): boolean {
    if (item.href) return pathname === item.href;
    return item.children?.some((c) => pathname.startsWith(c.href)) ?? false;
  }

  return (
    <nav className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white">
            Q
          </div>
          <div>
            <span className="text-sm font-semibold text-white">QFC Explorer</span>
            <span className="ml-2 rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400">
              Testnet
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-0.5 md:flex">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <Dropdown key={item.label} item={item} active={isActive(item)} />
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                className={`px-3 py-2 text-sm transition-colors ${
                  isActive(item) ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="p-2 text-slate-400 hover:text-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-800/60 px-4 py-3 md:hidden">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.label} className="py-1">
                <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                  {item.label}
                </p>
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-6 py-2 text-sm text-slate-300 hover:text-white"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm text-slate-300 hover:text-white"
              >
                {item.label}
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  );
}
