/**
 * 时间尺度：钟点 / 星期 / 月份 / 季节 / 年度 五层。
 *
 * 分类色板只有 8 槽，这里已经用到 7 槽；再往下生成分类色会与已有色在色觉缺陷下无法区分，
 * 所以「时间尺度」这个自变量改用同一族蓝色的序数色阶（由浅到深），每层再配全称/简称/区间文字，
 * 识别不靠颜色单独承担。
 */

export type LevelId = 'day' | 'week' | 'month' | 'season' | 'year';

export interface Level {
  id: LevelId;
  /** 短名，用于尺度按钮与分组标题 */
  name: string;
  /** 全称，用于分组标题 */
  full: string;
  short: string;
  spanText: string;
  /** 该层在序数蓝色阶里的 CSS 变量名 */
  cvar: string;
  /** 该层色块上的文字颜色变量 */
  onvar: string;
  desc: string;
  /** 建立索引时写入：0–4，与 ①②③④⑤ 对应 */
  i: number;
}

export const LEVELS: Level[] = [
  {
    id: 'day', name: '一天', full: '钟点', short: '钟点', spanText: '24 小时',
    cvar: '--t1', onvar: '--onT1',
    desc: '一天之内：褪黑素、皮质醇、体温、饥饿与人群出行都在这 24 小时里走一圈。',
    i: 0,
  },
  {
    id: 'week', name: '一周', full: '星期', short: '星期', spanText: '7 天',
    cvar: '--t2', onvar: '--onT2',
    desc: '一周之内：工作日与休息日的两种作息彼此切换，是典型的社会性节律。',
    i: 0,
  },
  {
    id: 'month', name: '一月', full: '月份', short: '月份', spanText: '28–31 天',
    cvar: '--t3', onvar: '--onT3',
    desc: '一个月之内：月亮同时换相位、换起落时刻，也换离地的远近。',
    i: 0,
  },
  {
    id: 'season', name: '一年', full: '季节', short: '季节', spanText: '365.25 天',
    cvar: '--t4', onvar: '--onT4',
    desc: '一年之内：太阳高度角、白昼长度、每月日照总量与气温依次到顶或到底。',
    i: 0,
  },
  {
    id: 'year', name: '数年', full: '年度', short: '年度', spanText: '4 年',
    cvar: '--t5', onvar: '--onT5',
    desc: '数年之内：公历与地球实际公转每年差约 6 小时，攒够一天就是闰日。',
    i: 0,
  },
];

/** 建立索引：i 与 ①②③④⑤ 一一对应 */
LEVELS.forEach((l, i) => { l.i = i; });

export const LV: Record<LevelId, Level> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l]),
) as Record<LevelId, Level>;
