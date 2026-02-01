'use client';

import { useState } from 'react';

type CopyButtonProps = {
  value: string;
  label?: string;
};

export default function CopyButton({ value, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setError(false);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full border border-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300"
    >
      {copied ? 'Copied' : error ? 'Failed' : label}
    </button>
  );
}
