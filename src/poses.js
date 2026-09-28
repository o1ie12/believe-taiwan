// One pose per [data-pose] anchor. The tee eases between neighbouring anchors
// as they pass the viewport centre. `hud` fades the scope ring in and out.
const TAU = Math.PI * 2

export const POSES = {
  hero:      { rotY: -0.35,          rotX: 0.06,  x: 0,    y: -0.1,  scale: 1.12, white: 0, hud: 0 },
  statement: { rotY: 0.55,           rotX: 0.04,  x: 1.9,  y: -0.1,  scale: 1.0,  white: 0, hud: 1 },
  mark:      { rotY: -0.45,          rotX: 0.08,  x: 2.3,  y: -1.1,  scale: 1.5,  white: 0, hud: 0 },
  word:      { rotY: Math.PI + 0.35, rotX: 0.04,  x: -1.9, y: -0.2,  scale: 1.2,  white: 0, hud: 0 },
  colorway:  { rotY: TAU,            rotX: 0,     x: 0,    y: -0.05, scale: 0.9,  white: 1, hud: 0 },
  // The Drop: pinned; one pose per stat as it becomes active
  stat0:     { rotY: TAU - 0.45,     rotX: 0.05,  x: 0,    y: 0.45,  scale: 0.8,  white: 0, hud: 1 },
  stat1:     { rotY: TAU + 0.6,      rotX: -0.05, x: 0,    y: 0.45,  scale: 0.8,  white: 0, hud: 1 },
  stat2:     { rotY: TAU + Math.PI,  rotX: 0.05,  x: 0,    y: 0.45,  scale: 0.8,  white: 1, hud: 1 },
  stat3:     { rotY: TAU * 2 - 0.35, rotX: 0.05,  x: 0,    y: 0.45,  scale: 0.8,  white: 1, hud: 1 },
  lookbook:  { rotY: TAU * 2.5,      rotX: -0.4,  x: 0,    y: 6,     scale: 0.6,  white: 1, hud: 0 },
  shop:      { rotY: TAU * 3,        rotX: 0,     x: 0,    y: -0.3,  scale: 0.72, white: 0, hud: 0 },
}

// Phone layouts stack text and tee vertically, so the tee moves out of the
// text's way instead of sitting behind it. Only the differing keys are listed.
const MOBILE = {
  hero: { y: -0.55, scale: 0.95 },
  statement: { y: -1.45, scale: 0.85 },
  mark: { y: 1.05, scale: 1.1 },
  word: { y: 1.05, scale: 1.05 },
  // y is overwritten every frame to sit in the gap above the product cards
  shop: { scale: 0.85 },
}
export const MOBILE_POSES = Object.fromEntries(
  Object.entries(POSES).map(([k, v]) => [k, { ...v, ...(MOBILE[k] || {}) }]),
)

// Mutable UI state the 3D scene reads every frame (no re-renders needed).
export const ui = { shopWhite: null }
