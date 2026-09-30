import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';

/**
 * 整个应用只有这一个时钟：一个从 2020-01-01 起的天数（含小数）。
 * 全部曲线都由它按各自的周期算相位，所以时间是同一条，速度却各按各的。
 *
 * 关键设计：**动画期间不触发 React 重渲染。**
 *
 * 74 张曲线卡片以 60fps 更新；若用 setState 驱动，每帧要 diff 74 棵 SVG 子树，
 * 必然卡死。所以这里把「天数」存在 ref 里，由一个 rAF 循环推进，
 * 再通过一组命令式订阅者（subscribers）把新值直接写进 DOM——
 * 与原来那版单文件里的 render() 做法一致。
 *
 * React 的 state 只承载结构性变化：当前视图、行业、可见尺度、主题……
 * 那些变化频率是「每次点击一次」，与 60fps 无关。
 */

export interface ClockHandle {
  /** 当前天数（从 2020-01-01 起，含小数）。读取不走 React，所以不会引起重渲染。 */
  getDays: () => number;
  /** 直接设定天数（拖动时刻滑块、或 3D 视图用自己的倍率推进时用） */
  setDays: (d: number) => void;
  /** 推进天数（rAF 循环内部用） */
  advance: (deltaDays: number) => void;
  /** 注册一个命令式更新函数，返回退订函数。回调签名与 render() 同一份语义。 */
  subscribe: (fn: (days: number) => void) => () => void;
  /** 立刻把当前天数推给所有订阅者（结构变化后需要重画一次时用） */
  flush: () => void;
  isPlaying: () => boolean;
  setPlaying: (p: boolean) => void;
  getSpeed: () => number;
  setSpeed: (s: number) => void;
}

export interface ClockOptions {
  /** 起始天数 */
  initialDays: number;
  /** 一天对应多少秒；speed 越大走得越快（state.days += speed * dt / 24） */
  initialSpeed?: number;
  /** 是否随 prefers-reduced-motion 暂停 */
  reducedMotion?: boolean;
}

export function createClock(opts: ClockOptions): ClockHandle {
  let days = opts.initialDays;
  let speed = opts.initialSpeed ?? 1.5;
  let playing = !opts.reducedMotion;

  const subs = new Set<(d: number) => void>();

  return {
    getDays: () => days,
    setDays: (d) => { days = d; },
    advance: (delta) => { days += delta; },
    subscribe: (fn) => { subs.add(fn); return () => { subs.delete(fn); }; },
    flush: () => { subs.forEach((fn) => fn(days)); },
    isPlaying: () => playing,
    setPlaying: (p) => { playing = p; },
    getSpeed: () => speed,
    setSpeed: (s) => { speed = s; },
  };
}

/**
 * 把 createClock 的实例挂到组件生命周期上：一个 rAF 循环，卸载时停掉。
 * `onTick` 每帧收到最新天数；它应当在内部直接改 DOM，而不是 setState。
 */
export function useClockLoop(clock: ClockHandle, onTick: (days: number) => void, playing: boolean) {
  const rafRef = useRef(0);
  const prevRef = useRef(0);
  const tickRef = useRef(onTick);
  const playingRef = useRef(playing);

  tickRef.current = onTick;
  playingRef.current = playing;

  useEffect(() => {
    const step = (now: number) => {
      if (!prevRef.current) prevRef.current = now;
      const dt = Math.min(0.1, (now - prevRef.current) / 1000);
      prevRef.current = now;
      if (playingRef.current) {
        clock.advance(clock.getSpeed() * dt / 24);   // 一天 = 24 / speed 秒
      }
      tickRef.current(clock.getDays());
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [clock]);
}

/**
 * 订阅时钟的某个派生量。用于「需要在 React 里显示的、低频的」读数
 * （例如顶栏的日期），不用于逐帧的曲线更新——那种一律走 clock.subscribe 直接写 DOM。
 */
export function useClockValue<T>(clock: ClockHandle, pick: (days: number) => T, throttleMs = 200): T {
  return useSyncExternalStore(
    useCallback((cb) => {
      let last = 0;
      return clock.subscribe(() => {
        const now = performance.now();
        if (now - last < throttleMs) return;
        last = now;
        cb();
      });
    }, [clock, throttleMs]),
    () => pick(clock.getDays()),
  );
}
