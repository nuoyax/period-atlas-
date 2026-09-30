/** 波形小图的几何：与原单文件同一套数字，所以曲线形状与坐标完全一致。 */
export const VBW = 720;
export const VBH = 190;
export const PAD = { l: 58, r: 16, t: 22, b: 30 };
export const PW = VBW - PAD.l - PAD.r;
export const PH = VBH - PAD.t - PAD.b;

/** u ∈ [0,1] 是周期进度 → 画布 x */
export const X = (u: number) => PAD.l + u * PW;
/** 0–1 高度 → 画布 y */
export const Y = (a: number) => PAD.t + PH - a * PH;
