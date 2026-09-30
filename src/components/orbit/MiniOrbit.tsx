import { BODIES, SUN, orbitRadius, meanLongitude } from './bodies.ts';
import type { BodyDef } from './bodies.ts';

/**
 * 预览面板里的「俯视小轨道图」。
 *
 * 它与 3D 场景用的是**同一套显示尺度**（orbitRadius），所以小图上的位置和
 * 大画面里的位置永远一致；但它只画轨道圈和当前位置，不画别的行星，
 * 免得小图上出现一堆分不清谁是谁的点。
 *
 * 轨道按圆形近似（场景同样如此），这一点在面板文字里如实写出来。
 */

const R = 108, CX = 130, CY = 130;

export function MiniOrbit({ body, days }: { body: BodyDef; days: number }) {
  const isSun = body.id === 'sun';
  // 显示尺度下的最大轨道半径，用来把小图缩放到画布内
  const maxR = orbitRadius(BODIES[BODIES.length - 1].aAU);
  const k = (R * 0.92) / maxR;

  const lon = meanLongitude(body, days) * Math.PI / 180;
  const d = orbitRadius(body.aAU) * k;
  const x = CX + d * Math.cos(lon);
  const y = CY - d * Math.sin(lon);

  return (
    <svg className="miniorbit" viewBox="0 0 260 260" role="img"
         aria-label={`${body.name} 的轨道俯视图，圆点是它的当前位置`}>
      {/* 太阳 */}
      <circle cx={CX} cy={CY} r={isSun ? 10 : 5} fill="var(--solar-sun)" />
      {/* 参考：地球轨道（不是选中的那颗时才画，避免和选中轨道重合） */}
      {!isSun && body.id !== 'earth' && (
        <circle cx={CX} cy={CY} r={orbitRadius(1.0) * k}
                fill="none" stroke="var(--grid)" strokeWidth={1} strokeDasharray="3 4" />
      )}
      {/* 全部行星轨道，极淡，给一个「这是第几条」的空间参照 */}
      {BODIES.map((b) => (
        <circle key={b.id} cx={CX} cy={CY} r={orbitRadius(b.aAU) * k}
                fill="none" stroke="var(--grid)" strokeWidth={1} opacity={0.5} />
      ))}
      {!isSun && (
        <circle cx={CX} cy={CY} r={d} fill="none"
                stroke={`var(--t3)`} strokeWidth={2} />
      )}
      {!isSun && (
        <>
          <line x1={CX} y1={CY} x2={x} y2={y}
                stroke={`var(--t3)`} strokeWidth={1} opacity={0.45} />
          <circle cx={x} cy={y} r={6} fill={body.color}
                  stroke="var(--surface-1)" strokeWidth={2} />
        </>
      )}
      <text x={CX} y={CY - 16} textAnchor="middle" className="mo-cap">
        {isSun ? '太阳' : body.name}
      </text>
    </svg>
  );
}

export { SUN };
