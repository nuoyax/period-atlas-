import { INDUSTRIES } from '../data/industries.ts';
import type { IndustryId } from '../data/industries.ts';
import { indCount } from '../data/catalogue.ts';

/** 行业下拉框：一个 select，选谁只看谁。选项后带条数，方便一眼看出各行业规模。 */
export function IndSel({ value, onChange }: {
  value: IndustryId | 'all';
  onChange: (v: IndustryId | 'all') => void;
}) {
  return (
    <select id="indSel" aria-label="按行业筛选周期曲线"
            value={value}
            onChange={(e) => onChange(e.target.value as IndustryId | 'all')}>
      <option value="all">全部行业（{indCount('all')} 条）</option>
      {INDUSTRIES.filter((x) => indCount(x.id)).map((x) => (
        <option key={x.id} value={x.id}>
          {x.name}（{indCount(x.id)} 条）
        </option>
      ))}
    </select>
  );
}
