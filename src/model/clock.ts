import { useEffect, useRef, useState } from 'react';
import { BEST_DAY } from './bestday.ts';

/**
 * 整个应用只有这一个时钟：一个从 2020-01-01 起的天数（含小数）。
 * 全部曲线都由它按各自的周期算相位，所以时间是同一条，速度却各按各的。
 *
 * 关键设计：**动画期间不触发 React 重渲染。**
 *
 * 74 张曲线卡片以 60fps 更新；若用 setState 驱动，每帧要 diff 74 棵 SVG 子树，
 * 必然卡死。所以这里把「天数」放在一个可变的模块级对象里，由一个 rAF 循环推进，
 * 再通过一组命令式订阅者把新值直接写进 DOM —— 与原单文件里的 render() 做法一致。
 *
 * React 的 state 只承载结构性变化：当前视图、行业、可见尺度、主题……
 * 那些变化频率是「每次点击一次」，与 60fps 无关。
 */

export interface ClockState {
  /** 从 2020-01-01 起的天数（含小数） */
  days: number;
  playing: boolean;
  /** 一天多少秒 = 24 / speed */
  speed: number;
}

export const clock: ClockState = {
  days: BEST_DAY,
  playing: true,
  speed: 1.5,
};

type Sub = (days: number, dt: number) => void;
const subs = new Set<Sub>();

/** 注册一个命令式更新函数；返回退订函数。回调里请直接改 DOM，不要 setState。 */
export function subscribe(fn: Sub): () => void {
  subs.add(fn);
  return () => { subs.delete(fn); };
}

let prev = 0;
let rafId = 0;
let forceOnce = true;

function loop(now: number) {
  rafId = requestAnimationFrame(loop);
  if (!prev) prev = now;
  const dt = Math.min(0.1, (now - prev) / 1000);   // 与原版一致的钳制
  prev = now;
  if (clock.playing) clock.days += clock.speed * dt / 24;
  if (clock.playing || forceOnce) {
    forceOnce = false;
    for (const f of subs) f(clock.days, dt);
  }
}

export function startLoop() {
  if (rafId) return;
  rafId = requestAnimationFrame(loop);
}

export function stopLoop() {
  cancelAnimationFrame(rafId);
  rafId = 0;
  prev = 0;
}

/** 请求一次更新：筛选变化、拖动滑块、暂停态下改主题都要用到。 */
export function poke() { forceOnce = true; }

/* ---------------- React 绑定 ---------------- */

/** 订阅时钟做命令式更新。不会引起组件重渲染。 */
export function useClockSubscription(fn: Sub, enabled = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!enabled) return;
    const un = subscribe((d, dt) => ref.current(d, dt));
    poke();
    return un;
  }, [enabled]);
}

/** 暂停 / 播放：这是唯一需要镜像进 React state 的时钟属性（按钮字形要变）。 */
export function usePlaying(): [boolean, (v: boolean) => void] {
  const [playing, setPlayingState] = useState(clock.playing);
  const setPlaying = (v: boolean) => { clock.playing = v; setPlayingState(v); };
  return [playing, setPlaying];
}

/**
 * 顶层驱动：一个 rAF 循环。放在 App 里挂一次即可。
 * prefers-reduced-motion 时默认暂停（与原版一致）。
 */
export function ClockDriver() {
  useEffect(() => {
    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      clock.playing = false;
    }
    startLoop();
    const onVis = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      stopLoop();
    };
  }, []);
  return null;
}
