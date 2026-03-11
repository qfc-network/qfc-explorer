'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
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
      { labelKey: 'nav.pendingTxs', href: '/txpool' },
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
      { labelKey: 'nav.batchQuery', href: '/batch' },
      { labelKey: 'nav.apiDocs', href: '/api-docs' },
    ],
  },
  {
    labelKey: 'nav.aiInference',
    children: [
      { labelKey: 'nav.inferenceOverview', href: '/inference' },
      { labelKey: 'nav.inferenceTasks', href: '/inference/tasks' },
      { labelKey: 'nav.inferenceAnalytics', href: '/inference/analytics' },
    ],
  },
  {
    labelKey: 'nav.agentsMenu',
    children: [
      { labelKey: 'nav.agentList', href: '/agents' },
      { labelKey: 'nav.sessionKeys', href: '/agents/sessions' },
      { labelKey: 'nav.riskDashboard', href: '/agents/risk' },
    ],
  },
  {
    labelKey: 'nav.network',
    children: [
      { labelKey: 'nav.validators', href: '/validators' },
      { labelKey: 'nav.miners', href: '/miners' },
      { labelKey: 'nav.networkStatus', href: '/network' },
      { labelKey: 'nav.analytics', href: '/analytics' },
      { labelKey: 'nav.leaderboard', href: '/leaderboard' },
      { labelKey: 'nav.richList', href: '/richlist' },
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
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${
          active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        {t(item.labelKey)}
        <svg aria-hidden="true" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && item.children && (
        <div role="menu" className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 py-1 shadow-xl">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              role="menuitem"
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

/** Mobile accordion section for nav items with children */
function MobileAccordion({
  item,
  active,
  t,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  t: (key: TranslationKey) => string;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(active);

  return (
    <div className="border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className={`flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium transition-colors ${
          active ? 'text-cyan-500' : 'text-slate-700 dark:text-slate-200'
        }`}
      >
        {t(item.labelKey)}
        <svg
          aria-hidden="true"
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          maxHeight: expanded ? `${(item.children?.length ?? 0) * 48 + 8}px` : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="pb-2">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onNavigate}
              className="block px-8 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:bg-slate-100 dark:active:bg-slate-800/40 transition-colors"
            >
              {t(child.labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  function isActive(item: NavItem): boolean {
    if (item.href) return pathname === item.href;
    return item.children?.some((c) => pathname.startsWith(c.href)) ?? false;
  }

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileOpen) {
        closeMobile();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen, closeMobile]);

  // Close on route change (pathname change)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <nav aria-label="Main navigation" className="border-b border-slate-200 bg-white/80 dark:border-slate-800/60 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-0 min-h-[56px]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 py-3 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-slate-900 dark:text-white">
            Q
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">QFC Explorer</span>
            <span className="ml-2 hidden sm:inline rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
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

        {/* Mobile hamburger button (Etherscan-style: icon + Menu label) */}
        <button
          className={`relative z-[60] flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 dark:border-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white md:hidden ${mobileOpen ? 'opacity-0 pointer-events-none' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={t('nav.menu')}
        >
          <div className="flex h-4 w-4 flex-col items-center justify-center">
            <span className="block h-0.5 w-4 rounded-full bg-current" />
            <span className="mt-0.5 block h-0.5 w-4 rounded-full bg-current" />
            <span className="mt-0.5 block h-0.5 w-4 rounded-full bg-current" />
          </div>
          <span className="text-xs font-medium">{t('nav.menu')}</span>
        </button>
      </div>

      {/* Mobile overlay backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* Mobile slide-in panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-full flex-col bg-white dark:bg-slate-950 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 px-4 py-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{t('nav.menu')}</span>
          <button
            onClick={closeMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable nav items */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <MobileAccordion
                key={item.labelKey}
                item={item}
                active={isActive(item)}
                t={t}
                onNavigate={closeMobile}
              />
            ) : (
              <Link
                key={item.labelKey}
                href={item.href!}
                onClick={closeMobile}
                className={`block border-b border-slate-100 dark:border-slate-800/60 px-4 py-3.5 text-sm font-medium transition-colors ${
                  isActive(item)
                    ? 'text-cyan-500'
                    : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
                } active:bg-slate-100 dark:active:bg-slate-800/40`}
              >
                {t(item.labelKey)}
              </Link>
            )
          )}
        </div>

        {/* Panel footer: theme toggle + language */}
        <div className="border-t border-slate-200 dark:border-slate-800/60 px-4 py-3 flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
