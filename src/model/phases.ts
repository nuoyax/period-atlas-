import type { SeriesDef } from '../data/series.ts';
import type { IndustryId } from '../data/industries.ts';
import {
  ASTRO, SYNODIC, SIDEREAL, ANOMALISTIC, SAROS_FAMILY, TROPICAL,
} from '../data/astro.ts';
import { frac } from './math.ts';

/**
 * 当前时间（2020-01-01 起的天数，含小数）→ 该曲线的相位进度。
 *
 * 只有「不能从曲线自身推出」的长周期才需要在这里登记：
 * 日尺度曲线直接取当天的钟点（frac(days)），其余由 PU 给出。
 */
export const PU: Record<string, { at: (d: number) => number; period: number }> = {
  '月相': { at: (d) => ASTRO.moon + d, period: SYNODIC },
  '日月合朔': { at: (d) => ASTRO.moon + d, period: SYNODIC },
  '全日潮': { at: (d) => ASTRO.tide + d, period: SAROS_FAMILY },
  '潮差': { at: (d) => ASTRO.tide + d, period: SAROS_FAMILY },
  '月出时刻': { at: (d) => ASTRO.moonrise + d, period: SIDEREAL },
  '月球近远地': { at: (d) => ASTRO.perigee + d, period: ANOMALISTIC },
  '太阳高度角': { at: (d) => ASTRO.season + d, period: TROPICAL },
  '白昼长度': { at: (d) => ASTRO.season + d, period: TROPICAL },
  '日照总量': { at: (d) => ASTRO.season + d, period: TROPICAL },
  '月经周期': { at: (d) => ASTRO.menses + d, period: 28 },
  '工作日作息': { at: (d) => ASTRO.work + d, period: 7 },
  '历年长度': { at: (d) => d, period: 4 },

  // 新增长周期曲线：锚点仍取「days = 0 时各周期所处的相位」
  '太阳自转': { at: (d) => ASTRO.sunrot + d, period: 27.275 },
  '太阳活动周': { at: (d) => ASTRO.cycle + d, period: 11 },
  '沙罗周期': { at: (d) => ASTRO.saros + d, period: 18.03 },
  '海水表层温度': { at: (d) => ASTRO.sst + d, period: TROPICAL },
  '浮游生产力': { at: (d) => ASTRO.sst + d, period: TROPICAL },
  '呼吸道传染病季': { at: (d) => ASTRO.flu + d, period: TROPICAL },
  '供暖季负荷': { at: (d) => ASTRO.sst + d, period: TROPICAL },
  '车辆年检': { at: (d) => ASTRO.inspect + d, period: 1 },
  '库存周期': { at: (d) => ASTRO.inven + d, period: 3.5 },
  '奥运与大型赛事': { at: (d) => ASTRO.olym + d, period: 4 },

  // 火箭与航天器新增曲线
  '液氧贮箱蒸发': { at: (d) => d, period: SYNODIC },
  '同步轨道进动': { at: (d) => ASTRO.season + d, period: TROPICAL },
  '发射排期': { at: (d) => ASTRO.season + d, period: TROPICAL },
  '火星转移窗口': { at: (d) => ASTRO.mars + d, period: 780 },
  '单粒子翻转': { at: (d) => ASTRO.cycle + d, period: 11 },
};

/**
 * 供 phaseOf 判断「这条曲线是否在当前行业筛选下」。
 *
 * 之所以做成可注入而不是直接读某个全局：相位推进与筛选是两件事，
 * 把依赖注入进来，这个模块就能被单独测试，也不会在 React 之外偷偷持有状态。
 */
export interface FilterRef {
  /** 当前行业；"all" 表示不过滤 */
  ind: IndustryId | 'all';
}

/**
 * 相位。被行业下拉框筛掉的曲线返回 null —— 这样它在隐藏期间相位冻结，
 * 切回来时仍停在切走的那一刻，而不是「跳过」了那段时间。
 */
export function phaseOf(s: SeriesDef, days: number, filter: FilterRef): number | null {
  if (s.ind !== filter.ind && filter.ind !== 'all') return null;
  if (s.lv === 'day') return frac(days);
  const g = PU[s.name];
  return g ? frac(g.at(days) / g.period) : 0;
}
