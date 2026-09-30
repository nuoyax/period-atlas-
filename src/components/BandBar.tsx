import { LEVELS } from '../data/levels.ts';
import { indCount, seriesOf } from '../data/catalogue.ts';
import type { IndustryId } from '../data/industries.ts';

interface Props {
  ind: IndustryId | 'all';
  levels: Set<string>;
  onToggle: (id: string) => void;
}

/**
 * 尺度按钮条：决定五层里哪几层可见。
 * 「最多只能关到剩一层」——与原版一致，至少留一层，否则页面会整片空白。
 */
export function BandBar({ ind, levels, onToggle }: Props) {
  return (
    <div className="bands" role="group" aria-label="按时间尺度筛选">
      {LEVELS.map((l) => {
        const n = seriesOf(ind, l.id).length;
        const on = levels.has(l.id);
        return (
          <button key={l.id} type="button"
                  data-lv={l.id}
                  aria-pressed={on}
                  disabled={n === 0}
                  style={{ ['--t' as string]: `var(${l.cvar})` }}
                  onClick={() => onToggle(l.id)}>
            <span className="sw" />
            <span>{l.full} · {l.name}</span>
            <span className="n">
              {indCount(ind)} 条中 {n} 条 · {l.spanText}
            </span>
          </button>
        );
      })}
    </div>
  );
}
