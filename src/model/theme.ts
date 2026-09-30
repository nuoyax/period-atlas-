import { useEffect, useState } from 'react';

const KEY = 'cycle-theme';

/** 主题：跟随系统，除非用户点过切换；选择记在 localStorage，键名与原版一致。 */
export function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof document === 'undefined') return false;
    const stored = safeGet();
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    // 只在用户显式选过时才写 data-theme；没选过就交给 @media 走系统
    const stored = safeGet();
    if (stored) root.setAttribute('data-theme', stored);
    else root.removeAttribute('data-theme');
  }, [dark]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    safeSet(next ? 'dark' : 'light');
  };
  return { dark, toggle };
}

function safeGet(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
function safeSet(v: string) {
  try { localStorage.setItem(KEY, v); } catch { /* 隐私模式下忽略 */ }
}
