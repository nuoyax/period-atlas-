import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  BODIES, SUN, orbitRadius, bodyRadius, meanLongitude, SCALE_NOTE,
} from './bodies.ts';
import type { BodyDef } from './bodies.ts';
import { makeTexture } from './textures.ts';

/**
 * 太阳系场景（命令式，不含 React）。
 *
 * 与 2D 那边的分工一致：React 只负责「挂载/卸载画布」，60fps 的转动由这里
 * 自己驱动。行星位置由 update(days) 一次性算完，不经过任何 React state。
 *
 * 光照上有一处**必须**这么写的地方：PointLight 的 decay 设为 0。
 * three r155 起默认物理正确光照，光强按 1/r² 衰减——照真实轨道距离算，
 * 海王星收到的光照只有地球的约 1/900，屏幕上会变成一颗纯黑的球。
 * decay = 0 让光强不随距离衰减，这是示意图的取舍，不是错误。
 */

export interface LabelPoint {
  id: string;
  name: string;
  /** 画布内像素坐标（左上原点） */
  x: number;
  y: number;
  /** 是否在相机前方且落在画布内 */
  visible: boolean;
  /** 到相机的距离（显示尺度单位），用于按远近排序 */
  dist: number;
}

export interface SolarScene {
  /** 按天数更新所有行星位置与自转 */
  update: (days: number) => void;
  /** 相机对准某个天体（预览用）；传 null 回到全景 */
  focus: (id: string | null) => void;
  resize: () => void;
  /** 屏幕坐标 → 命中天体，用于点选 */
  pick: (clientX: number, clientY: number) => BodyDef | null;
  /** 当前聚焦的天体 id（null = 全景） */
  focused: () => string | null;
  /** 把各天体投影到画布坐标，供 HTML 标签定位 */
  labels: () => LabelPoint[];
  /** 某天体在世界坐标里的位置，供面板显示 */
  worldPos: (id: string) => { x: number; y: number; z: number } | null;
  dispose: () => void;
}

interface Entry {
  def: BodyDef;
  pivot: THREE.Group;     // 在轨道面上的定位组（承担轨道倾角）
  spinner: THREE.Object3D;    // 承担自转（其父级承担自转轴倾角）
  mesh: THREE.Mesh;
  orbit: THREE.LineLoop;
}

const DEG = Math.PI / 180;

export function createSolarScene(canvas: HTMLCanvasElement): SolarScene {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.5, 4000);
  camera.position.set(0, 78, 150);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 8;
  controls.maxDistance = 900;
  controls.zoomSpeed = 0.8;
  controls.rotateSpeed = 0.55;

  /* ---------- 光照 ---------- */
  const sunLight = new THREE.PointLight(0xfff2d8, 3.2, 0, 0);   // decay=0，见文件头注释
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x556070, 0.55));

  /* ---------- 星空背景：不加载贴图，直接用点云 ---------- */
  {
    const n = 1400, pos = new Float32Array(n * 3);
    let s = 987654321;
    const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    for (let i = 0; i < n; i++) {
      // 球壳上均匀取点
      const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = 900 + rnd() * 400;
      const w = Math.sqrt(1 - u * u);
      pos[i * 3] = r * w * Math.cos(th);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * w * Math.sin(th);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xffffff, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.55,
    })));
  }

  /* ---------- 太阳 ---------- */
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(bodyRadius(SUN.radiusKm, true), 48, 32),
    new THREE.MeshBasicMaterial({ map: makeTexture(SUN) }),   // 自发光体，不吃光照
  );
  scene.add(sunMesh);

  // 光晕：一层加色混合的 sprite，让太阳看起来「亮」而不只是「黄」
  {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const g = cv.getContext('2d')!;
    const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    rg.addColorStop(0.00, 'rgba(255,238,180,0.95)');
    rg.addColorStop(0.22, 'rgba(255,200,90,0.42)');
    rg.addColorStop(0.55, 'rgba(255,160,50,0.10)');
    rg.addColorStop(1.00, 'rgba(255,140,30,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    }));
    halo.scale.setScalar(34);
    scene.add(halo);
  }

  /* ---------- 行星 ---------- */
  const entries: Entry[] = [];

  for (const b of BODIES) {
    const d = orbitRadius(b.aAU);
    const r = bodyRadius(b.radiusKm);

    // 轨道面组：绕 x 轴转轨道倾角，轨道线与行星都挂进来，二者始终共面
    const plane = new THREE.Group();
    plane.rotation.x = b.inclDeg * DEG;
    scene.add(plane);

    // 轨道线：细线、低对比，退到背景里
    const segs = 256, pts: number[] = [];
    for (let i = 0; i < segs; i++) {
      const th = (i / segs) * Math.PI * 2;
      pts.push(d * Math.cos(th), 0, d * Math.sin(th));
    }
    const og = new THREE.BufferGeometry();
    og.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const orbit = new THREE.LineLoop(og, new THREE.LineBasicMaterial({
      color: new THREE.Color(b.color).multiplyScalar(0.42), transparent: true, opacity: 0.6,
    }));
    plane.add(orbit);

    // 定位组 → 自转轴组（承担倾角，**固定不动**）→ 自转组（绕自身轴转）→ 球体/光环
    //
    // 倾角必须挂在自转**之外**那一层：转轴方向是固定的，转的是行星本身。
    // 若把两者合进同一个 group（rotation.z = 倾角、rotation.y = 自转角），
    // three 的 Euler 默认 XYZ 序会合成 R = Rx·Ry·Rz，倾角那一项被自转角带偏——
    // 实算下来自转轴每圈摆动近 60°，光环跟着一起「转」，土星看着像在乱晃。
    const pivot = new THREE.Group();
    plane.add(pivot);

    const axis = new THREE.Group();
    axis.rotation.z = b.tiltDeg * DEG;
    pivot.add(axis);

    const spinner = new THREE.Group();
    axis.add(spinner);

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 40, 28),
      new THREE.MeshStandardMaterial({
        map: makeTexture(b), roughness: 0.92, metalness: 0.0,
        // 背光面不完全黑：加一点自发光当环境反射，否则远行星看起来像剪影
        emissive: new THREE.Color(b.color).multiplyScalar(0.10),
      }),
    );
    spinner.add(mesh);

    if (b.ring) {
      const rg = new THREE.RingGeometry(r * b.ring.inner, r * b.ring.outer, 96);
      // RingGeometry 建在 xy 平面，转到 xz 才与赤道平行
      rg.rotateX(-Math.PI / 2);
      const rm = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({
        color: b.ring.color, transparent: true, opacity: b.ring.opacity,
        side: THREE.DoubleSide, depthWrite: false,
      }));
      spinner.add(rm);
    }

    entries.push({ def: b, pivot, spinner, mesh, orbit });
  }

  /* ---------- 位置更新 ---------- */
  // 显示尺度下把行星体积也算进去，避免木星把水星轨道吃掉；轨道本身按定义画
  function place(days: number) {
    for (const e of entries) {
      const lon = meanLongitude(e.def, days) * DEG;
      const d = orbitRadius(e.def.aAU);
      e.pivot.position.set(d * Math.cos(lon), 0, -d * Math.sin(lon));
      // 自转：真实自转周期，符号即转向（金星、天王星为逆向）；
      // 转的是 spinner，上面那层 axis 的倾角固定不动
      e.spinner.rotation.y = (days * 24 / e.def.rotHours) * Math.PI * 2;
    }
    sunMesh.rotation.y = (days * 24 / SUN.rotHours) * Math.PI * 2;
  }

  /* ---------- 相机聚焦 ---------- */
  let focusId: string | null = null;
  const camTarget = new THREE.Vector3(0, 0, 0);
  const wantTarget = new THREE.Vector3(0, 0, 0);
  let wantDist = 0;         // 0 表示不需要改距离

  function focus(id: string | null) {
    focusId = id;
    if (id === null) {
      wantTarget.set(0, 0, 0);
      wantDist = 165;
      return;
    }
    if (id === 'sun') {
      wantTarget.set(0, 0, 0);
      wantDist = 46;
      return;
    }
    const e = entries.find((x) => x.def.id === id);
    if (!e) { wantTarget.set(0, 0, 0); wantDist = 165; return; }
    wantTarget.copy(e.pivot.position);
    wantDist = Math.max(6, bodyRadius(e.def.radiusKm) * 7);
  }

  /* ---------- 点选 ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function pick(clientX: number, clientY: number): BodyDef | null {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(
      [sunMesh, ...entries.map((e) => e.mesh)], false);
    if (!hits.length) return null;
    const o = hits[0].object;
    if (o === sunMesh) return SUN;
    return (o.userData as { def: BodyDef }).def;
  }
  for (const e of entries) e.mesh.userData = { def: e.def };
  sunMesh.userData = { def: SUN };

  /* ---------- 尺寸 ---------- */
  function resize() {
    const w = canvas.clientWidth || 640;
    const h = canvas.clientHeight || 420;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  /* ---------- 每帧 ---------- */

  function update(days: number) {
    place(days);

    // 聚焦时目标跟着行星走（跟随），距离只在切换聚焦时改一次，之后交给用户滚轮
    if (focusId) {
      const e = entries.find((x) => x.def.id === focusId);
      if (e) wantTarget.copy(e.pivot.position);
    }
    camTarget.lerp(wantTarget, 0.12);
    controls.target.copy(camTarget);

    if (wantDist > 0) {
      const dir = camera.position.clone().sub(camTarget);
      const len = dir.length() || 1;
      const next = len + (wantDist - len) * 0.12;
      camera.position.copy(camTarget).add(dir.multiplyScalar(next / len));
      if (Math.abs(next - wantDist) < 0.6) wantDist = 0;
    }

    controls.update();
    renderer.render(scene, camera);
  }

  /* ---------- 标签投影 ---------- */
  const v3 = new THREE.Vector3();

  function labels(): LabelPoint[] {
    const w = canvas.clientWidth || 640;
    const h = canvas.clientHeight || 420;
    const out: LabelPoint[] = [];
    for (const e of [...entries.map((x) => x), { def: SUN, pivot: sunMesh } as unknown as Entry]) {
      const def = (e as Entry).def;
      const obj = e.pivot;
      v3.setFromMatrixPosition(obj.matrixWorld);
      v3.project(camera);
      out.push({
        id: def.id,
        name: def.name,
        x: (v3.x * 0.5 + 0.5) * w,
        y: (-v3.y * 0.5 + 0.5) * h,
        visible: v3.z > -1 && v3.z < 1 && Math.abs(v3.x) < 1.25 && Math.abs(v3.y) < 1.25,
        dist: camera.position.distanceTo(v3.setFromMatrixPosition(obj.matrixWorld)),
      });
    }
    return out;
  }

  function worldPos(id: string) {
    const obj = id === 'sun' ? sunMesh : entries.find((e) => e.def.id === id)?.pivot;
    if (!obj) return null;
    v3.setFromMatrixPosition(obj.matrixWorld);
    return { x: v3.x, y: v3.y, z: v3.z };
  }

  function dispose() {
    controls.dispose();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat) mat.dispose();
    });
    renderer.dispose();
  }

  return { update, focus, resize, pick, focused: () => focusId, labels, worldPos, dispose };
}

export { SCALE_NOTE, BODIES, SUN };
