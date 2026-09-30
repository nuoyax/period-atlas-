import { SERIES } from './series.ts';
import type { SeriesDef } from './series.ts';
import { LV } from './levels.ts';
import { IND } from './industries.ts';
import type { IndustryId } from './industries.ts';
import type { LevelId } from './levels.ts';

/** 行业缺省归入「生活日常」（19 条生活曲线原文没有 ind 字段） */
SERIES.forEach((s) => { if (!s.ind) s.ind = 'life'; });

/** 建立索引后的曲线：多带 i / li / lvObj / indObj，其余字段与 SERIES 逐字相同 */
export interface Series extends SeriesDef {
  /** 数组下标 */
  i: number;
  /** 序号（表格、图例用），建表时重算为「当前筛选下的序号」 */
  li: number;
  lvObj: (typeof LV)[LevelId];
  indObj: (typeof IND)[IndustryId];
}

export const SER: Series[] = SERIES.map((s, i) => ({
  ...s,
  i,
  li: i,
  lvObj: LV[s.lv],
  indObj: IND[s.ind as IndustryId],
}));

export function seriesOf(indId: IndustryId | 'all', lid: LevelId): Series[] {
  return SER.filter((s) => (indId === 'all' || s.ind === indId) && s.lv === lid);
}

export function indCount(indId: IndustryId | 'all'): number {
  return indId === 'all' ? SER.length : SER.filter((s) => s.ind === indId).length;
}
