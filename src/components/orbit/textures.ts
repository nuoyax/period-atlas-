import * as THREE from 'three';
import type { BodyDef } from './bodies.ts';

/**
 * 程序化贴图：不下载任何外部资源，全部用 canvas 现画。
 *
 * 为什么不用真实影像：一是本工程零外部依赖，二是行星影像的授权条款各不相同。
 * 画出来的纹理当然不是真的，但它把「气态巨行星有条带 / 岩质行星斑驳 / 地球有海陆」
 * 这些**结构性特征**表现出来，比九个纯色球更像太阳系，也不会误导成实拍。
 */

const W = 512, H = 256;

/** 确定性伪随机：同一个种子每次跑出同一张图，截图才可复现 */
function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

/** 由 id 派生稳定种子 */
function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
const css = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;

/** 阴阳：往基色里混白或混黑 */
function shade(base: string, t: number): string {
  const c = hexToRgb(base);
  const to = t >= 0 ? [255, 255, 255] : [0, 0, 0];
  const k = Math.abs(t);
  return css([mix(c[0], to[0], k), mix(c[1], to[1], k), mix(c[2], to[2], k)]);
}

/** 岩质行星：基色 + 大小不一的斑块（环形山/沙漠/荒原） */
function paintRocky(g: CanvasRenderingContext2D, b: BodyDef) {
  const rand = rng(seedOf(b.id));
  g.fillStyle = b.tint;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    const r = 2 + rand() * 22;
    const x = rand() * W, y = rand() * H;
    g.globalAlpha = 0.06 + rand() * 0.14;
    g.fillStyle = shade(b.tint, (rand() - 0.5) * 0.8);
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
}

/** 气态巨行星：纬向条带 + 轻微湍流 */
function paintBands(g: CanvasRenderingContext2D, b: BodyDef) {
  const rand = rng(seedOf(b.id));
  g.fillStyle = b.tint;
  g.fillRect(0, 0, W, H);
  let y = 0;
  while (y < H) {
    const h = 4 + rand() * 26;
    g.fillStyle = shade(b.tint, (rand() - 0.5) * 0.55);
    // 条带两端略收，避免出现生硬的直边
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, y + Math.sin(x / 41 + y) * 2.2);
    for (let x = W; x >= 0; x -= 16) g.lineTo(x, y + h + Math.sin(x / 37 + y) * 2.2);
    g.closePath(); g.fill();
    y += h;
  }
  // 湍流小涡
  for (let i = 0; i < 140; i++) {
    g.globalAlpha = 0.05 + rand() * 0.1;
    g.fillStyle = shade(b.tint, (rand() - 0.5) * 0.9);
    g.beginPath();
    g.ellipse(rand() * W, rand() * H, 6 + rand() * 30, 2 + rand() * 6, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

/**
 * 地球：海陆 + 极冠。
 *
 * 用两层噪声阈值分海陆，不追真实海岸线——只要看出「蓝色球体上有一块块陆地、
 * 两极发白」就达到目的。
 */
function paintEarth(g: CanvasRenderingContext2D, b: BodyDef) {
  const rand = rng(seedOf(b.id));
  // 海洋底色
  g.fillStyle = '#12386f';
  g.fillRect(0, 0, W, H);
  // 海洋深浅
  for (let i = 0; i < 200; i++) {
    g.globalAlpha = 0.08;
    g.fillStyle = rand() > 0.5 ? '#0e2b56' : '#1c4f93';
    g.beginPath(); g.arc(rand() * W, rand() * H, 10 + rand() * 40, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  // 陆地：用几个团块叠加，边缘随机
  const land = ['#2f6b3a', '#4a7c3f', '#7a6a44', '#38603a'];
  for (let c = 0; c < 9; c++) {
    const cx = rand() * W, cy = 30 + rand() * (H - 60);
    const cr = 22 + rand() * 46;
    for (let i = 0; i < 60; i++) {
      const a = rand() * Math.PI * 2, d = rand() * cr;
      g.fillStyle = land[(rand() * land.length) | 0];
      g.globalAlpha = 0.5 + rand() * 0.5;
      g.beginPath();
      g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6, 8 + rand() * 22, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
  // 极冠（上下各压一层白，带羽化）
  const ice = g.createLinearGradient(0, 0, 0, 34);
  ice.addColorStop(0, 'rgba(255,255,255,.95)');
  ice.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = ice; g.fillRect(0, 0, W, 34);
  const ice2 = g.createLinearGradient(0, H, 0, H - 34);
  ice2.addColorStop(0, 'rgba(255,255,255,.95)');
  ice2.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = ice2; g.fillRect(0, H - 34, W, 34);
}

/** 太阳：亮黄底 + 米粒组织颗粒，配 emissive 材质自发光 */
function paintSun(g: CanvasRenderingContext2D, b: BodyDef) {
  const rand = rng(seedOf(b.id));
  g.fillStyle = '#ffd25e';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 500; i++) {
    g.globalAlpha = 0.05 + rand() * 0.12;
    g.fillStyle = rand() > 0.45 ? '#fff3b0' : '#f09a1e';
    g.beginPath(); g.arc(rand() * W, rand() * H, 3 + rand() * 14, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
}

/**
 * 生成一张贴图。同一 id 每次结果一致，便于截图比对。
 * 不设 anisotropy / colorSpace，交给调用方按渲染器能力决定。
 */
export function makeTexture(b: BodyDef): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  if (g) {
    if (b.surface === 'sun') paintSun(g, b);
    else if (b.surface === 'earth') paintEarth(g, b);
    else if (b.surface === 'bands') paintBands(g, b);
    else paintRocky(g, b);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}
