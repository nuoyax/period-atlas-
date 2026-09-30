import { memo, useRef } from 'react';
import type { Series } from '../data/catalogue.ts';
import { shapeAt } from '../model/shape.ts';
import { phaseOf } from '../model/phases.ts';
import { yv, ynameOf } from '../data/yax.ts';
import { stateOf, lvSpanLabel } from '../model/axis.ts';
import { clock, useClockSubscription } from '../model/clock.ts';
import { VBW, VBH, PAD, PW, PH, X, Y } from './plot.ts';

/**
 * 一张曲线卡片。
 *
 * 静态几何（网格、基线、刻度、面积、折线、峰谷标注）全部是 JSX，算一次就固定——
 * 它们不随时钟变化，**绝不能**让 60fps 的时钟把它们重新渲染一遍。
 *
 * 只有三样东西会动：跟随相位的圆点、准星、读数文字。
 * 这三样交给 useClockSubscription 直接改 DOM，绕开 React。
 */

interface Props {
  s: Series;
  /** 当前行业筛选；phaseOf 在曲线被筛掉时返回 null，相位随之冻结 */
  ind: string;
  /** 当前是否可见（行业 × 尺度两级筛选） */
  visible: boolean;
}

function WaveCardImpl({ s, ind, visible }: Props) {
  const dotRef = useRef<SVGCircleElement>(null);
  const crossRef = useRef<SVGLineElement>(null);
  const valRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastReadout = useRef('');

  /* 多圈折叠：星期 7 天绕 8 圈、月尺度绕 48 圈后再取平均，所以「四年里各年长度不同」
     这类多圈结构也能被正确画出来。与读数用同一份 aAt()，两边一致。 */
  const cyc = s.span <= 7 ? 8 : (s.span <= 31 ? 48 : 1);
  const N = cyc <= 1
    ? Math.round(Math.min(1440, Math.max(240, s.span * 4)))
    : Math.round(Math.min(1440, cyc * s.span));

  const aAt = (u: number): number => {
    if (cyc <= 1) return shapeAt(s, u) as number;
    let sum = 0;
    for (let q = 0; q < cyc; q++) sum += shapeAt(s, wrap1(u + q)) as number;
    return sum / cyc;
  };

  /* 折线路径：算一次 */
  let d = '';
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const a = k === N ? (shapeAt(s, 0) as number) : aAt(u);
    d += (k ? 'L' : 'M') + X(u).toFixed(2) + ' ' + Y(a).toFixed(2);
  }
  const areaD = d
    + 'L' + X(1).toFixed(2) + ' ' + Y(0).toFixed(2)
    + 'L' + X(0).toFixed(2) + ' ' + Y(0).toFixed(2) + 'Z';

  /* 时钟订阅：只改动的那三样 */
  useClockSubscription((days) => {
    const dot = dotRef.current, cross = crossRef.current;
    const val = valRef.current, st = stateRef.current;
    if (!dot || !cross || !val || !st) return;
    if (!visible) return;                       // 被筛掉的卡片不更新（相位冻结）

    const u = phaseOf(s, days, { ind: ind as never });
    const a = shapeAt(s, u);
    if (u === null || a === null) return;

    const cx = X(u).toFixed(2);
    dot.setAttribute('cx', cx);
    dot.setAttribute('cy', Y(a).toFixed(2));
    cross.setAttribute('x1', cx);
    cross.setAttribute('x2', cx);

    const next = yv(s, a) + '\u0000' + stateOf(a);
    if (next !== lastReadout.current) {         // 长周期曲线多数帧其实没变，跳过写入
      lastReadout.current = next;
      const [v, s2] = next.split('\u0000');
      val.textContent = v;
      st.textContent = s2;
    }
  }, visible);

  /* 悬停提示 */
  const onMove = (ev: React.PointerEvent<SVGSVGElement>) => {
    const tip = tipRef.current, wrap = wrapRef.current;
    if (!tip || !wrap) return;
    const r = ev.currentTarget.getBoundingClientRect();
    const px = (ev.clientX - r.left) * (VBW / r.width);
    let u = (px - PAD.l) / PW;
    u = Math.max(0, Math.min(1, Math.round(u * 288) / 288));
    const a = aAt(u);
    tip.innerHTML = '';
    const l1 = document.createElement('div'); l1.className = 't';
    l1.textContent = s.tickLabel(u);
    const l2 = document.createElement('div'); l2.className = 'row';
    const kk = document.createElement('span'); kk.className = 'k';
    const vv = document.createElement('span'); vv.className = 'v';
    vv.textContent = yv(s, a);
    const nn = document.createElement('span'); nn.className = 'n';
    nn.textContent = s.name + ' · ' + ynameOf(s) + ' · '
      + lvSpanLabel(s, u, clock.days) + ' · ' + stateOf(a);
    l2.append(kk, vv, nn);
    tip.append(l1, l2);
    tip.hidden = false;
    const cr = wrap.getBoundingClientRect();
    tip.style.left = (ev.clientX - cr.left) + 'px';
    tip.style.top = ((Y(a) / VBH) * cr.height - 10) + 'px';
  };

  const axis = ynameOf(s);

  return (
    <section className="card" data-lv={s.lv} data-ind={s.ind} hidden={!visible}
             style={{ ['--c' as string]: `var(${s.lvObj.cvar})` }}>
      <h2>
        <span className="num" style={{
          background: `var(${s.lvObj.cvar})`,
          color: `var(${s.lvObj.onvar})`,
        }}>{s.li + 1}</span>
        <span>{s.name}</span>
        <span className="chip">{s.chip}</span>
      </h2>
      <p className="sub" dangerouslySetInnerHTML={{ __html: s.sub }} />
      <div className="plot-wrap" ref={wrapRef}>
        <svg className="wave" viewBox={`0 0 ${VBW} ${VBH}`} role="img"
             aria-label={`${s.name} 的周期曲线，周期 ${s.period}，活跃时段 ${s.range}`}
             onPointerMove={onMove}
             onPointerLeave={() => { if (tipRef.current) tipRef.current.hidden = true; }}>
          {/* 网格（实线细线，退到背景里） */}
          {s.ticksU.map((u, i) => (
            <line key={'g' + i} x1={X(u)} y1={PAD.t} x2={X(u)} y2={PAD.t + PH}
                  stroke="var(--grid)" strokeWidth={1} shapeRendering="crispEdges" />
          ))}
          {/* 基线 */}
          <line x1={PAD.l} y1={PAD.t + PH} x2={PAD.l + PW} y2={PAD.t + PH}
                stroke="var(--axis)" strokeWidth={1} shapeRendering="crispEdges" />
          {/* 横轴刻度 */}
          {s.ticksU.map((u, i) => (
            <text key={'t' + i} x={X(u)} y={PAD.t + PH + 16}
                  textAnchor={u === 0 ? 'start' : (u === 1 ? 'end' : 'middle')}
                  style={{
                    font: '400 11px system-ui,sans-serif', fill: 'var(--muted)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>{s.tickLabel(u)}</text>
          ))}
          {/* 纵轴：本条自己的量名写在左上，上下限画成左侧刻度 —— 每张图一条轴 */}
          <text x={PAD.l - 46} y={PAD.t - 8}
                style={{ font: '400 10.5px system-ui,sans-serif', fill: 'var(--muted)' }}>
            {axis}
          </text>
          {[0, 0.5, 1].map((a) => {
            const gy = PAD.t + PH - a * PH;
            return (
              <g key={'y' + a}>
                <line x1={PAD.l} y1={gy} x2={PAD.l + PW} y2={gy}
                      stroke="var(--grid)" strokeWidth={1} shapeRendering="crispEdges" />
                <text x={PAD.l - 6} y={gy + 3.5} textAnchor="end"
                      style={{
                        font: '400 10px system-ui,sans-serif', fill: 'var(--muted)',
                        fontVariantNumeric: 'tabular-nums',
                      }}>{yv(s, a)}</text>
              </g>
            );
          })}
          {/* 面积（10% 淡色）与 2px 折线 */}
          <path d={areaD} fill={`var(${s.lvObj.cvar})`} opacity={0.1} />
          <path d={d} fill="none" stroke={`var(${s.lvObj.cvar})`}
                strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* 峰 / 谷直接标注（选择性，只标极值点） */}
          {(s.peaks || []).map((pk, i) => {
            const a = shapeAt(s, pk.u) as number;
            return (
              <text key={'k' + i} x={X(pk.u)} y={Y(a) + (pk.below ? 14 : -9)}
                    textAnchor="middle"
                    style={{
                      font: '500 10.5px system-ui,sans-serif', fill: 'var(--muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>{pk.l}</text>
            );
          })}
          {/* 跟随时钟的圆点 + 准星 */}
          <line ref={crossRef} x1={X(0)} y1={PAD.t} x2={X(0)} y2={PAD.t + PH}
                stroke="var(--axis)" strokeWidth={1} shapeRendering="crispEdges" />
          <circle ref={dotRef} cx={X(0)} cy={Y(0)} r={5}
                  fill={`var(${s.lvObj.cvar})`} stroke="var(--surface-1)" strokeWidth={2} />
        </svg>
        <div className="tip" ref={tipRef} hidden
             style={{ ['--c' as string]: `var(${s.lvObj.cvar})` }} />
      </div>
      <div className="readout">
        <span className="key" />
        <span className="val" ref={valRef}>—</span>
        <span className="state" ref={stateRef} />
        <span className="tail">活跃时段 {s.range}</span>
      </div>
    </section>
  );
}

const wrap1 = (v: number) => { const r = v % 1; return r < 0 ? r + 1 : r; };

/* memo：动画期间卡片一次都不重渲染；筛选变化时只有 visible 变了的那些会重渲染 */
export const WaveCard = memo(WaveCardImpl);
