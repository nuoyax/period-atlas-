import { useRef } from 'react';
import { SER } from '../data/catalogue.ts';
import type { IndustryId } from '../data/industries.ts';
import { yv } from '../data/yax.ts';
import { shapeAt } from '../model/shape.ts';
import { phaseOf } from '../model/phases.ts';
import { stateOf } from '../model/axis.ts';
import { fmt } from '../model/math.ts';
import { subscribe, poke } from '../model/clock.ts';

/**
 * 表格视图 —— 无障碍等价物。
 *
 * 「当前数值」列随时钟变化。但不逐帧刷新：长周期曲线的读数几十秒才变一次，
 * 逐帧重写 79 个单元格纯属浪费，所以按整体签名（每条当前高度的粗量化）变化才刷。
 */
export function TableView({ ind, levels }: {
  ind: IndustryId | 'all';
  levels: Set<string>;
}) {
  const cells = useRef<(HTMLTableCellElement | null)[]>([]);
  const nowHead = useRef<HTMLTableHeaderCellElement>(null);
  const lastSign = useRef('');
  const started = useRef(false);

  if (!started.current) {
    started.current = true;
    setTimeout(() => {
      subscribe((days) => {
        const t = (((days % 1) + 1) % 1) * 24;
        if (nowHead.current) nowHead.current.textContent = '当前数值（' + fmt(t) + '）';
        const sign = SER.map((s) => {
          const a = shapeAt(s, phaseOf(s, days, { ind: ind as never }));
          return a === null ? '-' : Math.round(a * 50);
        }).join('|');
        if (sign === lastSign.current) return;
        lastSign.current = sign;
        SER.forEach((s, i) => {
          const td = cells.current[i];
          if (!td) return;
          const okS = ind === 'all' || s.ind === ind;
          if (!okS) { td.textContent = '—'; return; }
          const a = shapeAt(s, phaseOf(s, days, { ind: ind as never }));
          td.textContent = yv(s, a) + ' · ' + stateOf(a as number);
        });
      });
      poke();
    });
  }

  return (
    <div className="tablewrap" id="tableWrap">
      <table>
        <caption className="sr">
          生活周期的尺度、周期、活跃窗口、峰值时刻与当前数值
        </caption>
        <thead>
          <tr>
            <th scope="col">现象</th>
            <th scope="col">尺度</th>
            <th scope="col">周期</th>
            <th scope="col">活跃窗口</th>
            <th scope="col">峰值时刻</th>
            <th scope="col" ref={nowHead}>当前数值</th>
            <th scope="col">生活里的例子</th>
          </tr>
        </thead>
        <tbody>
          {SER.map((s, i) => {
            const visible = (ind === 'all' || s.ind === ind) && levels.has(s.lv);
            return (
              <tr key={s.i} hidden={!visible} data-lv={s.lv} data-ind={s.ind}>
                <td>
                  <div className="tname">
                    <span className="dot" style={{ background: `var(${s.lvObj.cvar})` }} />
                    <span>{s.name}</span>
                  </div>
                </td>
                <td className="num">{s.lvObj.full} · {s.lvObj.spanText}</td>
                <td className="num">{s.period}</td>
                <td className="num">{s.range}</td>
                <td className="num">
                  {(s.peaks || []).map((p) => p.l.replace(/^(峰值|谷值|低谷|峰|晨峰|晚峰)\s*/, ''))
                    .join(' / ')}
                </td>
                <td className="num" ref={(el) => { cells.current[i] = el; }} />
                <td>{s.example}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
