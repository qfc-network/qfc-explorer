'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ShortcutsModal from '@/components/ShortcutsModal';

const CHORD_TIMEOUT = 1000;

const CHORD_MAP: Record<string, string> = {
  b: '/blocks',
  t: '/txs',
  k: '/tokens',
  c: '/contracts',
  a: '/analytics',
  n: '/network',
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const pendingChord = useRef<string | null>(null);
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearChord = useCallback(() => {
    pendingChord.current = null;
    if (chordTimer.current) {
      clearTimeout(chordTimer.current);
      chordTimer.current = null;
    }
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Never trigger shortcuts in editable fields
      if (isEditableTarget(e.target)) return;

      // Don't trigger on modifier key combos (Ctrl, Alt, Meta)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key;

      // Handle second key of a chord
      if (pendingChord.current === 'g') {
        clearChord();
        const route = CHORD_MAP[key];
        if (route) {
          e.preventDefault();
          router.push(route);
          return;
        }
        // If no match, fall through to normal handling
      }

      // Escape: close modal/menu, blur focused input
      if (key === 'Escape') {
        if (modalOpen) {
          setModalOpen(false);
          return;
        }
        const active = document.activeElement;
        if (active instanceof HTMLElement) {
          active.blur();
        }
        return;
      }

      // Don't process other shortcuts while modal is open
      if (modalOpen) return;

      // "/" - focus search bar
      if (key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // "?" - toggle shortcuts help modal
      if (key === '?') {
        e.preventDefault();
        setModalOpen((prev) => !prev);
        return;
      }

      // "g" - start chord
      if (key === 'g') {
        pendingChord.current = 'g';
        chordTimer.current = setTimeout(() => {
          pendingChord.current = null;
          chordTimer.current = null;
        }, CHORD_TIMEOUT);
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearChord();
    };
  }, [router, modalOpen, clearChord]);

  return <ShortcutsModal open={modalOpen} onClose={closeModal} />;
}
