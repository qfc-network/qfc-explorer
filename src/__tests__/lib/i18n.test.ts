import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectLocale, getSavedLocale, saveLocale, defaultLocale, locales, localeList } from '@/lib/i18n';

describe('i18n constants', () => {
  it('has "en" as default locale', () => {
    expect(defaultLocale).toBe('en');
  });

  it('has 4 supported locales', () => {
    expect(Object.keys(locales)).toHaveLength(4);
  });

  it('includes en, zh, ja, ko', () => {
    expect(locales).toHaveProperty('en');
    expect(locales).toHaveProperty('zh');
    expect(locales).toHaveProperty('ja');
    expect(locales).toHaveProperty('ko');
  });

  it('localeList is an array of tuples', () => {
    expect(localeList).toHaveLength(4);
    expect(localeList[0]).toHaveLength(2);
  });
});

describe('getSavedLocale', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no locale saved', () => {
    expect(getSavedLocale()).toBeNull();
  });

  it('returns saved locale from localStorage', () => {
    localStorage.setItem('qfc-locale', 'zh');
    expect(getSavedLocale()).toBe('zh');
  });

  it('returns null for invalid saved locale', () => {
    localStorage.setItem('qfc-locale', 'fr');
    expect(getSavedLocale()).toBeNull();
  });
});

describe('saveLocale', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves locale to localStorage', () => {
    saveLocale('ja');
    expect(localStorage.getItem('qfc-locale')).toBe('ja');
  });
});

describe('detectLocale', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns saved locale if available', () => {
    localStorage.setItem('qfc-locale', 'ko');
    expect(detectLocale()).toBe('ko');
  });

  it('detects Chinese from browser language', () => {
    Object.defineProperty(navigator, 'language', { value: 'zh-CN', configurable: true });
    expect(detectLocale()).toBe('zh');
  });

  it('detects Japanese from browser language', () => {
    Object.defineProperty(navigator, 'language', { value: 'ja-JP', configurable: true });
    expect(detectLocale()).toBe('ja');
  });

  it('detects Korean from browser language', () => {
    Object.defineProperty(navigator, 'language', { value: 'ko-KR', configurable: true });
    expect(detectLocale()).toBe('ko');
  });

  it('defaults to English for unknown languages', () => {
    Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true });
    expect(detectLocale()).toBe('en');
  });

  it('defaults to English for English browser', () => {
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
    expect(detectLocale()).toBe('en');
  });
});
