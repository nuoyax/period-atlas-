/**
 * 纯函数层：不 import 任何数据模块，所以 SERIES 里的闭包可以安全地引用这里的函数，
 * 不会绕回数据层形成循环。
 */

/** 环形取模：结果始终落在 [0, m) */
export const wrap = (v: number, m: number) => { const r = v % m; return r < 0 ? r + m : r; };

export const frac = (x: number) => x - Math.floor(x);

/** 置闰：同为 4 的倍数，但整百年要能被 400 整除才是闰年 */
export const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** 小时数 → "HH:MM"（跨日自动取模） */
export const fmt = (t: number): string => {
  const m = Math.round(wrap(t, 24) * 60) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
};

const signedDist = (t: number, c: number) => {
  const d = wrap(t - c, 24);
  return d > 12 ? d - 24 : d;
};

export interface Window { c: number; h: number }

/**
 * 节律模型：一个 24h 周期上的加权窗。
 * activity(t) = Σ 0.5·(1+cos(π·|t-c|/h))，|t-c|<h；周期边界用环形距离。
 */
export function winActivity(t: number, w: Window) {
  const p = Math.abs(signedDist(t, w.c)) / w.h;
  return p >= 1 ? 0 : 0.5 * (1 + Math.cos(Math.PI * p));
}

export function activity(t: number, windows: Window[]) {
  let a = 0;
  for (let i = 0; i < windows.length; i++) a += winActivity(t, windows[i]);
  return Math.min(1, a);
}

/**
 * 末端平台窗（用于星期/排卵这类「一段时间高、其余低」的形状）。
 *
 * x 与 c/h/ramp 必须同单位，mod 是环长：月/季/年曲线传 1（相位），
 * 星期传 7（天），火星窗口传 780（天）。
 *
 * 早先忽略了 mod，星期与火星的调用把「天」当成「相位」传进来，环长仍按 1 取模，
 * 于是 |wrap(d-6,1)| 恒为 0，整条曲线退化成一根水平线。
 */
export function smoothPulse(x: number, c: number, h: number, ramp: number, mod?: number) {
  const d = Math.abs(wrap(x - c, mod || 1));
  const flat = h - ramp;
  if (flat > 0 && d <= flat) return 1;
  if (d >= h) return 0;
  return 0.5 * (1 + Math.cos(Math.PI * (d - Math.max(flat, 0)) / ramp));
}
