import { useEffect, useState } from 'react';
import { Controls } from './components/Controls.tsx';
import { BandBar } from './components/BandBar.tsx';
import { WaveView } from './components/WaveView.tsx';
import { RingView } from './components/RingView.tsx';
import { OrbitView } from './components/orbit/OrbitView.tsx';
import { TableView } from './components/TableView.tsx';
import { FootNote } from './components/FootNote.tsx';
import { ClockDriver, clock, poke } from './model/clock.ts';
import { useTheme } from './model/theme.ts';
import { LEVELS } from './data/levels.ts';
import type { IndustryId } from './data/industries.ts';
import { seriesOf } from './data/catalogue.ts';
import type { ViewId } from './components/views.ts';

/**
 * 顶层结构。
 *
 * 注意这里的 useState 全是**结构性**的：行业、可见尺度、视图、表格开关。
 * 它们每次点击才变一次。真正 60fps 的「天数」不在这里——见 model/clock.ts。
 */
export default function App() {
  const [ind, setInd] = useState<IndustryId | 'all'>('life');
  const [levels, setLevels] = useState<Set<string>>(
    () => new Set(LEVELS.map((l) => l.id)));
  const [view, setView] = useState<ViewId>('wave');
  const [table, setTable] = useState(false);
  const [playing, setPlaying] = useState(clock.playing);
  const [speed, setSpeed] = useState(clock.speed);
  const { dark, toggle } = useTheme();

  const toggleLevel = (id: string) => {
    setLevels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev;          // 至少留一层
        next.delete(id);
      } else next.add(id);
      return next;
    });
    poke();
  };

  const ringOk = levels.has('day') && seriesOf(ind, 'day').length > 0;

  // 尺度被关掉或换到没有日尺度曲线的行业时，相位轮要退回波形（同原版）
  useEffect(() => {
    if (!ringOk && view === 'ring') setView('wave');
  }, [ringOk, view]);

  return (
    <div className="wrap">
      <ClockDriver />

      <div className="top">
        <div>
          <h1>生活里的周期</h1>
          <p className="lead">
            从<b>一天</b>到<b>数年</b>，按时间尺度分五层：钟点、星期、月份、季节、年度；
            再按<b>行业</b>切换——农业、太空航天、海洋渔业、医疗健康……每个行业都能对到它自己的周期现象。
            每张图各自画在<b>自己真实的时间跨度</b>上，纵轴也各自标<b>自己的物理量与量程</b>——
            月相是照亮比例、潮汐是潮位、血压是收缩压、火箭是推力百分比。
            所以这是一组小图：<b>横轴各画各的周期，纵轴各用各的量纲，图与图之间不比高低</b>。
            红点跟着时钟走一遍，就是该周期的一个完整轮回。
            另有一张<b>太阳系</b>视图，把公转画成真的会转的 3D。
          </p>
        </div>
        <div className="spacer" />
        <button className="ghost" type="button" onClick={toggle}>
          {dark ? '切换浅色' : '切换深色'}
        </button>
      </div>

      <Controls
        ind={ind} onInd={(v) => { setInd(v); poke(); }}
        speed={speed} onSpeed={(v) => { clock.speed = v; setSpeed(v); }}
        playing={playing}
        onTogglePlay={() => { clock.playing = !clock.playing; setPlaying(clock.playing); poke(); }}
        view={view} onView={setView}
        ringOk={ringOk}
        table={table} onTable={() => setTable((t) => !t)}
      />

      <BandBar ind={ind} levels={levels} onToggle={toggleLevel} />

      {view === 'wave' && <WaveView ind={ind} levels={levels} />}

      {view === 'ring' && ringOk && <RingView ind={ind} />}

      {view === 'solar' && (
        <OrbitView onSync2D={() => { setView('wave'); setPlaying(false); }} />
      )}

      {table && <TableView ind={ind} levels={levels} />}

      <FootNote />
    </div>
  );
}
