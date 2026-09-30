import type { BodyDef } from './bodies.ts';
import { AU_KM, dateOf, meanLongitude, orbitPhase } from './bodies.ts';
import { MiniOrbit } from './MiniOrbit.tsx';

/**
 * 天体预览面板。
 *
 * 三条自我约束：
 *  1. **单位真实、不假精度**：半径按 km 报，超过 1 万 km 才进位到「万 km」，
 *     半长轴同时给 AU 与 km，周期给天与年——不出现「约 1.5 AU」这种省掉有效位数的写法。
 *  2. **平黄经要写明是平黄经**：它没算偏心率与摄动，直接当真实位置会误导。
 *  3. 迷你轨道图画的是**圆形近似**，也写在面板里。
 */
export function BodyPreview({
  body, days, onSync2D, onClose,
}: {
  body: BodyDef;
  days: number;
  onSync2D: () => void;
  onClose: () => void;
}) {
  const isSun = body.id === 'sun';

  const km = body.radiusKm;
  const radiusText = km >= 10000
    ? (km / 10000).toFixed(2) + ' 万 km'
    : km.toFixed(km >= 100 ? 0 : 1) + ' km';

  const row = (k: string, v: string) => (
    <div className="bp-row"><dt>{k}</dt><dd>{v}</dd></div>
  );

  return (
    <aside className="body-preview" aria-label={`${body.name} 预览`}>
      <div className="bp-head">
        <span className="bp-dot" style={{ background: body.color }} />
        <h3>{body.name}</h3>
        <button className="bp-x" type="button" aria-label="关闭预览"
                onClick={onClose}>×</button>
      </div>

      <MiniOrbit body={body} days={days} />

      <dl className="bp-rows">
        {row('赤道半径（真实）', radiusText)}
        {!isSun && row('轨道半长轴（真实）',
          body.aAU.toFixed(5) + ' AU · ' + Math.round(body.aAU * AU_KM).toLocaleString('en-US') + ' km')}
        {!isSun && row('恒星周期（真实）',
          body.periodDays.toFixed(body.periodDays < 100 ? 3 : 2) + ' 天 · ' +
          (body.periodDays / 365.2422).toFixed(2) + ' 年')}
        {isSun && row('自转周期（真实）', (body.rotHours / 24).toFixed(2) + ' 天（赤道约 25 天 / 极区约 35 天）')}
        {row('自转轴倾角（真实）', body.tiltDeg.toFixed(2) + '°' + (body.rotHours < 0 ? ' · 逆向自转' : ''))}
        {row('轨道倾角（真实）', isSun ? '—' : body.inclDeg.toFixed(3) + '°（相对黄道）')}
        {!isSun && row('当前本圈进度', (orbitPhase(body, days) * 100).toFixed(1) + '%')}
        {!isSun && row('当前平黄经', meanLongitude(body, days).toFixed(2) + '°')}
        {row('当前日期', dateOf(days))}
      </dl>

      <p className="bp-note">{body.note}</p>
      <p className="bp-caveat">
        平黄经只含历元与平均运动，未计偏心率与摄动；轨道在画面上按圆形近似。
        半径与半长轴为真实值，画面上的大小与距离是压缩后的。
      </p>

      <button className="ghost bp-sync" type="button" onClick={onSync2D}>
        同步回 2D（把这个日期交给波形视图）
      </button>
    </aside>
  );
}
