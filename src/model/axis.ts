import type { SeriesDef } from '../data/series.ts';
import { fmt } from './math.ts';

/** 小时数 → "HH:MM" 由 math.ts 提供，这里只剩与「曲线位置」有关的换算 */

/** 0–1 高度 → 活跃 / 过渡 / 低谷 */
export const stateOf = (a: number): string => (a >= 0.7 ? '活跃' : (a <= 0.3 ? '低谷' : '过渡'));

export const DOW = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const dayName = (d: number) => DOW[((d % 7) + 7) % 7];
export const monthName = (m: number) => m + ' 月';

/**
 * 时间轴位置 → 该尺度上的人类说法（用位置而不是相位，避免首尾两天重复）。
 *
 * days 只为「月·年」这一支算公历年份；其余分支与它无关。
 */
export function lvSpanLabel(s: SeriesDef, u: number, days: number): string {
  if (s.lv === 'day') return fmt(u * 24);
  if (s.lv === 'week') return dayName(Math.min(6, Math.floor(u * 7)));
  if (s.span < 32) return '第 ' + (u * s.span + 1).toFixed(0) + ' 天';
  const y = 2020 + Math.floor(days / 365.2422);
  const m = (Math.floor(u * 12) % 12) + 1;
  return monthName(m) + ' · ' + y + ' 年';
}
