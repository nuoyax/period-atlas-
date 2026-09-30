import { useEffect, useRef } from 'react';
import { SER, seriesOf } from '../data/catalogue.ts';
import type { Series } from '../data/catalogue.ts';
import type { IndustryId } from '../data/industries.ts';
import { yv } from '../data/yax.ts';
import { shapeAt } from '../model/shape.ts';
import { phaseOf } from '../model/phases.ts';
import { stateOf } from '../model/axis.ts';
import { fmt, wrap } from '../model/math.ts';
import type { Window } from '../model/math.ts';
import { useClockSubscription } from '../model/clock.ts';

/**
 * 相位轮 —— 只画「一天」这一层。
 *
 * 更长尺度不放进同一个 24 小时圆盘：星期是 7 天、月份是 30 天，套进 24h 就失真了。
 * 半径按当前行业的日尺度曲线条数从外到内均分，弧段是各自的活跃窗口，
 * 圆点是当前时刻的相位；图例给读数与状态，识别不靠颜色单独承担。
 *
 * 与原单文件一致的两点：
 *  1. 只有显式给了 windows 的曲线才画弧段（用 shape 定义的，如「在轨轨道」，没有固定窗口）；
 *  2. 图例的读数是**全局序列号** SER[i] 取的，不是本行业内的序号。
 */

/** 活跃窗口在 24h 圆盘上占的比例区间；跨零点的窗要拆成两段 */
function windowFractions(w: Window): [number, number][] {
  const f1 = wrap((w.c - w.h) / 24, 1);
  const f2 = wrap((w.c + w.h) / 24, 1);
  if (Math.abs(w.c + w.h - w.c) >= 24) return [[0, 1]];
  return f1 < f2 ? [[f1, f2]] : [[f1, 1], [0, f2]];
}

const CX = 180, CY = 180;

function ringRadius(i: number, n: number) {
  if (n === 1) return 150;
  return 150 - i * (120 / Math.max(1, n - 1));
}

export function RingView({ ind }: { ind: IndustryId | 'all' }) {
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const pvRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const stRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const clockRef = useRef<SVGTextElement>(null);
  const subRef = useRef<SVGTextElement>(null);

  const dayList = seriesOf(ind, 'day');

  useEffect(() => {
    dotRefs.current.length = dayList.length;
    pvRefs.current.length = dayList.length;
    stRefs.current.length = dayList.length;
  }, [dayList.length]);

  useClockSubscription((days) => {
    const t = wrap(days, 1) * 24;
    const th = wrap(days, 1) * 2 * Math.PI - Math.PI / 2;

    dayList.forEach((s, i) => {
      const dot = dotRefs.current[i];
      if (dot) {
        const r = ringRadius(i, dayList.length);
        dot.setAttribute('cx', (CX + r * Math.cos(th)).toFixed(2));
        dot.setAttribute('cy', (CY + r * Math.sin(th)).toFixed(2));
      }
      // 读数取全局序列号 SER[i]，与原版一致
      const a = shapeAt(SER[s.i], phaseOf(SER[s.i], days, { ind: ind as never }));
      if (a === null) return;
      const pv = pvRefs.current[i], st = stRefs.current[i];
      if (pv) pv.textContent = yv(SER[s.i], a);
      if (st) st.textContent = stateOf(a);
    });

    if (clockRef.current) clockRef.current.textContent = fmt(t);

    let activeCount = 0;
    dayList.forEach((s) => {
      const a = shapeAt(SER[s.i], phaseOf(SER[s.i], days, { ind: ind as never }));
      if (a !== null && a >= 0.7) activeCount++;
    });
    if (subRef.current) {
      subRef.current.textContent = activeCount ? activeCount + ' 项处于活跃期' : '全部处于低位';
    }
  });

  return (
    <section className="card ring-card">
      <h2>相位轮 · 一天这一层同屏</h2>
      <p className="sub">
        外圈到内圈依次是本层的各条曲线，同一个钟点在同一条半径上。弧段是各自的活跃窗口，
        圆点是当前时刻的相位。星期及更长尺度不放进这个 24 小时圆盘。
      </p>
      <div className="ring-grid">
        <svg className="ring" viewBox="0 0 360 360" role="img"
             aria-label="一天这一层各条曲线的相位轮，当前时刻的相位用圆点标出">
          {/* 刻度：0 时在上，12 时在下 */}
          {([[0, CX, 14, 'middle'], [6, CX + 170, 185, 'end'],
             [12, CX, 355, 'middle'], [18, CX - 170, 185, 'start']] as const)
            .map(([h, x, y, anchor]) => (
              <text key={h} x={x} y={y} textAnchor={anchor} className="ring-tick">
                {fmt(h)}
              </text>
            ))}
          {dayList.map((s, i) => {
            const r = ringRadius(i, dayList.length);
            const C = 2 * Math.PI * r;
            return (
              <g key={s.i}>
                <circle cx={CX} cy={CY} r={r} fill="none" stroke="var(--grid)" strokeWidth={9} />
                {(s.windows || []).map((w, wi) =>
                  windowFractions(w).map(([f1, f2], fi) => {
                    const L = (f2 - f1) * C;
                    if (L <= 0) return null;
                    const gap = Math.min(2, L * 0.25);
                    return (
                      <circle key={wi + '-' + fi} cx={CX} cy={CY} r={r} fill="none"
                              stroke="var(--t1)" strokeWidth={9} strokeLinecap="round"
                              strokeDasharray={Math.max(0.5, L - gap).toFixed(2) + ' ' + C.toFixed(2)}
                              strokeDashoffset={(-f1 * C).toFixed(2)}
                              transform={'rotate(-90 ' + CX + ' ' + CY + ')'} />
                    );
                  }))}
                <circle ref={(el) => { dotRefs.current[i] = el; }}
                        cx={CX} cy={CY - r} r={6.5}
                        fill="var(--t1)" stroke="var(--surface-1)" strokeWidth={3} />
              </g>
            );
          })}
          <text ref={clockRef} x={CX} y={176} textAnchor="middle" className="ring-clock" />
          <text ref={subRef} x={CX} y={198} textAnchor="middle" className="ring-sub" />
        </svg>
        <ul className="ring-legend">
          {dayList.map((s: Series, i: number) => (
            <li key={s.i}>
              <span className="dot" style={{ background: 'var(--t1)' }} />
              <span className="nm">{i + 1} · {s.name}</span>
              <span className="pv" ref={(el) => { pvRefs.current[i] = el; }} />
              <span className="st" ref={(el) => { stRefs.current[i] = el; }} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
