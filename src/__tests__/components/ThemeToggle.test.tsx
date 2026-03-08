import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '@/components/ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    // Default: mock matchMedia to prefer dark
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it('renders without crashing', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('has appropriate aria-label', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    // In dark mode (default), should show "Switch to light mode"
    expect(button).toHaveAttribute('aria-label');
  });

  it('contains an SVG icon', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('toggles on click and updates aria-label', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    const initialLabel = button.getAttribute('aria-label');
    fireEvent.click(button);
    const newLabel = button.getAttribute('aria-label');
    expect(newLabel).not.toBe(initialLabel);
  });

  it('saves theme preference to localStorage on toggle', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const saved = localStorage.getItem('qfc-theme');
    expect(saved).toBeTruthy();
  });

  it('respects stored light preference', () => {
    localStorage.setItem('qfc-theme', 'light');
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');
  });

  it('respects stored dark preference', () => {
    localStorage.setItem('qfc-theme', 'dark');
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('Switch to light mode');
  });
});
