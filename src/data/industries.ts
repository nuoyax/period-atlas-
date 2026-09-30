/**
 * 行业维度。
 *
 * 时间尺度是纵轴（五层），行业是横轴（筛选维度）：一个下拉框，选谁只看谁。
 * 行业不是序数量，所以不占颜色槽——颜色仍然只表示时间尺度，切换行业不会给曲线重新上色
 * （「颜色跟着实体走，不跟筛选走」）。行业只做显隐筛选。
 */

export type IndustryId =
  | 'life' | 'agri' | 'space' | 'marine' | 'health' | 'energy' | 'transport'
  | 'finance' | 'mfg' | 'edu' | 'tourism' | 'sports' | 'media';

export interface Industry {
  id: IndustryId;
  name: string;
  desc: string;
}

export const INDUSTRIES: Industry[] = [
  { id: 'life', name: '生活日常', desc: '原来那组：昼夜节律、月亮、太阳与历法' },
  { id: 'agri', name: '农业', desc: '作物与牲畜的生理节律、节气与生长季' },
  { id: 'space', name: '太空航天', desc: '火箭结构、发动机时序、在轨轨道与空间天气' },
  { id: 'marine', name: '海洋渔业', desc: '潮汐、渔汛与海洋生产力的季节性' },
  { id: 'health', name: '医疗健康', desc: '从心跳呼吸到给药与流行病周期' },
  { id: 'energy', name: '能源电力', desc: '负荷、出力与燃料/检修的年周期' },
  { id: 'transport', name: '交通物流', desc: '客流货运的日内与年内峰谷' },
  { id: 'finance', name: '金融零售', desc: '交易时段、结算、财报与消费节庆' },
  { id: 'mfg', name: '制造业', desc: '班次、保养、订单与库存的节拍' },
  { id: 'edu', name: '教育', desc: '课表、学期与学年的周而复始' },
  { id: 'tourism', name: '旅游', desc: '客流、假期与观景窗口' },
  { id: 'sports', name: '体育建筑', desc: '赛事、赛季与场馆使用的周期' },
  { id: 'media', name: '传媒内容', desc: '档期、排播与更新的节奏' },
];

export const IND: Record<IndustryId, Industry> = Object.fromEntries(
  INDUSTRIES.map((x) => [x.id, x]),
) as Record<IndustryId, Industry>;
