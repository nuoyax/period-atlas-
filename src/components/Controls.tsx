import { useRef } from 'react';
import { IndSel } from './IndSel.tsx';
import type { IndustryId } from '../data/industries.ts';
import type { ViewId } from './views.ts';
import { clock, poke, subscribe } from '../model/clock.ts';
import { fmt } from '../model/math.ts';
import { longReadout } from '../model/readout.ts';

interface Props {
  ind: IndustryId | 'all';
  onInd: (v: IndustryId | 'all') => void;
  speed: number;
  onSpeed: (v: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  view: ViewId;
  onView: (v: ViewId) => void;
  ringOk: boolean;
  table: boolean;
  onTable: () => void;
}

/**
 * 一行控件，作用于下方全部图表。
 *
 * 时刻滑块与两处时钟读数都是**非受控**的：它们的值由 60fps 的时钟直接写 DOM。
 * 若交给 React 渲染 value/text，两边的写入会打架、滑块会抖。
 */
export function Controls(p: Props) {
  return (
    <div className="controls">
      <div className="ctl">
        <label htmlFor="indSel">行业</label>
        <IndSel value={p.ind} onChange={p.onInd} />
      </div>

      <div className="ctl">
        <label htmlFor="speed">速度</label>
        <select id="speed" value={String(p.speed)}
                onChange={(e) => p.onSpeed(parseFloat(e.target.value))}>
          <option value="0.5">慢 · 一天 48 秒</option>
          <option value="1.5">常速 · 一天 16 秒</option>
          <option value="3">快 · 一天 8 秒</option>
        </select>
      </div>

      <div className="ctl">
        <button className="play" type="button"
                aria-label={p.playing ? '暂停' : '播放'}
                onClick={p.onTogglePlay}>{p.playing ? '❚❚' : '▶'}</button>
      </div>

      <Scrub />

      <div className="ctl">
        <LongClock />
      </div>

      <div className="spacer" />

      <div className="ctl">
        <label>视图</label>
        <div className="seg" id="viewSeg">
          <button type="button" aria-pressed={p.view === 'wave'}
                  onClick={() => p.onView('wave')}>波形</button>
          <button type="button" aria-pressed={p.view === 'ring'}
                  disabled={!p.ringOk}
                  onClick={() => p.onView('ring')}>相位轮</button>
          <button type="button" aria-pressed={p.view === 'solar'}
                  onClick={() => p.onView('solar')}>太阳系</button>
        </div>
      </div>

      <button className="ghost" type="button" aria-pressed={p.table}
              onClick={p.onTable}>表格视图</button>
    </div>
  );
}

/** 时刻滑块 + 当前钟点。拖的是「一天里的钟点」，所以只重排一天这一层的时间。 */
function Scrub() {
  const rangeRef = useRef<HTMLInputElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);

  useTick((days) => {
    const t = (((days % 1) + 1) % 1) * 24;
    if (clockRef.current) clockRef.current.textContent = fmt(t);
    if (rangeRef.current) rangeRef.current.value = String(Math.round(t * 60) % 1440);
  });

  return (
    <div className="ctl">
      <label htmlFor="scrub">时刻</label>
      <input ref={rangeRef} id="scrub" type="range" min={0} max={1440} step={5}
             defaultValue={180}
             aria-label="拖动调整当前时刻（作用于 24 小时这一层的所有曲线）"
             onInput={(e) => {
               const tgt0 = parseInt((e.target as HTMLInputElement).value, 10) / 60;
               const cur0 = (((clock.days % 1) + 1) % 1) * 24;
               clock.days += (tgt0 - cur0) / 24;
               clock.playing = false;
               poke();
             }} />
      <span className="clock" ref={clockRef}>03:00</span>
    </div>
  );
}

/** 长尺度读数：一天之外四层各报一个「现在到哪了」 */
function LongClock() {
  const ref = useRef<HTMLSpanElement>(null);
  useTick((days) => {
    if (ref.current) ref.current.textContent = longReadout(days);
  }, 120);
  return <span className="longclock" ref={ref} aria-live="off" />;
}

/** 订阅时钟写 DOM；throttleMs 用于低频文本（不必每帧刷）。 */
function useTick(fn: (days: number) => void, throttleMs = 0) {
  const f = useRef(fn);
  f.current = fn;
  const last = useRef(0);
  const un = useRef<(() => void) | null>(null);
  if (!un.current) {
    un.current = subscribe((days) => {
      const now = performance.now();
      if (throttleMs && now - last.current < throttleMs) return;
      last.current = now;
      f.current(days);
    });
    poke();
  }
}
