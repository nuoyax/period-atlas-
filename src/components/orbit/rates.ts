/**
 * 3D 视图的时间倍率档。
 *
 * 2D 那边的「一天 16 秒」在 3D 里没法看：地球一年要 97 分钟，海王星 30 年要 48 小时。
 * 所以 3D 自带一套档位，以「每秒推进多少天」为单位。
 *
 * 仍然从同一个 clock.days 派生（只乘倍率），**绝不写回** clock.days——
 * 一旦写回，2D 的钟点会被 3D 的加速拖着跑，一天这一层的曲线就废了。
 */
export interface RateDef {
  id: string;
  label: string;
  /** 每秒推进多少天 */
  daysPerSec: number;
}

export const RATES: RateDef[] = [
  { id: 'day', label: '1 天 / 秒', daysPerSec: 1 },
  { id: 'week', label: '1 周 / 秒', daysPerSec: 7 },
  { id: 'month', label: '1 月 / 秒', daysPerSec: 30.44 },
  { id: 'year', label: '1 年 / 秒', daysPerSec: 365.2422 },
  { id: 'decade', label: '10 年 / 秒', daysPerSec: 3652.422 },
];

export const DEFAULT_RATE = 'month';

export function rateOf(id: string): RateDef {
  return RATES.find((r) => r.id === id) ?? RATES[2];
}
