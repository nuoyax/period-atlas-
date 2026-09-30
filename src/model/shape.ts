import type { SeriesDef } from '../data/series.ts';
import { wrap, activity } from './math.ts';

/**
 * 统一强度：日周期走窗口模型，其余尺度走给定函数。
 *
 * 形态来自这条曲线自己的定义，与「当前行业/尺度」无关——
 * 筛选只影响相位是否推进，不影响形状本身。
 */
export function shapeAt(s: SeriesDef, u: number | null | undefined): number | null {
  if (u === null || u === undefined) return null;
  if (s.windows) return activity(wrap(u, 1) * 24, s.windows);
  if (s.shape) return s.shape(wrap(u, 1));
  return 0;
}
