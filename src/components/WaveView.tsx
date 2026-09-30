import { INDUSTRIES } from '../data/industries.ts';
import type { IndustryId } from '../data/industries.ts';
import { LEVELS } from '../data/levels.ts';
import { SER, seriesOf, indCount } from '../data/catalogue.ts';
import { WaveCard } from './WaveCard.tsx';

/** 分组顺序：由短到长（读者先看熟悉的日尺度，再往下看更长的） */
const ORDER = ['week', 'month', 'season', 'year', 'day'] as const;

interface Props {
  ind: IndustryId | 'all';
  levels: Set<string>;
}

/**
 * 波形视图：按行业 → 时间尺度分组的小图。
 *
 * 卡片在挂载时一次性建好，显隐交给 hidden —— 这样切换筛选不会丢掉各条曲线的相位
 * （phaseOf 对被筛掉的曲线返回 null，相位就停在切走的那一刻）。
 * 一个行业区块在当前筛选下若一条都不显示，则整块隐藏并给一句提示。
 */
export function WaveView({ ind, levels }: Props) {
  const okS = (i: IndustryId) => ind === 'all' || i === ind;

  return (
    <div id="waveView">
      {INDUSTRIES.map((ind0) => {
        if (!indCount(ind0.id)) return null;
        const mine = SER.filter((s) => s.ind === ind0.id);
        const visibleCount = mine.filter((s) => okS(s.ind!) && levels.has(s.lv)).length;
        const reachable = mine.filter((s) => okS(s.ind!) && s.lv === 'day').length; // 是否有日尺度
        void reachable;

        return (
          <section className="ind-sec" data-ind={ind0.id} key={ind0.id}>
            <div className="sec-head ind-head" style={{ ['--t' as string]: 'var(--t3)' }}>
              <h2>{ind0.name}</h2>
              <span className="rule" />
              <span className="meta">{ind0.desc} · 共 {indCount(ind0.id)} 条周期</span>
            </div>
            <div className="ind-body">
              {ORDER.map((lid) => {
                const list = seriesOf(ind0.id, lid);
                if (!list.length) return null;
                const lv = LEVELS.find((l) => l.id === lid)!;
                const shown = list.filter((s) => okS(s.ind!) && levels.has(s.lv));
                return (
                  <div key={lid}>
                    <div className="sub-head" data-lv={lid} hidden={shown.length === 0}>
                      <b>尺度 {'①②③④⑤'[lv.i]}</b>
                      <span className="sh-lv">{lv.full}（{lv.name}）· 周期 {lv.spanText}</span>
                      <span className="sh-n">{shown.length} 条</span>
                    </div>
                    {list.map((s) => {
                      const visible = okS(s.ind!) && levels.has(s.lv);
                      /* 被筛掉的卡片要整块藏起来；用 style.display 而不是 hidden 属性，
                         因为 .sub-head 的样式里没有 [hidden] 规则，只有 .ind-sec 有。 */
                      return (
                        <div key={s.i} style={{ display: visible ? undefined : 'none' }}>
                          <WaveCard s={s} ind={ind} visible={visible} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <p className="ind-empty" hidden={visibleCount > 0}>
                这个行业在当前时间尺度筛选下没有曲线 —— 把上方对应的尺度打开即可看到。
              </p>
            </div>
          </section>
        );
      })}
    </div>
  );
}
