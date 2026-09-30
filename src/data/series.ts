import type { LevelId } from './levels.ts';
import type { IndustryId } from './industries.ts';
import { wrap, fmt, smoothPulse } from '../model/math.ts';
import { dayName, monthName } from '../model/axis.ts';

/**
 * 每条周期曲线的定义。
 *
 * lv/ind/name/span/period/chip/ticksU/tickLabel/windows/shape/peaks/range/sub/example
 * 与原自包含 HTML 逐字一致（用 sed 从原文抽块，未重打），只补了类型。
 */
export interface Peak { u: number; l: string; below?: boolean }
export interface Window { c: number; h: number }

export interface SeriesDef {
  lv: LevelId;
  ind?: IndustryId;
  name: string;
  span: number;
  period: string;
  chip: string;
  ticksU: number[];
  tickLabel: (u: number) => string;
  windows?: Window[];
  shape?: (u: number) => number;
  peaks?: Peak[];
  range: string;
  sub: string;
  example: string;
}

export const SERIES: SeriesDef[] = [
    { lv:"day", name:"睡眠深度", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:3.0, h:4.0}],              /* 23:00 → 07:00 */
      peaks:[{u:3/24, l:"峰值 03:00"}],
      range:"23:00 – 07:00",
      sub:"深夜 <b>23:00–07:00</b> 是深睡主场：褪黑素压着体温往下走，最容易一觉睡沉。",
      example:"夜里十一点后开始犯困，凌晨三点睡得最沉，闹钟响了还觉得没睡够。" },

    { lv:"day", name:"饥饿感", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:7.5, h:0.9},{c:12.0, h:0.9},{c:18.5, h:0.9}],
      peaks:[{u:7.5/24, l:"早 07:30"},{u:12/24, l:"午 12:00"},{u:18.5/24, l:"晚 18:30"}],
      range:"07:30 / 12:00 / 18:30 前后",
      sub:"一天三个尖峰，落在 <b>早 07:30、午 12:00、晚 18:30</b> 前后——身体按三顿饭排了三次饿意。",
      example:"不到饭点就开始想吃什么，刚吃完一小时又毫无食欲，同一个胃一天三起三落。" },

    { lv:"day", name:"皮质醇", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:7.5, h:1.5}],              /* 06:00 → 09:00 */
      peaks:[{u:7.5/24, l:"峰值 07:30"}],
      range:"06:00 – 09:00",
      sub:"天亮前后 <b>06:00–09:00</b> 皮质醇冲到全天最高，把人从睡眠里“推”醒。",
      example:"不靠闹钟也会在同一个点醒，醒来头半小时最清醒，也是血压的晨峰。" },

    { lv:"day", name:"体温", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:17.5, h:5.5}],             /* 12:00 → 23:00 高位，凌晨自然是谷 */
      peaks:[{u:17.5/24, l:"午后最高 17:30"},{u:4.5/24, l:"谷值 04:30", below:true}],
      range:"凌晨 03:00 – 06:00 最低",
      sub:"体温在凌晨 <b>03:00–06:00</b> 掉到全天最低，比傍晚低约 0.5℃，人也就最想缩在被窝里。",
      example:"凌晨值班、早起赶车时格外冷——不是屋里真的更冷，是身体到了谷值。" },

    { lv:"day", name:"通勤高峰", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:8.25, h:0.75},{c:18.25, h:0.75}], /* 07:30–09:00 与 17:30–19:00 */
      peaks:[{u:8.25/24, l:"峰 08:15"},{u:18.25/24, l:"峰 18:15"}],
      range:"07:30 – 09:00 / 17:30 – 19:00",
      sub:"一天两个尖峰：<b>07:30–09:00</b> 与 <b>17:30–19:00</b>，中间是白天的平台，所以路况也一天两堵。",
      example:"早高峰地铁挤到贴门，晚高峰高架一动不动，中午同一段路却空得很。" },

    { lv:"day", name:"血压晨峰", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:8.0, h:1.5},{c:18.0, h:1.5}], /* 06:30–09:30 与 16:30–19:30 */
      peaks:[{u:8/24, l:"晨峰 08:00"},{u:18/24, l:"晚峰 18:00"}],
      range:"06:30 – 09:30 / 16:30 – 19:30",
      sub:"血压醒来后两小时冲到<b>晨峰</b>、傍晚再起一个小峰，夜里整体回落约 10–20%。",
      example:"起床后头晕、后颈发紧多在晨峰；降压药也常按这个节律安排在早上吃。" },

    { lv:"day", name:"社交活跃", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:22.0, h:1.0}],             /* 21:00 → 23:00 */
      peaks:[{u:22/24, l:"峰值 22:00"}],
      range:"21:00 – 23:00",
      sub:"睡前 <b>21:00–23:00</b> 是消息与刷屏的顶，刚好撞上生物钟开始催人入睡的那一段。",
      example:"晚上十点群里最热闹、短视频最停不下来，也正是“再看五分钟就到一点”的时刻。" },

    { lv:"week", name:"工作日作息", span:7, period:"7 天", chip:"T = 7 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> dayName(Math.round(u*7)),
      shape:(u)=> {
        const d = wrap(u,1) * 7;                     /* 周一 0 … 周日 6 */
        return 1 - 0.75 * smoothPulse(d, 5.9, 1.5, 0.8, 7);   /* 低谷落在周六、周日 */
      },
      peaks:[{u:5.9/7, l:"周六日低谷"}],
      range:"周一 – 周五",
      sub:"<b>周一至周五</b>早出晚归、周末两天松下来——一周里的一次起落，也是典型的社会性节律。",
      example:"周一到周五被闹钟叫醒，周六睡到中午；周一早上又格外难起。" },

    { lv:"month", name:"月相", span:29.530588, period:"约 29.5 天", chip:"T = 29.5 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> (u === 1 ? "第 30 天" : "第 " + Math.round(u*29.53) + " 天"),
      shape:(u)=> 0.5*(1-Math.cos(2*Math.PI*u)),   /* u = 0 新月、u = 0.5 满月 */
      peaks:[{u:0.5, l:"满月"}],
      range:"约 29.5 天一轮（新月 → 满月 → 新月）",
      sub:"从新月到满月再回到新月，平均 <b>29.5 天</b>转一圈。潮汐与农历月初一都跟着它走。",
      example:"农历十五前后月亮最圆，海边大潮总落在初一、十五附近——一个月的节拍器。" },

    { lv:"month", name:"日月合朔", span:29.530588, period:"约 29.5 天", chip:"T = 29.5 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> (u === 1 ? "第 30 天" : "第 " + Math.round(u*29.53) + " 天"),
      shape:(u)=> 0.5*(1-Math.cos(2*Math.PI*u)),
      peaks:[{u:0.5, l:"望（满月）"}],
      range:"约 29.5 天一轮",
      sub:"同一条朔望周期曲线：望与朔两处都是大潮，所以大潮一个月来两次。",
      example:"农历十五、三十前后潮水都涨得高，初七、初八则平缓得多。" },

    { lv:"month", name:"全日潮", span:14.765294, period:"约 14.8 天", chip:"T = 14.8 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "D" + Math.round(u*14.77),
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*(u - 0.5))),   /* 两次大潮：朔与望 */
      peaks:[{u:0.5, l:"大潮"}],
      range:"朔望大潮 / 上下弦小潮",
      sub:"朔、望两处日月引潮力叠在一起成<b>大潮</b>，上下弦互相抵消成<b>小潮</b>——半月一强一弱。",
      example:"农历初一、十五前后潮差最大，初八、廿三左右潮差最小，赶海、过滩都要看它。" },

    { lv:"month", name:"潮差", span:14.765294, period:"约 14.8 天", chip:"T = 14.8 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "D" + Math.round(u*14.77),
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*(u - 0.5))),
      peaks:[{u:0.5, l:"大潮"}],
      range:"朔望大潮 / 上下弦小潮",
      sub:"涨潮与落潮的水位差也走这条半月节律：大潮那几天潮差最大，小潮那几天最小。",
      example:"大潮期看潮最壮观，也最容易把滩涂上的东西淹到；小潮期退得最少，赶海收获也少。" },

    { lv:"month", name:"月出时刻", span:27.321661, period:"约 27.3 天", chip:"T = 27.3 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "D" + Math.round(u*27.32),
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*(u - 0.5))),   /* 中天最晚 */
      peaks:[{u:0.5, l:"中天最晚"}],
      range:"每天推迟约 50 分钟",
      sub:"月亮每天升起比前一天晚约 <b>50 分钟</b>，27.3 天绕天球一圈，所以同一个钟点看到的月亮不一样。",
      example:"满月傍晚升起、整夜在天；上弦月在正午前后升，傍晚留在南天。" },

    { lv:"month", name:"月球近远地", span:27.55455, period:"约 27.6 天", chip:"T = 27.6 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "D" + Math.round(u*27.55),
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*(u - 0.5))),   /* 近地点 */
      peaks:[{u:0.5, l:"近地点"}],
      range:"近地点 / 远地点",
      sub:"月亮绕地的轨道是椭圆，约 <b>27.6 天</b>一次近地点、一次远地点，视直径差了约 14%。",
      example:"近地点前后赶上满月，月亮看起来格外大格外亮，就是“超级月亮”。" },

    { lv:"season", name:"太阳高度角", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*(u + 0.5))),   /* 夏至峰值、冬至谷值 */
      peaks:[{u:0.5, l:"夏至（最高）"},{u:0, l:"冬至（最低）"}],
      range:"夏至最高 / 冬至最低",
      sub:"正午太阳高度角从<b>夏至</b>的顶点走到<b>冬至</b>的谷点，365.24 天一个来回。",
      example:"夏至正午影子最短、冬至最长；同一天在北京和广州看到的正午高度也不一样。" },

    { lv:"season", name:"白昼长度", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*(u + 0.5))),
      peaks:[{u:0.5, l:"夏至最长"},{u:0, l:"冬至最短"}],
      range:"夏至最长 / 冬至最短",
      sub:"夏至白昼最长、冬至最短，春分秋分两天昼夜大致平分——日照长短本身就是生物钟的授时信号。",
      example:"北方夏天晚上八点天还亮，冬天五点就黑透；春秋两季体感变化最快。" },

    { lv:"season", name:"月经周期", span:28, period:"约 28 天", chip:"T = 约 28 天",
      ticksU:[1/28,0,14/28,28/28], tickLabel:(u)=> (Math.abs(u) < 1e-9 ? "第 1 天" : Math.abs(u-14/28) < 1e-9 ? "排卵期" : Math.abs(u-1) < 1e-9 ? "第 28 天" : "第 8 天"),
      shape:(u)=> smoothPulse(u, 0.035714, 0.092857, 0.128571)*0.72 + smoothPulse(u, 0.5, 0.092857, 0.128571)*0.78 + smoothPulse(u, 0.5, 0, 0.30)*0.22 + 0.03,
      peaks:[{u:0.5, l:"排卵期"}],
      range:"约 28 天一轮（因人而异）",
      sub:"平均约 <b>28 天</b>一轮：经期起落，周中段排卵，体温与情绪也跟着有规律地小幅摆动。",
      example:"周期日志、体温曲线上的那双相变化，就是这条节律在身体上的记录。" },

    { lv:"season", name:"日照总量", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> {
        const m = wrap(u,1) * 12;                         /* 1 月起算 */
        const nu = wrap(wrap((m - 1)/12 + 0.5, 1), 1);    /* 正午高度以夏至为峰 */
        const day = 0.5 + 0.5 * Math.sin(2*Math.PI*(m - 3.5)/12);  /* 白昼以 6 月中最长 */
        return Math.min(1, 0.30 * 0.5 * (1 + Math.cos(2*Math.PI*nu)) + 0.62 * day);
      },
      peaks:[{u:0.53, l:"6 月最充足"},{u:0.03, l:"12 月最少", below:true}],
      range:"6 月最充足 / 12 月最少",
      sub:"北半球 6 月日照最充足、12 月最少：太阳高度角、白昼长度和云量一起决定每个月晒到多少。",
      example:"夏天晒一会儿就发烫，冬天同样时间晒不暖；晒衣、晒被、光伏发电都跟着这条曲线走。" },

    { lv:"year", name:"历年长度", span:4, period:"4 年", chip:"T = 4 年",
      ticksU:[0,.25,.5,.75,1],
      tickLabel:(u)=> (2020 + Math.round(u*4)) + " 年",
      shape:(u)=> {
        const uu = wrap(u,1);
        /* 以 2020 为相位 0：2020 与 2024 同为闰年，所以首段（含右端闭合点）为高，其余为平年 */
        return uu < 0.25 ? 0.98 : 0.65;
      },
      peaks:[{u:0.125, l:"闰年 366 天"},{u:0.5, l:"平年 365 天", below:true}],
      range:"平年 365 天 / 闰年 366 天",
      sub:"公历年是整天数，但地球公转是 <b>365.2422 天</b>，每年差出约 6 小时，攒够一天就设一个闰日补回来。",
      example:"2 月 29 日出生的人四年才过一次生日；没有闰日，几百年后季节就会整体错位。" },

    /* ================= 农业 ================= */
    { ind:"agri", lv:"day", name:"作物蒸腾", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:13.0, h:3.5}],
      peaks:[{u:13/24, l:"峰值 13:00"}],
      range:"10:00 – 16:00",
      sub:"气温与光照最足的 <b>10:00–16:00</b> 蒸腾最强，正午前后气孔反而会短暂收一收。",
      example:"大棚中午必须通风，否则叶面“蒸不动”反而捂出病；滴灌也常排在这几个钟点。" },

    { ind:"agri", lv:"day", name:"牲畜反刍", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:3.5, h:2.0},{c:15.5, h:2.0}],
      peaks:[{u:3.5/24, l:"夜 03:30"},{u:15.5/24, l:"午后 15:30"}],
      range:"凌晨与午后各一轮",
      sub:"反刍不是整天的：<b>凌晨 2–5 点</b>与<b>午后</b>各有一轮集中咀嚼，与饲喂时刻绑定。",
      example:"奶牛舍夜里安静下来仍有反刍的咀嚼声；挤奶班次一改，反刍高峰也跟着挪。" },

    { ind:"agri", lv:"month", name:"农事潮汐", span:14.765294, period:"约 14.8 天", chip:"T = 14.8 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "D" + Math.round(u*14.77),
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*(u - 0.5))),
      peaks:[{u:0.5, l:"大潮"}],
      range:"朔望大潮 / 上下弦小潮",
      sub:"滩涂作业、灌溉取水、蟹贝养殖的窗口都压在<b>半月一次</b>的大小潮节律上。",
      example:"大潮那几天赶海收成最好，也是把滩涂上的苗种冲到别处的几天。" },

    { ind:"agri", lv:"season", name:"节气时刻", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*(u + 0.5))),
      peaks:[{u:0.5, l:"夏至"},{u:0, l:"冬至"}],
      range:"二十四节气 · 春分秋分两分",
      sub:"节气本质是地球公转到某一位置的时刻，所以它<b>严格按 365.24 天</b>轮回，与公历日期一年差一两天。",
      example:"“清明前后，种瓜点豆”——播期按节气排，比按公历排更贴合实际的太阳与积温。" },

    { ind:"agri", lv:"season", name:"生长季积温", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> {
        const m = wrap(u,1) * 12;
        const nu = wrap(wrap((m - 1)/12 + 0.5, 1), 1);
        return Math.min(1, 0.22 * (1 + Math.cos(2*Math.PI*nu)) + 0.52 * (0.5 + 0.5*Math.sin(2*Math.PI*(m - 3.6)/12)));
      },
      peaks:[{u:(6.9)/12, l:"7 月积温最高"},{u:(0.4)/12, l:"1 月最低", below:true}],
      range:"春季回升 / 秋季回落",
      sub:"作物需要累积到一定积温才进入下一生育期，所以<b>物候期逐年整体前后挪几天</b>，但不会越界。",
      example:"暖冬会让花期提前，赶上倒春寒就减产——果农盯的正是这条曲线的上下摆。" },

    /* ================= 太空航天 ================= */
    { ind:"space",  lv:"day", name:"在轨轨道", span:24, period:"约 92 分钟", chip:"T = 92 分钟",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "第 " + Math.round(u*24) + " 小时",
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*u*15.6)),
      peaks:[{u:0, l:"过境"},{u:8/15.6, l:"过境"}],
      range:"一天约 15.6 圈",
      sub:"近地轨道周期约 <b>92 分钟</b>，一天绕地约 15.6 圈——所以“一天过一次境”是错觉。",
      example:"空间站的日出日落一天各 15 次以上，航天员的睡眠靠地面排班而不是窗外的光。" },

    { ind:"space",  lv:"month", name:"太阳自转", span:27.275, period:"约 27.3 天", chip:"T = 27.3 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "D" + Math.round(u*27.28),
      shape:(u)=> 0.5*(1-Math.cos(2*Math.PI*u)),
      peaks:[{u:0.5, l:"活动面朝地球"}],
      range:"约 27.3 天一轮",
      sub:"太阳赤道附近自转约 <b>27.3 天</b>一圈，同一个活动区转过正对地球那一面就再来一次影响。",
      example:"磁暴、无线电中断常间隔约 27 天重现——这就是“地磁重现性”的来源。" },

    { ind:"space",  lv:"year", name:"太阳活动周", span:11, period:"约 11 年", chip:"T = 约 11 年",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "第 " + Math.round(u*11) + " 年",
      shape:(u)=> {
        const uu = wrap(u,1);
        return Math.max(0, Math.min(1, 0.5 + 0.44 * Math.cos(2*Math.PI*(uu - 0.5))));
      },
      peaks:[{u:0.5, l:"活动峰（极大年）"},{u:0, l:"活动谷（极小年）", below:true}],
      range:"约 11 年一轮 · 极大年黑子最多",
      sub:"黑子数按约 <b>11 年</b>一峰一谷，峰年轨道上的大气密度更高、卫星掉得更快。",
      example:"低轨卫星寿命要按太阳活动周来估；极光在极大年也变得常客。" },

    { ind:"space",  lv:"year", name:"沙罗周期", span:18.03, period:"约 18 年 11 天", chip:"T ≈ 18 年",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "第 " + Math.round(u*18) + " 年",
      shape:(u)=> {
        const uu = wrap(u,1);
        return Math.max(0.05, 0.5 - 0.45 * Math.cos(2*Math.PI*uu));
      },
      peaks:[{u:0.5, l:"同类食重现"}],
      range:"约 18 年 11 天重复一次",
      sub:"日食月食按 <b>18 年 11 天</b>（沙罗周期）成组重现，古人靠它预报食。",
      example:"记录一次日食的日期，加 18 年 11 天就很可能再赶上一次同类日食。" },

    /* ---- 火箭与航天器：结构、零部件与工作时序 ----
       同一枚火箭从「加注 → 点火 → 分离 → 入轨」的完整时间线拆成几张卡：
       发射任务卡用「任务时钟」刻度（T−6h 起），在轨器件卡用本地时钟刻度。 */
    { ind:"space",  lv:"day", name:"发动机点火时序", span:24, period:"一次任务约 1 小时",
      chip:"预冷 → 点火 → 主级 → 关机",
      ticksU:[0,.25,.5,.75,1],
      tickLabel:(u)=>{ const t = u*24 - 6; return (t < 0 ? "T−" : "T+") + Math.abs(t).toFixed(0) + "h"; },
      windows:[{c:5.55, h:0.15},{c:5.95, h:0.06},{c:6.15, h:0.55},{c:6.72, h:0.08}],
      peaks:[{u:5.95/24, l:"点火 T−3′"}],
      range:"T− 30 分 预冷 → T+ 45 分 主机关机",
      sub:"液体发动机点火前要先<b>预冷</b>：把低温管路浇透、赶走气泡，否则涡轮泵会被气蚀撕坏；随后点火、进主级、按时序关机，每一步都在秒级。",
      example:"直播里那句“预冷开始—点火—主机关机”，对应的就是这条四段时序曲线。" },

    { ind:"space",  lv:"day", name:"级间分离与抛罩", span:24, period:"约 4 分钟",
      chip:"T+2′ – T+5′",
      ticksU:[0,.25,.5,.75,1],
      tickLabel:(u)=>{ const t = u*24 - 6; return (t < 0 ? "T−" : "T+") + Math.abs(t).toFixed(0) + "h"; },
      windows:[{c:6.10, h:0.12}],
      peaks:[{u:6.10/24, l:"分离时序 T+2′–5′"}],
      range:"T+ 2 分 – T+ 5 分",
      sub:"助推器分离、一二级分离、整流罩抛离全挤在起飞后<b>两三分钟</b>里：火药螺栓炸开、弹簧把两截结构推开，下一级随即点火。",
      example:"直播画面里翻着跟头掉下去的白色筒子就是整流罩——卫星到这一刻才第一次看见真空。" },

    { ind:"space",  lv:"day", name:"推进剂加注", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:1.5, h:2.6},{c:19.0, h:2.4}],
      peaks:[{u:1.5/24, l:"发射夜加注"},{u:19/24, l:"临射补加"}],
      range:"发射前夜 23:00 – 起飞前 2 小时",
      sub:"低温推进剂（液氧 −183℃、液氢 −253℃）必须边加边<b>补</b>：贮箱一直在蒸发排气，加满并不等于加完。",
      example:"发射前几小时反复播报的“加注开始 / 补加 / 泄压”，就是贮箱在跟蒸发赛跑。" },

    { ind:"space",  lv:"day", name:"发射窗口", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:13.0, h:2.0}],
      peaks:[{u:13/24, l:"窗口开启"}],
      range:"每天一段 · 逐日前后挪一两分钟",
      sub:"要把卫星送进某个<b>轨道面</b>，就得等地球自转到发射场正好穿过那个面的那一小段——这就是窗口，错过只能等明天。",
      example:"火箭常定在某个钟点发射，而第二天的同一个窗口已经挪走了一两分钟。" },

    { ind:"space",  lv:"day", name:"地面站过境", span:24, period:"约 92 分钟", chip:"T = 92 分钟",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      shape:(u)=>{
        const lt = wrap(wrap(u,1) * 24 + 8, 24);              /* 换算成本地时刻 */
        const a = 0.5 * (1 + Math.cos(2*Math.PI * (lt - 5.5) / 3));
        const b = 0.5 * (1 + Math.cos(2*Math.PI * (lt - 14.5) / 3));
        return Math.min(1, Math.max(a, b));
      },
      peaks:[{u:21.5/24, l:"晨站 05:30"},{u:6.5/24, l:"午站 14:30"}],
      range:"每圈约 5–10 分钟在站",
      sub:"卫星并非随时联得上地面：一天十几圈里，只有掠过测控站上空的那<b>几分钟</b>才传得了数据、收得下指令。",
      example:"“下一圈 XX:XX 过境”是地面排班的口头禅；凑不上站的指令就得再等一圈。" },

    { ind:"space",  lv:"day", name:"电源阵充放电", span:24, period:"约 92 分钟", chip:"T = 92 分钟",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:4.0, h:2.2},{c:13.0, h:3.0}],
      peaks:[{u:4/24, l:"光照·充电"},{u:13/24, l:"地影·放电"}],
      range:"每圈约 55 分钟光照 / 35 分钟地影",
      sub:"太阳翼这一圈充电、蓄电池下一圈放电：低轨上<b>约 55 分钟见太阳、35 分钟进地影</b>，一天反复十几次。",
      example:"低轨卫星的电池寿命按“一天十几次充放”折损，不是按年算的。" },

    { ind:"space",  lv:"month", name:"液氧贮箱蒸发", span:29.530588, period:"约 29.5 天", chip:"T = 29.5 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> (u === 1 ? "第 30 天" : "第 " + Math.round(u*29.53) + " 天"),
      shape:(u)=>{
        const d = wrap(u,1) * 29.530588;                 /* 加满后一路蒸发，见底再补 */
        return Math.max(0.18, 1 - 0.80 * (d / 29.530588));
      },
      peaks:[{u:0.01, l:"补加 · 满箱"},{u:0.985, l:"见底前补加", below:true}],
      range:"一路蒸发 · 定期补加",
      sub:"液氧要一直保持在 −183℃ 才不翻滚沸腾，贮箱靠<b>连续排气</b>控压——不补加的话，一个月里推进剂就这么慢慢漏光。",
      example:"所以“在轨加注”与长期低温贮存，是深空任务绕不开的热控与结构难题。" },

    { ind:"space",  lv:"season", name:"同步轨道进动", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> 0.15 + 0.80 * wrap(u,1),
      peaks:[{u:0.98, l:"进动累积最大"},{u:0.02, l:"年度保持机动", below:true}],
      range:"一年累积约 0.85° · 年末修正一次",
      sub:"太阳与月亮的引力把同步轨道的<b>倾角一年拽偏约 0.85°</b>，攒到年底做一次南北向保持机动再压回去。",
      example:"同步卫星的燃料预算里，这一年的“攒—修”循环占了大头。" },

    { ind:"space",  lv:"season", name:"发射排期", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=>{
        const m = wrap(u,1) * 12;
        const a = 0.5 * (1 + Math.cos(2*Math.PI * (m - 3.5) / 12));
        const b = 0.5 * (1 + Math.cos(2*Math.PI * (m - 9.5) / 12));
        return Math.max(a, b);
      },
      peaks:[{u:3.5/12, l:"春季排期密集"},{u:9.5/12, l:"秋季排期密集"}],
      range:"春、秋两段发射最密",
      sub:"发射排期要同时躲开<b>台风季与严寒</b>，还要抢测控与靶场资源，于是日历上自然挤成春、秋两个高峰。",
      example:"把我国几大发射场一年的任务摊开看，就是这个双峰形状。" },

    { ind:"space",  lv:"year",  name:"火星转移窗口", span:780, period:"约 780 天", chip:"T ≈ 2.1 年",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> (u === 1 ? "第 26 个月" : "第 " + Math.round(u*780/30.44) + " 个月"),
      shape:(u)=>{
        const d = wrap(u,1) * 780;
        return 0.12 + 0.88 * smoothPulse(d, 390, 60, 40, 780);
      },
      peaks:[{u:0.5, l:"约 3 个月的天窗"}],
      range:"约 26 个月一次 · 每次几周",
      sub:"去火星要走霍曼转移轨道，只有地球与火星的相位对上时才划算——这个相位<b>约 26 个月</b>才转回来一次。",
      example:"所以火星任务总是“扎堆”：两三个月里连发几个，然后安静两年多。" },

    { ind:"space",  lv:"year",  name:"单粒子翻转", span:11, period:"约 11 年", chip:"T = 约 11 年",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "第 " + Math.round(u*11) + " 年",
      shape:(u)=>{
        const c = 0.5 + 0.5 * Math.cos(2*Math.PI * (wrap(u,1) - 0.5));
        return Math.max(0, Math.min(1, 0.12 + 0.85 * Math.pow(c, 1.6)));
      },
      peaks:[{u:0.5, l:"极大年翻转最多"},{u:0.0, l:"极小年最少", below:true}],
      range:"随太阳活动周起落",
      sub:"高能粒子打中芯片，会把某一位<b>从 0 翻成 1</b>；太阳活动极大年，这种单粒子翻转明显更多。",
      example:"卫星要在存储与寄存器上加校验和冗余，防的就是这一下不声不响的位翻转。" },

    /* ================= 海洋渔业 ================= */
    { ind:"marine", lv:"day", name:"潮汐涨落", span:24.8412, period:"约 24.84 小时", chip:"T ≈ 24.84 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "+" + (u*24.84).toFixed(1) + " h",
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*u*2)),
      peaks:[{u:0, l:"高潮"},{u:0.5, l:"高潮"}],
      range:"约每 12.4 小时一次高潮",
      sub:"太阴日比太阳日长约 <b>50 分钟</b>，所以高潮每天顺延约 50 分钟，一天两次。",
      example:"昨天下午三点满潮，今天就要等到三点五十——渔民的出海时刻表每天都在挪。" },

    { ind:"marine", lv:"month", name:"大小潮汛", span:14.765294, period:"约 14.8 天", chip:"T = 14.8 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "D" + Math.round(u*14.77),
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*(u - 0.5))),
      peaks:[{u:0.5, l:"大潮汛"}],
      range:"朔望大潮 / 上下弦小潮",
      sub:"大潮汛与鱼类索饵、产卵、洄游的时间常重合，所以<b>渔汛也走半月节律</b>。",
      example:"沿海传统渔汛与农历初一、十五对得上；养殖投饵也要避开小潮的缺氧时段。" },

    { ind:"marine", lv:"season", name:"海水表层温度", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*(u - 0.5 - 0.12))),
      peaks:[{u:0.5+0.12, l:"8–9 月最暖"},{u:0.12, l:"2–3 月最冷"}],
      range:"比气温滞后约一个月",
      sub:"海水的热惯性让表层温度比气温<b>滞后约一个月</b>：最暖不在 6 月而在 8、9 月。",
      example:"台风季总在最暖之后；养殖的赤潮、缺氧也集中在夏末秋初。" },

    { ind:"marine", lv:"season", name:"浮游生产力", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> {
        const m = wrap(u,1) * 12;
        const spring = 0.78 * (0.5 + 0.45*Math.cos(2*Math.PI*(m - 4.5)/12));
        const autumn = 0.30 * smoothPulse(u, 0.72, 0.055, 0.045);
        return Math.max(0.04, Math.min(1, spring + autumn));
      },
      peaks:[{u:(4.5)/12, l:"春末主峰"},{u:0.72, l:"秋季次峰"}],
      range:"春季主峰 / 秋季次峰",
      sub:"春季光照回升加上水体混合带来营养盐，浮游植物出现<b>全年最大一次暴发</b>，秋季还有一个小峰。",
      example:"渔场的位置与渔汛期，本质上跟着浮游植物的两次峰走。" },

    /* ================= 医疗健康 ================= */
    { ind:"health", lv:"day", name:"心率与血压", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:8.0, h:2.5},{c:17.5, h:3.0}],
      peaks:[{u:8/24, l:"晨峰 08:00"},{u:17.5/24, l:"午后缘 17:30"}],
      range:"夜间回落 10–20%",
      sub:"夜间整体回落一到两成（杓型），醒后两小时内冲上<b>晨峰</b>——卒中也多发在这两小时。",
      example:"测血压要求固定钟点，就是因为同一个人的数值一天里本来就有这条曲线。" },

    { ind:"health", lv:"day", name:"呼吸与肺功能", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:16.0, h:3.0}],
      peaks:[{u:16/24, l:"峰值 16:00"}],
      range:"午后 14:00 – 18:00",
      sub:"气道口径在<b>午后</b>最宽、肺功能最好，凌晨最窄——哮喘发作因此集中在后半夜。",
      example:"哮喘病人半夜憋醒、救护车凌晨出车多，与这条曲线的谷底对得上。" },

    { ind:"health", lv:"month", name:"月经周期", span:28, period:"约 28 天", chip:"T = 约 28 天",
      ticksU:[1/28,0,14/28,28/28], tickLabel:(u)=> (Math.abs(u) < 1e-9 ? "第 1 天" : Math.abs(u-14/28) < 1e-9 ? "排卵期" : Math.abs(u-1) < 1e-9 ? "第 28 天" : "第 8 天"),
      shape:(u)=> smoothPulse(u, 0.035714, 0.092857, 0.128571)*0.72 + smoothPulse(u, 0.5, 0.092857, 0.128571)*0.78 + smoothPulse(u, 0.5, 0, 0.30)*0.22 + 0.03,
      peaks:[{u:0.5, l:"排卵期"}],
      range:"约 28 天一轮（因人而异）",
      sub:"基础体温的双相变化、激素峰谷都排在这条 <b>28 天</b>的轴上，因人而异但不是随机的。",
      example:"备孕看排卵期、复诊按周期第几天排，都是按这条轴在定时刻。" },

    { ind:"health", lv:"season", name:"呼吸道传染病季", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> {
        const m = wrap(u,1) * 12;
        return Math.max(0, Math.min(1, 0.5 + 0.46*Math.cos(2*Math.PI*(m - 0.5)/12)));
      },
      peaks:[{u:0.042, l:"1 月高峰"},{u:0.542, l:"8 月低谷", below:true}],
      range:"冬季峰 / 夏季谷",
      sub:"流感与多数呼吸道病毒走<b>冬峰夏谷</b>的年周期：低温、干燥、室内聚集三者叠加。",
      example:"流感疫苗接种窗口排在秋季，正是因为要在冬季峰到来之前把免疫建起来。" },

    /* ================= 能源电力 ================= */
    { ind:"energy", lv:"day", name:"用电负荷", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:10.5, h:2.5},{c:19.5, h:2.5}],
      peaks:[{u:10.5/24, l:"午峰 10:30"},{u:19.5/24, l:"晚峰 19:30"}],
      range:"早晚双峰 · 夜间低谷",
      sub:"电网一天有两个峰：<b>上午与傍晚</b>，之间是午间平台，凌晨是深谷——峰谷差就是调峰的由来。",
      example:"分时电价把高峰段定在傍晚；抽水蓄能就是在夜里谷段把水抽上去。" },

    { ind:"energy", lv:"day", name:"光伏出力", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:12.5, h:4.0}],
      peaks:[{u:12.5/24, l:"峰值 12:30"}],
      range:"日出到日落 · 正午最高",
      sub:"光伏出力是一条以<b>正午</b>为顶的钟形线，随季节改变宽度与高度，与用电晚峰正好错开。",
      example:"“鸭形曲线”说的就是光伏把午间净负荷压出深谷、傍晚又抬起来的那道弯。" },

    { ind:"energy", lv:"season", name:"供暖季负荷", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> {
        const m = wrap(u,1) * 12;
        return Math.max(0, Math.min(1, 0.5 + 0.47*Math.cos(2*Math.PI*(m - 0.2)/12)));
      },
      peaks:[{u:0.017, l:"1 月中峰"},{u:0.517, l:"7 月谷", below:true}],
      range:"冬季供暖 · 夏季空调",
      sub:"年负荷是两条季节曲线叠加：<b>冬取暖、夏制冷</b>，中间春秋两个低谷，所以年最大负荷出现在冬或夏取决于地区。",
      example:"北方电网年峰值在 1 月，南方往往在 8 月——同一条曲线、不同的主峰。" },

    /* ================= 交通物流 ================= */
    { ind:"transport", lv:"day", name:"城市交通流", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:8.25, h:1.0},{c:18.25, h:1.5}],
      peaks:[{u:8.25/24, l:"早峰 08:15"},{u:18.25/24, l:"晚峰 18:15"}],
      range:"早 07:30–09:00 / 晚 17:30–19:00",
      sub:"早晚各一个尖峰，<b>晚峰更长更平</b>——因为下班时刻比上班分散，还夹杂了购物与接送。",
      example:"早高峰地铁要限流，晚高峰则是路上堵得久——同一批人，两个不同的形状。" },

    { ind:"transport", lv:"week", name:"货运班次", span:7, period:"7 天", chip:"T = 7 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> dayName(Math.round(u*7)),
      shape:(u)=> {
        const d = wrap(u,1) * 7;
        return 1 - 0.62 * smoothPulse(d, 5.9, 1.8, 0.9, 7);
      },
      peaks:[{u:5.9/7, l:"周六日低谷"}],
      range:"周一 – 周五",
      sub:"货运跟着工作日走：<b>周中满负荷、周末司机少、口岸排队短</b>，周日晚起运量又抬起来。",
      example:"周五下午发货赶不上周末清关；周一早上的分拨中心则永远最挤。" },

    { ind:"transport", lv:"season", name:"客运高峰季", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> {
        const m = wrap(u,1) * 12;
        const base = 0.42 + 0.30 * Math.cos(2*Math.PI*(m - 7.5)/12);
        const cny  = 0.34 * smoothPulse(u, 0.055, 0.05, 0.03);
        const nat  = 0.26 * smoothPulse(u, 0.83, 0.035, 0.025);
        const mob  = 0.22 * smoothPulse(u, 0.40, 0.025, 0.02);
        return Math.max(0, Math.min(1, base + cny + nat + mob));
      },
      peaks:[{u:0.055, l:"春节"},{u:0.40, l:"五一"},{u:0.83, l:"国庆"}],
      range:"春节 / 五一 / 国庆三个尖峰",
      sub:"全年客流是<b>暑期宽峰</b>加上春节、五一、国庆三个尖峰：假期定了，出行就定了。",
      example:"春运四十天的运力要按全年最高峰备，一年里其余三百天用不到这个数。" },

    { ind:"transport", lv:"year", name:"车辆年检", span:1, period:"1 年", chip:"T = 1 年",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> {
        const m = wrap(u,1) * 12;
        return Math.max(0, Math.min(1, 0.5 + 0.44*Math.cos(2*Math.PI*(m - 11)/12)));
      },
      peaks:[{u:10.9/12, l:"年末扎堆"},{u:4.9/12, l:"6 月最松", below:true}],
      range:"年末集中 / 年中松散",
      sub:"按登记上牌月份到期，年检需求被<b>摊在 12 个月里</b>，但年末与年初各有一段扎堆。",
      example:"检测站排长队的规律不在星期几，而在这个月有多少辆车到期。" },

    /* ================= 金融零售 ================= */
    { ind:"finance", lv:"day", name:"证券交易时段", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:10.0, h:1.5},{c:14.5, h:1.5}],
      peaks:[{u:10/24, l:"开盘 09:30–11:30"},{u:14.5/24, l:"尾盘 13:00–15:00"}],
      range:"09:30–11:30 / 13:00–15:00",
      sub:"成交量在<b>开盘与收盘两个半小时</b>最高，午间休市是一道硬切的低谷——不是市场在歇，是制度在歇。",
      example:"开盘半小时与收盘半小时的成交量能占全天很大一块，中间则清淡。" },

    { ind:"finance", lv:"week", name:"资金结算周", span:7, period:"7 天", chip:"T = 7 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> dayName(Math.round(u*7)),
      shape:(u)=> {
        const d = wrap(u,1) * 7;
        return 1 - 0.68 * smoothPulse(d, 5.9, 1.8, 0.9, 7);
      },
      peaks:[{u:5.9/7, l:"周六日休市"}],
      range:"周一 – 周五",
      sub:"交易与清算按<b>工作日</b>排：周末休市、节前资金面偏紧，跨月的最后一个工作日最忙。",
      example:"周五的转账要等到下周一才到账；季末那天银行间市场的利率总会跳一下。" },

    { ind:"finance", lv:"month", name:"发薪与账单", span:30.436875, period:"约 30.4 天", chip:"T ≈ 30.4 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "第 " + Math.round(u*30.44 + 1) + " 天",
      shape:(u)=> {
        const du = wrap(u,1);
        return Math.max(0, Math.min(1,
          0.16 + 0.80 * Math.exp(-Math.pow((du - 0.06)/0.045, 2))
          + 0.34 * Math.exp(-Math.pow((du - 0.52)/0.05, 2))
          + 0.26 * Math.exp(-Math.pow((du - 0.92)/0.05, 2))));
      },
      peaks:[{u:0.06, l:"发薪日"},{u:0.52, l:"月中账单"},{u:0.92, l:"月底还款"}],
      range:"月初发薪 · 月底还款",
      sub:"消费与流动性走的是<b>月初发薪、月底还款</b>的月底周期，与月亮无关，纯粹是发薪日定义的。",
      example:"月初商超和餐馆最热闹，月底外卖订单结构都变了——这是一条纯社会性的“月相”。" },

    { ind:"finance", lv:"season", name:"消费节庆", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> {
        const m = wrap(u,1) * 12;
        const base = 0.40 + 0.22 * Math.cos(2*Math.PI*(m - 1.0)/12);
        const s    = 0.34 * smoothPulse(u, 0.86, 0.030, 0.022);
        const cny  = 0.40 * smoothPulse(u, 0.075, 0.032, 0.024);
        const may  = 0.20 * smoothPulse(u, 0.40, 0.018, 0.014);
        return Math.max(0, Math.min(1, base + s + cny + may));
      },
      peaks:[{u:0.075, l:"春节"},{u:0.86, l:"年末旺季"}],
      range:"春节与年末两个峰",
      sub:"零售全年有<b>两个峰</b>：春节前后与年末旺季，中间 6–8 月最平。",
      example:"“双十一”把年末峰整体抬高；春节前那两周则是全年最挤的一次采购。" },

    /* ================= 制造业 ================= */
    { ind:"mfg",     lv:"day", name:"三班制负荷", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:9.0, h:2.2},{c:17.0, h:2.2},{c:1.0, h:2.2}],
      peaks:[{u:9/24, l:"早班 09:00"},{u:17/24, l:"中班 17:00"},{u:1/24, l:"夜班 01:00"}],
      range:"早 / 中 / 夜三班交接",
      sub:"产能按<b>三班交接</b>排，但质量和产出在夜班系统性偏低——那是人的昼节律在起作用。",
      example:"夜班次品率普遍高于白班，所以关键工序常被安排在早班做。" },

    { ind:"mfg",     lv:"week", name:"设备保养周", span:7, period:"7 天", chip:"T = 7 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> dayName(Math.round(u*7)),
      shape:(u)=> {
        const d = wrap(u,1) * 7;
        return 1 - 0.30 * smoothPulse(d, 5.9, 1.8, 0.9, 7);
      },
      peaks:[{u:5.9/7, l:"周末停线保养"}],
      range:"周末停机窗口",
      sub:"计划性检修被安排在<b>周末停产窗口</b>，所以产量曲线每周都有一个浅浅的缺口。",
      example:"产线周末降速做点检，是产量账对不上时最先要核对的那一段。" },

    { ind:"mfg",     lv:"month", name:"生产订单批次", span:30.436875, period:"约 30.4 天", chip:"T ≈ 30.4 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "第 " + Math.round(u*30.44 + 1) + " 天",
      shape:(u)=> {
        const du = wrap(u,1);
        return Math.max(0, Math.min(1, 0.42 + 0.38 * Math.cos(2*Math.PI*(du - 0.15))
          - 0.14 * smoothPulse(du, 0.60, 0.06, 0.04)));
      },
      peaks:[{u:0.15, l:"月初排产高峰"},{u:0.60, l:"月中在制品低谷", below:true}],
      range:"月初下达 / 月中在制低谷",
      sub:"订单按<b>月度批</b>下达：月初排产满、月中在制品见底、月末为交付冲刺，形成月中月尾两个拐点。",
      example:"车间月初最忙、月末最赶；原料库存在月末最低——都是批次的形状，不是需求真的这样。" },

    { ind:"mfg",     lv:"year", name:"库存周期", span:3.5, period:"约 3.5 年", chip:"T ≈ 3.5 年",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> "第 " + Math.round(u*3.5) + " 年",
      shape:(u)=> {
        const uu = wrap(u,1);
        return Math.max(0, Math.min(1, 0.5 - 0.45 * Math.cos(2*Math.PI*uu)));
      },
      peaks:[{u:0.5, l:"补库高峰"},{u:0, l:"去库低谷"}],
      range:"补库 / 去库交替",
      sub:"企业库存按<b>3–4 年一轮</b>在“补库存”和“去库存”之间摆，是比日历更长的产业节拍。",
      example:"原材料订购的松紧、运价的高低，多半跟的是这条三四年一轮的曲线。" },

    /* ================= 教育 ================= */
    { ind:"edu",     lv:"day", name:"课堂专注度", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:10.0, h:2.0},{c:15.0, h:2.0}],
      peaks:[{u:10/24, l:"上午 10:00"},{u:15/24, l:"下午 15:00"}],
      range:"上午 09:00–11:00 / 下午 14:00–16:00",
      sub:"上午与下午各有一段注意力高点，午饭与午后两点各有一个深谷——课表就是围着它排的。",
      example:"最难的课排在上午一二节，午后的第一节课最难讲；不是老师的问题，是这个钟点的问题。" },

    { ind:"edu",     lv:"week", name:"在校周节律", span:7, period:"7 天", chip:"T = 7 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> dayName(Math.round(u*7)),
      shape:(u)=> {
        const d = wrap(u,1) * 7;
        return 1 - 0.80 * smoothPulse(d, 5.9, 1.8, 0.9, 7);
      },
      peaks:[{u:5.9/7, l:"周六日停课"}],
      range:"周一 – 周五",
      sub:"上课、作业与考试的密度在<b>周一至周五</b>形成方波，周末两天整体落下。",
      example:"周一交作业最集中、周五测试最多；周末校门与食堂的量能直接掉一半。" },

    { ind:"edu",     lv:"season", name:"学年与假期", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> {
        const m = wrap(u,1) * 12;
        const term = 0.52 + 0.34 * Math.cos(2*Math.PI*(m - 0.5)/12);
        const sum  = -0.34 * smoothPulse(u, 0.62, 0.06, 0.05);
        const win  = -0.26 * smoothPulse(u, 0.06, 0.05, 0.04);
        return Math.max(0.06, Math.min(1, term + sum + win));
      },
      peaks:[{u:0.05, l:"新学期满负荷"},{u:0.66, l:"8 月暑假谷", below:true}],
      range:"3–6 月 / 9–12 月在学期",
      sub:"一学年两个学期各长约 18 周，中间被<b>寒暑假切出两个深谷</b>，所以入校、离校、校门口堵车都按这个排。",
      example:"寒暑假一放，校门口的路立刻通畅；开学那周则全城早高峰都要挪一段。" },

    /* ================= 旅游 ================= */
    { ind:"tourism", lv:"day", name:"景区客流", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:11.5, h:2.5},{c:16.0, h:2.5}],
      peaks:[{u:11.5/24, l:"上午入园峰"},{u:16/24, l:"下午出园峰"}],
      range:"10:00 – 12:00 / 14:00 – 17:00",
      sub:"入园与出园是错开的两条：<b>上午十点后入园、下午四点前后出园</b>，中间是园内最挤的时段。",
      example:"博物馆与热门景区预约时段都按这条曲线分段限流，把峰摊平。" },

    { ind:"tourism", lv:"season", name:"出游季节", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> {
        const m = wrap(u,1) * 12;
        const base = 0.38 + 0.38 * Math.cos(2*Math.PI*(m - 7.8)/12);
        const cny  = 0.30 * smoothPulse(u, 0.055, 0.05, 0.03);
        const may  = 0.26 * smoothPulse(u, 0.40, 0.025, 0.02);
        const nat  = 0.30 * smoothPulse(u, 0.83, 0.035, 0.025);
        return Math.max(0.04, Math.min(1, base + cny + may + nat));
      },
      peaks:[{u:7.3/12, l:"7–8 月暑期宽峰"},{u:0.83, l:"国庆尖峰"}],
      range:"暑期宽峰 + 三个假期尖峰",
      sub:"出游有<b>一个宽峰（暑假）加三个尖峰（春节、五一、国庆）</b>；冬天是全年最平的一段。",
      example:"景区旺季门票价、酒店房价、航线运力，全都挂在这条曲线的峰谷上。" },

    { ind:"tourism", lv:"month", name:"观景月相", span:29.530588, period:"约 29.5 天", chip:"T = 29.5 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> (u === 1 ? "第 30 天" : "第 " + Math.round(u*29.53) + " 天"),
      shape:(u)=> 0.5*(1+Math.cos(2*Math.PI*u)),
      peaks:[{u:0.5, l:"满月"}],
      range:"满月前后最适合赏月观景",
      sub:"赏月、星空摄影、夜间登山的窗口按<b>29.5 天</b>的月相排：满月那几天最亮，也最不适合看星星。",
      example:"拍银河要挑新月前后；赏月则要挑十五——同一条曲线，两种相反的用法。" },

    /* ================= 体育建筑 ================= */
    { ind:"sports",  lv:"week", name:"赛事周节律", span:7, period:"7 天", chip:"T = 7 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> dayName(Math.round(u*7)),
      shape:(u)=> {
        const d = wrap(u,1) * 7;
        return 0.28 + 0.72 * smoothPulse(d, 5.9, 1.8, 0.9, 7);   /* 窗口落在周末 */

      },
      peaks:[{u:5.9/7, l:"周末比赛日"}],
      range:"周五晚 – 周日下午",
      sub:"比赛与场馆使用集中在<b>周末</b>：周五晚开场、周六周日满档，工作日主要留给训练与维护。",
      example:"周六的城市交通图上，球场周边晚六点会突然多出一个尖峰。" },

    { ind:"sports",  lv:"season", name:"赛季长度", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> {
        const m = wrap(u,1) * 12;
        return Math.max(0.05, Math.min(1, 0.5 + 0.44 * Math.cos(2*Math.PI*(m - 4.5)/12)));
      },
      peaks:[{u:4.5/12, l:"赛季中段最密"},{u:10.3/12, l:"冬歇期谷底", below:true}],
      range:"赛季密集期 / 冬歇期",
      sub:"职业联赛按<b>一个赛季 + 一个冬歇</b>排，场馆在这一年里有一头是空的、一头是满的。",
      example:"冬歇期的场地用来做草皮翻新与演唱会巡演，两头都排得满满的。" },

    { ind:"sports",  lv:"year", name:"奥运与大型赛事", span:4, period:"4 年", chip:"T = 4 年",
      ticksU:[0,.25,.5,.75,1],
      tickLabel:(u)=> (2020 + Math.round(u*4)) + " 年",
      shape:(u)=> {
        const uu = wrap(u,1);
        return uu > 0.22 && uu < 0.28 ? 1 : 0.16;
      },
      peaks:[{u:0.25, l:"奥运年"}],
      range:"四年一届（2020 起算）",
      sub:"奥运会、世界杯这类大赛按<b>四年</b>一轮，场馆建设、申办与转播权谈判全挂在这个节拍上。",
      example:"新建场馆通常要提前好几年动工，而它在大赛后的利用率才是真正的难题。" },

    /* ================= 传媒内容 ================= */
    { ind:"media",   lv:"day", name:"收视与刷屏", span:24, period:"24 小时", chip:"T = 24 小时",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> fmt(u*24),
      windows:[{c:12.5, h:1.5},{c:20.5, h:3.0}],
      peaks:[{u:12.5/24, l:"午间 12:30"},{u:20.5/24, l:"晚间 20:30"}],
      range:"午间小峰 / 晚间主峰",
      sub:"内容消费是<b>午间小峰加晚间主峰</b>：晚八点到十点是全天最高的一段，也是黄金档的由来。",
      example:"电视剧与综艺排播、广告投放价格都按这两个峰定价。" },

    { ind:"media",   lv:"week", name:"周更与档期", span:7, period:"7 天", chip:"T = 7 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> dayName(Math.round(u*7)),
      shape:(u)=> {
        const d = wrap(u,1) * 7;
        return 0.30 + 0.70 * (1 - smoothPulse(d, 1.5, 3.4, 1.6, 7));   /* 周一二低谷、周五六发新 */
      },
      peaks:[{u:5.65/7, l:"周五–周六发新"},{u:1.5/7, l:"周一周二低谷", below:true}],
      range:"周中缓 · 周末高",
      sub:"更新节奏按<b>周</b>排：周中留白、周五周六发新，周一二的讨论热度自然回落。",
      example:"剧集与播客多选在周四晚或周五上线，就是为了让周末有整块时间消费。" },

    { ind:"media",   lv:"season", name:"档期与季播", span:365.2422, period:"365.24 天", chip:"T = 365.24 天",
      ticksU:[0,.25,.5,.75,1], tickLabel:(u)=> monthName((Math.round(u*12) % 12) + 1),
      shape:(u)=> {
        const m = wrap(u,1) * 12;
        const base = 0.42 + 0.28 * Math.cos(2*Math.PI*(m - 1.0)/12);
        const cny  = 0.26 * smoothPulse(u, 0.075, 0.035, 0.026);
        const sum  = 0.34 * smoothPulse(u, 0.58, 0.05, 0.04);
        const nat  = 0.22 * smoothPulse(u, 0.83, 0.03, 0.022);
        return Math.max(0.05, Math.min(1, base + cny + sum + nat));
      },
      peaks:[{u:0.075, l:"春节档"},{u:0.585, l:"暑期档"},{u:0.83, l:"国庆档"}],
      range:"春节 / 暑期 / 国庆三个档",
      sub:"影视与内容投放走<b>春节档、暑期档、国庆档</b>，中间是常规排播的低谷。",
      example:"大制作总往这三个窗口挤，暑期档尤其长——因为观众那两个月的时间最多。" }
];
