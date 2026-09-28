// One pose per [data-pose] anchor. The tee eases between neighbouring anchors
// as they pass the viewport centre. `hud` fades the scope ring in and out;
// `ink` shows/hides the prints (0 = blank silhouette, used for BELIEVE 02).
const TAU = Math.PI * 2

const BASE = {
  // Home
  hero:      { rotY: -0.35,          rotX: 0.06,  x: 0,    y: -0.1,  scale: 1.12, white: 0, hud: 0 },
  statement: { rotY: 0.55,           rotX: 0.04,  x: 1.9,  y: -0.1,  scale: 1.0,  white: 0, hud: 1 },
  chooser:   { rotY: TAU - 0.3,      rotX: 0.05,  x: 0,    y: -0.25, scale: 0.8,  white: 0, hud: 1 },

  // BELIEVE 01
  'p-hero':  { rotY: -0.5,           rotX: 0.06,  x: 1.8,  y: -0.15, scale: 1.1,  white: 0, hud: 0 },
  mark:      { rotY: -0.45,          rotX: 0.08,  x: 2.3,  y: -1.1,  scale: 1.5,  white: 0, hud: 0 },
  word:      { rotY: Math.PI + 0.35, rotX: 0.04,  x: -1.9, y: -0.2,  scale: 1.2,  white: 0, hud: 0 },
  colorway:  { rotY: TAU,            rotX: 0,     x: 0,    y: -0.05, scale: 0.9,  white: 1, hud: 0 },
  // The Fit: square to the camera, like the flat-lay diagram beside it
  fit:       { rotY: TAU,            rotX: 0,     x: 2.1,  y: -0.1,  scale: 1.0,  white: 0, hud: 1 },
  // The Drop: pinned; one pose per stat as it becomes active
  stat0:     { rotY: TAU - 0.45,     rotX: 0.05,  x: 0,    y: 0.45,  scale: 0.8,  white: 0, hud: 1 },
  stat1:     { rotY: TAU + 0.6,      rotX: -0.05, x: 0,    y: 0.45,  scale: 0.8,  white: 0, hud: 1 },
  stat2:     { rotY: TAU + Math.PI,  rotX: 0.05,  x: 0,    y: 0.45,  scale: 0.8,  white: 1, hud: 1 },
  stat3:     { rotY: TAU * 2 - 0.35, rotX: 0.05,  x: 0,    y: 0.45,  scale: 0.8,  white: 1, hud: 1 },
  lookbook:  { rotY: TAU * 2.5,      rotX: -0.4,  x: 0,    y: 6,     scale: 0.6,  white: 1, hud: 0 },
  shop:      { rotY: TAU * 3,        rotX: 0,     x: 0,    y: -0.3,  scale: 0.72, white: 0, hud: 0 },
  // "Next: BELIEVE 02" — same spot, prints fade to the silhouette
  next:      { rotY: TAU * 3 + 0.35, rotX: 0,     x: 0,    y: -0.3,  scale: 0.72, white: 0, hud: 0, ink: 0 },

  // BELIEVE 02 teaser: a blank silhouette in the scope
  't-hero':  { rotY: 0.4,            rotX: 0.05,  x: 0,    y: -0.2,  scale: 1.0,  white: 0, hud: 1, ink: 0 },
  't-verse': { rotY: Math.PI + 0.6,  rotX: 0.04,  x: 1.9,  y: -0.1,  scale: 0.95, white: 0, hud: 1, ink: 0 },
  't-soon':  { rotY: TAU + 0.4,      rotX: 0.05,  x: 0,    y: 0.4,   scale: 0.75, white: 0, hud: 1, ink: 0 },
}
export const POSES = Object.fromEntries(Object.entries(BASE).map(([k, v]) => [k, { ink: 1, ...v }]))

// Phone layouts stack text and tee vertically, so the tee moves out of the
// text's way instead of sitting behind it. Only the differing keys are listed.
// `track`: the tee's y follows that element (e.g. the gap above product cards).
const MOBILE = {
  hero: { y: -0.55, scale: 0.95 },
  statement: { y: -1.45, scale: 0.85 },
  chooser: { track: '.chooser-gap', scale: 0.85 },
  'p-hero': { y: -0.7, scale: 0.95 },
  mark: { y: 1.05, scale: 1.1 },
  word: { y: 1.05, scale: 1.05 },
  // the fit diagram is tall on phones; the tee steps out of frame and lets it breathe
  fit: { y: 6, scale: 0.6, hud: 0 },
  shop: { track: '.shop-gap', scale: 0.85 },
  next: { track: '.next-gap', scale: 0.8 },
  't-hero': { y: -0.45, scale: 0.95 },
  't-verse': { y: -1.45, scale: 0.85 },
  't-soon': { track: '.t-soon-gap', scale: 0.8 },
}
export const MOBILE_POSES = Object.fromEntries(
  Object.entries(POSES).map(([k, v]) => [k, { ...v, ...(MOBILE[k] || {}) }]),
)

// Mutable UI state the 3D scene reads every frame (no re-renders needed).
// hover: { pose, values } previews values (e.g. { white: 1 }) while that pose is active.
export const ui = { hover: null }
