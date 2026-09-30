import { SER } from '../data/catalogue.ts';
import { phaseOf } from './phases.ts';
import { SYNODIC, TROPICAL } from '../data/astro.ts';
import { isLeap } from './math.ts';
import { dayName, monthName } from './axis.ts';

/**
 * 顶部的长尺度读数：一天之外四层各报一个「现在到哪了」。
 *
 * 与原版一致：只有在该曲线确实在当前行业筛选下（phaseOf 非 null）才报。
 * 与原版的差别是这里把行业当参数传进来，而不是去读一个全局 state——
 * 这个模块因此可以单独测。
 */
export function longReadout(days: number, ind: string = 'life'): string {
  const parts: string[] = [];
  const u = (nm: string) => {
    const s = SER.find((x) => x.name === nm);
    return s ? phaseOf(s, days, { ind: ind as never }) : null;
  };

  const wk = u('工作日作息');
  if (wk !== null) parts.push('星期 ' + dayName(Math.floor(wk * 7)));

  const mo = u('月相');
  if (mo !== null) parts.push('月相 第 ' + (mo * SYNODIC + 1).toFixed(0) + ' 天');

  const se = u('太阳高度角');
  if (se !== null) {
    const dm = (Math.floor(se * 12) % 12 + 12) % 12 + 1;
    parts.push('季节 ' + monthName(dm));
  }

  const y = 2020 + Math.floor(days / TROPICAL);
  parts.push(y + ' 年 · ' + (isLeap(y) ? '闰年 366 天' : '平年 365 天'));
  return parts.join('　·　');
}
