/**
 * 天文锚点。
 *
 * 全部以「2020-01-01 起的天数」为唯一时间轴。ASTRO 里的数是各周期在 days=0 时的相位，
 * 由公开的天文历元反推：新月 2000-01-06 18:14 UTC、月球过近地点 2000-01-19 21:20 UTC。
 */

/** 2020-01-01 的序数日（JS 时间戳换算） */
export const T0_JS = Date.UTC(2020, 0, 1) / 86400000;

export const SYNODIC = 29.530588;      // 朔望月
export const SIDEREAL = 27.321661;     // 恒星月（月出时刻每天推迟约 50 分钟）
export const ANOMALISTIC = 27.554550;  // 近点月
export const SAROS_FAMILY = 14.765294; // 半个朔望月 = 大潮小潮的节拍
export const TROPICAL = 365.2422;      // 回归年

import { frac } from '../model/math.ts';

/** 2020-01-01 是周三；ASTRO 里给的是各天文周期在 days=0 时的相位 */
export const ASTRO = {
  moon: frac((T0_JS - (10957 + 5 + 18.23 / 24)) / SYNODIC),       // 2000-01-06 新月
  perigee: frac((T0_JS - (10957 + 18 + 21.33 / 24)) / ANOMALISTIC), // 2000-01-19 近地点
  tide: frac((T0_JS - (10957 + 5 + 18.23 / 24)) / SAROS_FAMILY),  // 大潮在朔、望各一次
  moonrise: frac((T0_JS + 1) / SIDEREAL),
  season: frac((T0_JS + 100) / TROPICAL),                          // 冬至 12/22 → 夏至 6/21
  menses: frac((T0_JS + 10) / 28),
  work: 3 / 7,                                                    // 周三

  // 行业曲线的锚点：同样都取「days = 0 时该周期所在的相位」
  sunrot: 0.35,    // 太阳自转取固定历元（自转相位无公认零点）
  cycle: 0,        // 2020-01 正是第 25 太阳活动周的极小年
  saros: frac(1559 / 18.03), // 以 2024-04-08 全日食为参照
  sst: 0,          // 海水温度以 1 月 1 日为相位 0，峰落在 8 月中
  flu: 0,          // 流感季以 1 月 1 日为相位 0，峰落在 1 月中
  inspect: 0,      // 年检以 1 月为相位 0，峰落在 11 月
  inven: 0.5,      // 库存周期取 2020 年初为补库峰
  mars: frac(211 / 780), // 以 2020-07-30 火星发射窗口为参照
  olym: 0.25,      // 2020 东京奥运年 = 相位 0.25，四年一轮
};
