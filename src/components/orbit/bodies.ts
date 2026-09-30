/**
 * 太阳系真实参数表 + 显示压缩函数。
 *
 * 这里的每一个数字都是**真实值**（半径 km、轨道半长轴 AU、恒星周期 天、
 * J2000 平黄经 度、自转轴倾角 度、自转周期 小时），来自公开天文常数。
 * 显示尺度则在下面的 scale 函数里单独压缩，两者绝不混在一起——
 * 面板上要报真实值，画面上要压缩，混了就再也说不清哪句是真话。
 */

/** 1 天文单位 = 149 597 870.7 km */
export const AU_KM = 149597870.7;

export interface BodyDef {
  id: string;
  name: string;
  /** 领域色：行星的固有印象色，不是从分类色板生成的 */
  color: string;
  /** 赤道半径 km */
  radiusKm: number;
  /** 轨道半长轴（AU）；太阳为 0 */
  aAU: number;
  /** 恒星周期（天）；太阳为 0 */
  periodDays: number;
  /** J2000 历元平黄经（度） */
  meanLon: number;
  /** 轨道倾角（度），相对黄道面 */
  inclDeg: number;
  /** 自转轴倾角（度） */
  tiltDeg: number;
  /** 自转周期（小时），负值表示逆向自转 */
  rotHours: number;
  /** 程序化贴图的画法 */
  surface: 'sun' | 'rocky' | 'earth' | 'bands';
  /** 贴图与光环的基色 */
  tint: string;
  /** 有无光环 */
  ring?: { inner: number; outer: number; color: string; opacity: number };
  /** 一句话说明，预览面板里用 */
  note: string;
}

/** 8 行星 + 太阳。顺序即离太阳由近到远。 */
export const BODIES: BodyDef[] = [
  {
    id: 'mercury', name: '水星', color: '#9c9188', radiusKm: 2439.7,
    aAU: 0.38710, periodDays: 87.969, meanLon: 252.25,
    inclDeg: 7.005,
    tiltDeg: 0.034, rotHours: 1407.6,
    surface: 'rocky', tint: '#9c9188',
    note: '离太阳最近，没有大气保温，昼夜温差可达 600℃。',
  },
  {
    id: 'venus', name: '金星', color: '#e6d3a3', radiusKm: 6051.8,
    aAU: 0.72333, periodDays: 224.701, meanLon: 181.98,
    inclDeg: 3.395,
    tiltDeg: 177.36, rotHours: -5832.5,
    surface: 'rocky', tint: '#e6d3a3',
    note: '浓密二氧化碳大气造成失控温室效应，表面约 464℃；自转逆向且比公转还慢。',
  },
  {
    id: 'earth', name: '地球', color: '#3d7bd6', radiusKm: 6371.0,
    aAU: 1.00000, periodDays: 365.2422, meanLon: 100.46,
    inclDeg: 0.0,
    tiltDeg: 23.44, rotHours: 23.934,
    surface: 'earth', tint: '#3d7bd6',
    note: '自转轴倾角 23.44° 造成四季；本工程 2D 视图的全部季节曲线都挂在它身上。',
  },
  {
    id: 'mars', name: '火星', color: '#b7410e', radiusKm: 3389.5,
    aAU: 1.52371, periodDays: 686.980, meanLon: 355.43,
    inclDeg: 1.85,
    tiltDeg: 25.19, rotHours: 24.623,
    surface: 'rocky', tint: '#b7410e',
    note: '轨道偏心率较大（0.093），与地球的会合周期约 780 天，即发射窗口的间隔。',
  },
  {
    id: 'jupiter', name: '木星', color: '#c9a06a', radiusKm: 69911,
    aAU: 5.20289, periodDays: 4332.59, meanLon: 34.35,
    inclDeg: 1.303,
    tiltDeg: 3.13, rotHours: 9.925,
    surface: 'bands', tint: '#c9a06a',
    note: '质量为其余七颗行星总和的 2.5 倍；自转最快，不到 10 小时一圈。',
  },
  {
    id: 'saturn', name: '土星', color: '#e0c58a', radiusKm: 58232,
    aAU: 9.53667, periodDays: 10759.22, meanLon: 50.08,
    inclDeg: 2.485,
    tiltDeg: 26.73, rotHours: 10.656,
    surface: 'bands', tint: '#e0c58a',
    ring: { inner: 1.24, outer: 2.30, color: '#d8c49a', opacity: 0.55 },
    note: '光环主要由水冰颗粒组成，厚度不足 1 km，宽度却有数万 km。',
  },
  {
    id: 'uranus', name: '天王星', color: '#9fd8e0', radiusKm: 25362,
    aAU: 19.18916, periodDays: 30688.5, meanLon: 314.06,
    inclDeg: 0.773,
    tiltDeg: 97.77, rotHours: -17.24,
    surface: 'bands', tint: '#9fd8e0',
    ring: { inner: 1.60, outer: 2.00, color: '#8fb8c0', opacity: 0.25 },
    note: '自转轴几乎躺倒在轨道面上（97.77°），两极各有 42 年的极昼与极夜。',
  },
  {
    id: 'neptune', name: '海王星', color: '#4a6fd6', radiusKm: 24622,
    aAU: 30.06992, periodDays: 60182.0, meanLon: 304.35,
    inclDeg: 1.77,
    tiltDeg: 28.32, rotHours: 16.11,
    surface: 'bands', tint: '#4a6fd6',
    note: '先由数学预测、后被观测找到的行星；风速可超过 2000 km/h。',
  },
];

export const SUN: BodyDef = {
  id: 'sun', name: '太阳', color: '#ffcc55', radiusKm: 696340,
  aAU: 0, periodDays: 0, meanLon: 0, inclDeg: 0, tiltDeg: 7.25, rotHours: 609.12,
  surface: 'sun', tint: '#ffcc55',
  note: '占太阳系 99.86% 的质量；自转周期赤道约 25 天、极区约 35 天，故取平均值 27.3 天。',
};

/* ---------------- 显示尺度：真实值 → 屏幕值 ---------------- */

/**
 * 轨道显示半径：d = 22 · √(a / AU)。
 *
 * 真实比例下海王星是水星的 78 倍远，画在同一个画面里要么内圈糊成一团、
 * 要么外圈飞出屏幕。平方根压缩把这个倍数压到 8.8 倍，内圈还能看清。
 */
export function orbitRadius(aAU: number): number {
  return 22 * Math.sqrt(Math.max(0, aAU));
}

/**
 * 天体显示半径：r = 1.1 · (R / R_地球) ^ 0.4，夹在 [0.55, 3.2]。
 *
 * 真实比例下木星是水星的 29 倍、太阳是地球的 109 倍。0.4 次幂把它压到
 * 约 3.8 倍与 5.5 倍，同时**保持大小顺序不变**——顺序是对的，倍数不是。
 * 太阳单独给 6，比最大的行星再大一圈。
 */
export function bodyRadius(radiusKm: number, isSun = false): number {
  if (isSun) return 6;
  const raw = 1.1 * Math.pow(radiusKm / 6371.0, 0.4);
  return Math.min(3.2, Math.max(0.55, raw));
}

/** 界面上常驻的免责声明：这句话必须和画面同时出现 */
export const SCALE_NOTE =
  '距离按平方根、大小按 0.4 次幂压缩显示，非真实比例；自转与公转的速度也按同一倍率加速。';

/* ---------------- 轨道位置 ---------------- */

/**
 * 由天数算黄经（度）。
 *
 * 平黄经 = J2000 历元平黄经 + 平均运动 × 天数。这是「平黄经」不是「真黄经」，
 * 没有计入偏心率与摄动，所以画面上的行星位置在**单圈尺度**上与真实星历
 * 会有几度的偏差——作为示意图足够，作为星历表不够。
 */
export function meanLongitude(b: BodyDef, days: number): number {
  if (!b.periodDays) return 0;
  return ((b.meanLon + 360 * (days / b.periodDays)) % 360 + 360) % 360;
}

/** 当前轨道相位占比 [0,1)，面板上按「本圈走了百分之几」报 */
export function orbitPhase(b: BodyDef, days: number): number {
  if (!b.periodDays) return 0;
  const r = (days / b.periodDays) % 1;
  return r < 0 ? r + 1 : r;
}

/** 「现在到哪了」的日期：2020-01-01 起算，只做展示 */
export function dateOf(days: number): string {
  const ms = Date.UTC(2020, 0, 1) + days * 86400000;
  const d = new Date(ms);
  if (!Number.isFinite(ms)) return '—';
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
