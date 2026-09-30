import { useEffect, useRef, useState } from 'react';
import { createSolarScene } from './scene.ts';
import type { SolarScene } from './scene.ts';
import { BODIES, SUN, SCALE_NOTE, dateOf } from './bodies.ts';
import type { BodyDef } from './bodies.ts';
import { RATES, DEFAULT_RATE, rateOf } from './rates.ts';
import { BodyPreview } from './BodyPreview.tsx';
import { clock, poke } from '../../model/clock.ts';

/**
 * 太阳系 3D 视图。
 *
 * 时间来源：**3D 有自己的天数**，初值取 2D 的 clock.days，之后按自己的倍率推进。
 * 为什么不直接读 clock.days：3D 的档位是「1 年 / 秒」，2D 是「1 天 / 16 秒」，
 * 差三个数量级，共用一个数就只能二选一。所以两边各自推进，只在「同步回 2D」上
 * 单向交接一次（3D → 2D），保证 2D 的时间轴不被 3D 拖着跑。
 *
 * 渲染循环与 2D 同款：rAF + 直接改 DOM。行星位置、自转、标签坐标都不经过 React；
 * React 只负责结构性变化（倍率、播放、选中哪颗）。日期读数与预览面板按 1/6 秒
 * 的节拍刷新一次，不跟 60fps。
 */

export function OrbitView({ onSync2D }: { onSync2D?: (days: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SolarScene | null>(null);
  const labelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const daysRef = useRef(clock.days);
  const rafRef = useRef(0);
  const rateRef = useRef(rateOf(DEFAULT_RATE).daysPerSec);

  const [rateId, setRateId] = useState(DEFAULT_RATE);
  const [playing, setPlaying] = useState(true);
  const [selId, setSelId] = useState<string | null>(null);
  const [glError, setGlError] = useState(false);
  const [, setBeat] = useState(0);

  const playingRef = useRef(playing);
  playingRef.current = playing;

  const selBody: BodyDef | null =
    selId === null ? null : (selId === 'sun' ? SUN : BODIES.find((b) => b.id === selId) ?? null);

  /* ---------- 建场景 + 循环（只建一次） ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let scene: SolarScene;
    try {
      scene = createSolarScene(canvas);
    } catch {
      setGlError(true);          // 无 WebGL 时给一句说明，不白屏
      return;
    }
    sceneRef.current = scene;

    const onResize = () => scene.resize();
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(() => scene.resize());
    if (hostRef.current) ro.observe(hostRef.current);

    let last = performance.now();
    let beat = 0;
    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (playingRef.current) daysRef.current += rateRef.current * dt;
      scene.update(daysRef.current);

      // 标签定位：直接改 DOM
      for (const p of scene.labels()) {
        const el = labelRefs.current[p.id];
        if (!el) continue;
        el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`;
        el.style.visibility = p.visible ? 'visible' : 'hidden';
      }

      // 面板与日期读数：约 6fps 够用，不必每帧
      beat += dt;
      if (beat > 0.16) { beat = 0; setBeat((x) => x + 1); }
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => { rateRef.current = rateOf(rateId).daysPerSec; }, [rateId]);

  /* ---------- 交互 ---------- */
  const select = (id: string | null) => { setSelId(id); sceneRef.current?.focus(id); };

  if (glError) {
    return (
      <section className="card">
        <h2>太阳系 · 3D 公转</h2>
        <p className="sub">
          当前浏览器没能建立 WebGL 上下文，3D 视图无法显示。波形视图与表格不受影响。
        </p>
      </section>
    );
  }

  return (
    <section className="card solar-card">
      <h2>太阳系 · 3D 公转</h2>
      <p className="sub">
        八颗行星按<b>真实恒星周期与 J2000 平黄经</b>绕太阳运行：地球 365.2422 天一圈，
        海王星 60182 天一圈，互相之间的比例是真的。拖动旋转视角、滚轮缩放；
        点行星或下面的名称可聚焦，并看它自己的真实参数。
      </p>

      <div className="solar-bar">
        <div className="ctl">
          <label htmlFor="solarRate">倍率</label>
          <select id="solarRate" value={rateId}
                  onChange={(e) => setRateId(e.target.value)}>
            {RATES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
        <button className="play" type="button"
                aria-label={playing ? '暂停' : '播放'}
                onClick={() => setPlaying((p) => !p)}>{playing ? '❚❚' : '▶'}</button>
        <span className="solar-date" aria-live="off">{dateOf(daysRef.current)}</span>
        <div className="spacer" />
        <button className="ghost" type="button" onClick={() => select(null)}>回到全景</button>
      </div>

      <div className="solar-stage" ref={hostRef}>
        <canvas ref={canvasRef} className="solar-canvas"
                onClick={(ev) => {
                  const hit = sceneRef.current?.pick(ev.clientX, ev.clientY);
                  if (hit) select(hit.id);
                }}
                aria-label="太阳系三维公转视图，可拖动旋转、滚轮缩放" />
        {[SUN, ...BODIES].map((b) => (
          <button key={b.id} type="button"
                  ref={(el) => { labelRefs.current[b.id] = el; }}
                  className="solar-label"
                  data-active={selId === b.id}
                  style={{ ['--c' as string]: b.color }}
                  onClick={(ev) => { ev.stopPropagation(); select(b.id); }}>
            <span className="sl-dot" />{b.name}
          </button>
        ))}
      </div>

      <div className="solar-legend" role="group" aria-label="太阳系天体">
        {[SUN, ...BODIES].map((b) => (
          <button key={b.id} type="button" className="sl-chip"
                  aria-pressed={selId === b.id}
                  onClick={() => select(b.id)}>
            <span className="sl-dot" style={{ background: b.color }} />{b.name}
          </button>
        ))}
      </div>

      <p className="solar-note">{SCALE_NOTE}</p>

      {selBody && (
        <BodyPreview
          body={selBody}
          days={daysRef.current}
          onClose={() => select(null)}
          onSync2D={() => {
            // 单向：3D → 2D。把 2D 的钟拨到这个日期并暂停，免得它接着漂走
            clock.days = daysRef.current;
            clock.playing = false;
            poke();
            onSync2D?.(daysRef.current);
          }}
        />
      )}
    </section>
  );
}
