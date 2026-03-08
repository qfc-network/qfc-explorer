'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { useTranslation } from '@/components/LocaleProvider';
import type { TranslationKey } from '@/lib/translations';

type DropdownItem = { labelKey: TranslationKey; href: string };
type NavItem = { labelKey: TranslationKey; href?: string; children?: DropdownItem[] };

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.home', href: '/' },
  {
    labelKey: 'nav.blockchain',
    children: [
      { labelKey: 'nav.blocks', href: '/blocks' },
      { labelKey: 'nav.transactions', href: '/txs' },
      { labelKey: 'nav.pendingTxs', href: '/pending' },
      { labelKey: 'nav.gasTracker', href: '/gas-tracker' },
    ],
  },
  {
    labelKey: 'nav.tokens',
    children: [
      { labelKey: 'nav.tokenList', href: '/tokens' },
      { labelKey: 'nav.tokenTransfers', href: '/token-transfers' },
      { labelKey: 'nav.approvalChecker', href: '/approvals' },
      { labelKey: 'nav.tokenomics', href: '/token/qfc' },
    ],
  },
  {
    labelKey: 'nav.contracts',
    children: [
      { labelKey: 'nav.verifiedContracts', href: '/contracts' },
      { labelKey: 'nav.abiTools', href: '/tools' },
    ],
  },
  { labelKey: 'nav.aiInference', href: '/inference' },
  {
    labelKey: 'nav.network',
    children: [
      { labelKey: 'nav.validators', href: '/network' },
      { labelKey: 'nav.analytics', href: '/analytics' },
      { labelKey: 'nav.leaderboard', href: '/leaderboard' },
      { labelKey: 'nav.governance', href: '/governance/models' },
    ],
  },
];

function Dropdown({ item, active, t }: { item: NavItem; active: boolean; t: (key: TranslationKey) => string }) {
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
          active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        {t(item.labelKey)}
        <svg className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && item.children && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 py-1 shadow-xl">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white transition-colors"
            >
              {t(child.labelKey)}
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
  const { t } = useTranslation();

  function isActive(item: NavItem): boolean {
    if (item.href) return pathname === item.href;
    return item.children?.some((c) => pathname.startsWith(c.href)) ?? false;
  }

  return (
    <nav className="border-b border-slate-200 bg-white/80 dark:border-slate-800/60 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white">
            Q
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">QFC Explorer</span>
            <span className="ml-2 rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
              Testnet
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-0.5 md:flex">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <Dropdown key={item.labelKey} item={item} active={isActive(item)} t={t} />
            ) : (
              <Link
                key={item.labelKey}
                href={item.href!}
                className={`px-3 py-2 text-sm transition-colors ${
                  isActive(item) ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t(item.labelKey)}
              </Link>
            )
          )}
          <LocaleSwitcher />
          <ThemeToggle />
        </div>

        {/* Mobile hamburger + theme + locale */}
        <div className="flex items-center gap-1 md:hidden">
          <LocaleSwitcher />
          <ThemeToggle />
          <button
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 dark:border-slate-800/60 px-4 py-3 md:hidden">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div key={item.labelKey} className="py-1">
                <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                  {t(item.labelKey)}
                </p>
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-6 py-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:bg-slate-100 dark:active:bg-slate-800/40"
                  >
                    {t(child.labelKey)}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.labelKey}
                href={item.href!}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:bg-slate-100 dark:active:bg-slate-800/40"
              >
                {t(item.labelKey)}
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  );
}
