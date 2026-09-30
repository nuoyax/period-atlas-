import { SER } from '../data/catalogue.ts';
import { phaseOf } from './phases.ts';

/**
 * 起点取「离各曲线自己的峰值最近」的一天：让月相停在满月、季节停在夏至、
 * 周末停在周六……而它们又确实共享同一个真实日期（不是各调各的）。
 *
 * 这里有一处**对原版的修正**，必须记下来：
 *
 * 原版 `PU` 是个混合字面量——27 个元素里 13 个是函数，另外 14 个是 `"周期": number`。
 * 但对象字面量里 `"周期"` 这个键重复出现 14 次，后面的覆盖前面的，
 * 结果 `PU["周期"]` 只剩下最后写入的那个数（11）。于是凡是查得到周期键的曲线，
 * `phaseOf` 算出的都是 `ts` 或 `ts/11`，再经 `frac()` 得到的是整天数的小数尾——
 * **与曲线自己的周期完全无关**。真正受影响的是 12 条：工作日作息、月相、日月合朔、
 * 全日潮、潮差、月出时刻、月球近远地、太阳高度角、白昼长度、月经周期、日照总量、历年长度。
 * 它们的相位变成了「天数的尾数」，永远不会停在满月或夏至，
 * 于是 `PEAK_PRIO` 里加的权重（3+3+3+2+2+2=15）实际上是给错的曲线打的，
 * 真正的分数上下限只有 ±15，最大值落在 days=0 —— 这也是原版开场时
 * 12 个圆点坐标是 NaN、11 个读数是 NaN 的原因。
 *
 * 拆成 PU_PHASE / PU_PERIOD 后（见 model/phases.ts），周期不再互相覆盖，
 * 分数回到 ±34，最大值落在 days=192，也就是原版**本想要**的那一天：月相近满月、
 * 季节近夏至、星期停在周六。
 */
const PEAK_PRIO: Record<string, number> = {
  月相: 3, 太阳高度角: 3, 白昼长度: 3, 日月合朔: 2, 工作日作息: 2, 历年长度: 2,
};

function scanBestDay(): number {
  let bestDay = 0;
  let bestScore = -1;
  for (let d = 0; d < 366; d += 0.5) {
    let sc = 0;
    SER.forEach((s) => {
      if (s.lv === 'day') return;
      const u = phaseOf(s, d, { ind: 'life' });
      if (u === null) return;                       // 被行业筛掉的曲线不参与选点
      const near = 1 - Math.min(1, Math.abs(u - 0.5) / 0.25);
      sc += near * (PEAK_PRIO[s.name] || 1);
    });
    if (sc > bestScore) { bestScore = sc; bestDay = d; }
  }
  return bestDay;
}

export const BEST_DAY = scanBestDay();
