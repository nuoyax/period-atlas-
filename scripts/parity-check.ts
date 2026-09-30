import { SER } from '../src/data/catalogue.ts';
import { SERIES } from '../src/data/series.ts';
import { YAX } from '../src/data/yax.ts';
import { LEVELS } from '../src/data/levels.ts';
import { INDUSTRIES } from '../src/data/industries.ts';
import { phaseOf, PU } from '../src/model/phases.ts';
import { shapeAt } from '../src/model/shape.ts';
import { yv, ynameOf } from '../src/data/yax.ts';
import { BEST_DAY } from '../src/model/bestday.ts';

/**
 * 数据层自检。跑法：npm run check:data
 *
 * 这一层是纯搬运：74 条曲线的定义是从原文件逐字抽出来的，
 * 唯一的失败模式是「少了一条 / 抄错一个字符」——而那种错误在页面上
 * 只表现为「某个行业少了一张卡」，肉眼几乎看不出来。
 * 所以这里把条数、分布、量纲、相位有限性全部冻结成断言。
 */

const fail: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) fail.push(msg); };

/* ---------- 条数与结构 ---------- */
ok(SER.length === 74, `SERIES 条数 ${SER.length} != 74`);
ok(SERIES.length === 74, `SERIES 原始数组 ${SERIES.length} != 74`);
ok(Object.keys(YAX).length === 73, `YAX 唯一键数 ${Object.keys(YAX).length} != 73（月经周期重名，两条共用一个键）`);
ok(LEVELS.length === 5, `LEVELS ${LEVELS.length} != 5`);
ok(INDUSTRIES.length === 13, `INDUSTRIES ${INDUSTRIES.length} != 13`);
ok(Object.keys(PU).length === 27, `PU 条目 ${Object.keys(PU).length} != 27`);

/* ---------- 尺度分布（与原文件一致） ---------- */
const dist: Record<string, number> = {};
SER.forEach((s) => { dist[s.lv] = (dist[s.lv] || 0) + 1; });
const wantDist: Record<string, number> = { day: 27, week: 7, month: 14, season: 18, year: 8 };
for (const k in wantDist) ok(dist[k] === wantDist[k], `尺度 ${k}: ${dist[k]} != ${wantDist[k]}`);

/* ---------- 行业分布：19 条生活曲线原文无 ind 字段，须兜底为 life ---------- */
const byInd: Record<string, number> = {};
SER.forEach((s) => { byInd[s.ind!] = (byInd[s.ind!] || 0) + 1; });
const wantInd: Record<string, number> = {
  life: 19, agri: 5, space: 15, marine: 4, health: 4, energy: 3, transport: 4,
  finance: 4, mfg: 4, edu: 3, tourism: 3, sports: 3, media: 3,
};
for (const k in wantInd) ok(byInd[k] === wantInd[k], `行业 ${k}: ${byInd[k]} != ${wantInd[k]}`);
const indSum = INDUSTRIES.reduce((a, x) => a + (byInd[x.id] || 0), 0);
ok(indSum === 74, `各行业条数之和 ${indSum} != 74`);

/* ---------- 形状：不允许水平线（早先 smoothPulse 的 mod 传错就踩过这个坑） ---------- */
const flat: string[] = [];
SER.forEach((s) => {
  const N = 1152;
  let mn = 9, mx = -9;
  for (let k = 0; k < N; k++) {
    const a = shapeAt(s, k / N) as number;
    if (a < mn) mn = a;
    if (a > mx) mx = a;
  }
  if (mx - mn < 0.02) flat.push(`${s.name} ${mn.toFixed(2)}..${mx.toFixed(2)}`);
});
ok(flat.length === 0, `出现水平线: ${flat.join(', ')}`);

/* ---------- 纵轴：每条都要解出真实量纲，不允许落到 DEF_Y 兜底 ---------- */
const defY = SER.filter((s) => ynameOf(s) === '指数');
ok(defY.length === 0, `落到兜底轴的: ${defY.map((s) => s.name).join(', ')}`);

/* ---------- 相位：必须有限，且被行业筛掉时返回 null ---------- */
const badPhase: string[] = [];
for (const s of SER) {
  for (const d of [0, 0.5, 1, 120.25, 400.5, 1559.75, 60182]) {
    const u = phaseOf(s, d, { ind: 'all' });
    if (u === null || !Number.isFinite(u) || !Number.isFinite(shapeAt(s, u) as number)) {
      badPhase.push(`${s.name}@${d}`);
      break;
    }
  }
}
ok(badPhase.length === 0, `相位非有限: ${badPhase.slice(0, 8).join(', ')}`);

const s0 = SER[0];
ok(phaseOf(s0, 0, { ind: 'life' }) !== null, '生活曲线在 life 行业下应非 null');
ok(phaseOf(s0, 0, { ind: 'space' }) === null, '生活曲线在 space 行业下应为 null');

/* ---------- 起点：修复 PU 周期覆盖后应落在 192（近满月 + 近夏至 + 周六） ---------- */
ok(BEST_DAY === 192, `BEST_DAY ${BEST_DAY} != 192`);

/* ---------- 打印一份可读摘要 ---------- */
console.log(`SERIES ${SER.length} · YAX ${Object.keys(YAX).length} 键 · PU ${Object.keys(PU).length} 条 · BEST_DAY ${BEST_DAY}`);
console.log('尺度分布', dist);
console.log('行业分布', byInd);
console.log('样例量纲（谷 / 中 / 峰）:');
['月相', '潮汐涨落', '发动机点火时序', '血压晨峰', '历年长度'].forEach((n) => {
  const s = SER.find((x) => x.name === n);
  if (s) console.log(`  ${s.name} → ${ynameOf(s)} | ${yv(s, 0)} | ${yv(s, 0.5)} | ${yv(s, 1)}`);
});

if (fail.length) {
  console.error('\nFAIL:');
  fail.forEach((f) => console.error('  - ' + f));
  process.exit(1);
}
console.log('\nALL PASS');
