"use client"

import * as React from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin"
import { useLenis } from "lenis/react"
import SpiderParticles from "./SpiderParticles"
/* ------------------------------------------------------------------ types */

export type MgnScreen = "cover" | "feed" | "detail" | "stats"
export type MgnDoodle =
  | "guitar" | "dumbbell" | "music" | "plane" | "coffee" | "camera"
  | "plant" | "book" | "headphones" | "globe" | "cat" | "pencil" | "mountain" | "heart"
  | "boxing" | "gamepad" | "palette" | "medal" | "ball"

export type MgnProject = {
  name: string
  /** One line for the phone cover screen. */
  tagline?: string
  /** e.g. "UX/UI · Mobile app". */
  kind?: string
  year?: string
  /** A paragraph. *phrase* gets a pen underline, [phrase] a pen oval. */
  summary: string
  /** A handwritten callout next to the summary. */
  challenge?: string
  /** A handwritten aside beside the phones. */
  note?: string
  /** Up to three numbers that count up and get circled. */
  stats?: { value: number; decimals?: number; suffix?: string; label: string }[]
  /** Photos used inside the phone screens, in order. */
  images: string[]
  /** Verified public project screenshot, when one is available. */
  coverImage?: string
  coverImageAlt?: string
  coverImageLabel?: string
  coverImageFit?: "cover" | "contain"
  /** Which mock screens the three phones show. */
  screens?: MgnScreen[]
  /** The app's own UI colour inside the screens. */
  accent?: string
  /** Sheet colour; defaults alternate night / paper. */
  tone?: "paper" | "night"
  /** A handwritten tag written above its phone on the Projects sheet. */
  tag?: string
  href?: string
  demo?: string
  repo?: string
  devpost?: string
  devfolio?: string
  stack?: string[]
  contribution?: string
  attribution?: string
}

export type MgnTool = { name: string; mark: string; bg: string; fg: string; note?: string }
export type MgnEducation = { title: string; place?: string; period?: string; circled?: boolean }
export type MgnAcademicHighlight = { label: string; board: string; result: string }
export type MgnLanguage = { name: string; level: string; value: number }
export type MgnFact = { doodle?: MgnDoodle; text: string; label?: string }
export type MgnLink = { label: string; href: string }
export type MgnRecord = {
  title: string
  organization?: string
  period?: string
  description: string
  category?: string
  href?: string
  linkLabel?: string
  tags?: string[]
  /** Optional public image associated with this record (profile, event, article or project). */
  image?: string
  imageAlt?: string
}
export type MgnSection = "cover" | "hello" | "education" | "experience" | "communities" | "skills" | "projects" | "cases" | "talks" | "writing" | "recognition" | "facts" | "thanks"

export type PulkitPortfolioProps = {
  name?: string
  /** Short role tagline displayed beneath the cover name. */
  role?: string
  year?: string
  location?: string
  /** The giant cover word. */
  title?: string
  /** Middle of the top bar. */
  docLabel?: string
  /** Portrait photo URL; shown in greyscale, colour on hover. */
  portrait?: string
  /** Optional looping video treatment for the portrait panel. */
  portraitVideo?: string
  /** Handwritten words around the portrait, each with an arrow pointing in. */
  traits?: string[]
  greeting?: string
  /** *phrase* gets a pen underline, [phrase] a pen oval. */
  bio?: string
  educationIntro?: string
  education?: MgnEducation[]
  educationHighlights?: MgnAcademicHighlight[]
  educationAsideTitle?: string
  educationAside?: string
  /** What the QR code opens; null hides the code. */
  cvUrl?: string | null
  cvNote?: string
  languages?: MgnLanguage[]
  tools?: MgnTool[]
  toolNote?: string
  skillsIntro?: string
  skills?: string[]
  books?: { title: string; color: string }[]
  booksNote?: string
  projectsNote?: string
  projects?: MgnProject[]
  experience?: MgnRecord[]
  communities?: MgnRecord[]
  talks?: MgnRecord[]
  writing?: MgnRecord[]
  recognition?: MgnRecord[]
  facts?: MgnFact[]
  /** A handwritten line beside the Fun Facts heading. */
  factsNote?: string
  thanks?: string
  email?: string
  links?: MgnLink[]
  /** The closing letter; blank lines split paragraphs. */
  letter?: string
  signature?: string
  /** Which sheets to show, in order. */
  sections?: MgnSection[]
  sectionTitles?: Partial<Record<"skills" | "projects" | "facts" | "experience" | "communities" | "talks" | "writing" | "recognition", string>>
  colors?: { paper?: string; night?: string; ink?: string; pen?: string; blue?: string }
  /** href: a stylesheet for the faces below (null loads nothing). */
  fonts?: { href?: string | null; display?: string; hand?: string; body?: string }
  /** The ink trail on the cover. */
  inkTrail?: boolean
  /** One "screen" of the template — every sheet is at least this tall. */
  height?: string
  className?: string
}

/* ------------------------------------------------------------------ logic */

// #region logic
type Pt = [number, number]

function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

/** Deterministic 0..1 noise, so pen marks look the same on every render. */
function rand(seed: number): () => number {
  let s = (Math.floor(seed * 9973) ^ 0x9e3779b9) >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function r1(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}

/** Catmull-Rom through the points, as cubic Béziers. */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return ""
  let d = "M" + r1(pts[0][0]) + " " + r1(pts[0][1])
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += "C" + r1(c1[0]) + " " + r1(c1[1]) + " " + r1(c2[0]) + " " + r1(c2[1]) + " " + r1(p2[0]) + " " + r1(p2[1])
  }
  return d
}

/** A hand-drawn loop around a w×h box: a bit more than one turn, never closed. */
function ovalPath(w: number, h: number, seed: number): string {
  const R = rand(seed)
  const cx = w / 2
  const cy = h / 2
  const rx = Math.max(4, w / 2 - 3)
  const ry = Math.max(4, h / 2 - 3)
  const start = -2.5 + R() * 0.6
  const sweep = Math.PI * 2 * (1.1 + R() * 0.08)
  const n = 30
  const pts: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = start + sweep * t
    // the pen drifts inward as it comes round, so the ends overlap, not meet
    const k = 1.04 - 0.09 * t + (R() - 0.5) * 0.03
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k + (t - 0.5) * 2])
  }
  return smoothPath(pts)
}

/** A quick underline with a short return stroke. */
function underlinePath(w: number, h: number, seed: number): string {
  const R = rand(seed)
  const y = h - 4
  const pts: Pt[] = []
  const n = 8
  for (let i = 0; i <= n; i++) pts.push([2 + ((w - 4) * i) / n, y + Math.sin(i * 1.3 + R() * 2) * 1.4 - i * 0.25])
  const back = 0.35 + R() * 0.25
  const end = pts[pts.length - 1]
  // a tight turn at the end, then a short stroke back under the line
  return (
    smoothPath(pts) +
    "Q" + r1(end[0] + 3) + " " + r1(end[1] + 1.5) + " " + r1(end[0] - 6) + " " + r1(y + 2.6) +
    "L" + r1(w * (1 - back)) + " " + r1(y + 3.2 + R())
  )
}

/** A loose rectangle whose corners overshoot, like a box drawn in two goes. */
function boxPath(w: number, h: number, seed: number): string {
  const R = rand(seed)
  const j = () => (R() - 0.5) * 4
  const o = 6
  return (
    "M" + r1(-o + j()) + " " + r1(2 + j()) + "L" + r1(w + o + j()) + " " + r1(j()) +
    "M" + r1(w - 2 + j()) + " " + r1(-o + j()) + "L" + r1(w + j()) + " " + r1(h + o + j()) +
    "M" + r1(w + o + j()) + " " + r1(h - 2 + j()) + "L" + r1(-o + j()) + " " + r1(h + j()) +
    "M" + r1(2 + j()) + " " + r1(h + o + j()) + "L" + r1(j()) + " " + r1(-o + j())
  )
}

/** A curved arrow from a to b, bent sideways by `bend` × its length. */
function arrowPaths(a: Pt, b: Pt, bend: number, head = 9): { shaft: string; head: string } {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  const c: Pt = [(a[0] + b[0]) / 2 - (dy / len) * len * bend, (a[1] + b[1]) / 2 + (dx / len) * len * bend]
  const shaft = "M" + r1(a[0]) + " " + r1(a[1]) + "Q" + r1(c[0]) + " " + r1(c[1]) + " " + r1(b[0]) + " " + r1(b[1])
  const ang = Math.atan2(b[1] - c[1], b[0] - c[0])
  const s = 0.5
  const h1: Pt = [b[0] - Math.cos(ang - s) * head, b[1] - Math.sin(ang - s) * head]
  const h2: Pt = [b[0] - Math.cos(ang + s) * head, b[1] - Math.sin(ang + s) * head]
  return {
    shaft,
    head: "M" + r1(h1[0]) + " " + r1(h1[1]) + "L" + r1(b[0]) + " " + r1(b[1]) + "L" + r1(h2[0]) + " " + r1(h2[1]),
  }
}

/** The two shapes a heading underline morphs between: zig-zag → swoosh. Same point count. */
function underlineMorph(w: number, seed: number): { from: string; to: string } {
  const R = rand(seed)
  const n = 14
  const zig: Pt[] = []
  const swoosh: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    zig.push([4 + (w - 8) * t, 12 + (i % 2 ? -7 : 7) * (0.6 + R() * 0.5)])
    swoosh.push([4 + (w - 8) * t, 15 - Math.sin(t * Math.PI) * 6 - t * 4])
  }
  return { from: smoothPath(zig), to: smoothPath(swoosh) }
}

/** A four-point sparkle, as one closed path (also the morph source for the heart). */
function sparklePath(cx: number, cy: number, r: number): string {
  const k = r * 0.22
  return (
    "M" + r1(cx) + " " + r1(cy - r) +
    "C" + r1(cx + k * 0.4) + " " + r1(cy - k) + " " + r1(cx + k) + " " + r1(cy - k * 0.4) + " " + r1(cx + r) + " " + r1(cy) +
    "C" + r1(cx + k) + " " + r1(cy + k * 0.4) + " " + r1(cx + k * 0.4) + " " + r1(cy + k) + " " + r1(cx) + " " + r1(cy + r) +
    "C" + r1(cx - k * 0.4) + " " + r1(cy + k) + " " + r1(cx - k) + " " + r1(cy + k * 0.4) + " " + r1(cx - r) + " " + r1(cy) +
    "C" + r1(cx - k) + " " + r1(cy - k * 0.4) + " " + r1(cx - k * 0.4) + " " + r1(cy - k) + " " + r1(cx) + " " + r1(cy - r) + "Z"
  )
}

function heartPath(cx: number, cy: number, r: number): string {
  const s = r / 10
  const p = (x: number, y: number) => r1(cx + x * s) + " " + r1(cy + y * s)
  return (
    "M" + p(0, -3.5) +
    "C" + p(2, -9) + " " + p(10, -8) + " " + p(10, -2) +
    "C" + p(10, 3) + " " + p(4, 6.5) + " " + p(0, 10) +
    "C" + p(-4, 6.5) + " " + p(-10, 3) + " " + p(-10, -2) +
    "C" + p(-10, -8) + " " + p(-2, -9) + " " + p(0, -3.5) + "Z"
  )
}

export type Mark = { text: string; mark: "" | "under" | "oval" }

/** "plain *under* and [oval]" → runs. Unclosed markers stay literal. */
function parseMarks(s: string): Mark[] {
  const out: Mark[] = []
  const re = /\*([^*]+)\*|\[([^\]]+)\]/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), mark: "" })
    out.push(m[1] != null ? { text: m[1], mark: "under" } : { text: m[2], mark: "oval" })
    last = m.index + m[0].length
  }
  if (last < s.length) out.push({ text: s.slice(last), mark: "" })
  return out
}

function formatCount(v: number, decimals: number): string {
  return decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-US")
}

/** Where the deck card i sits before the deal: a loose, seeded pile. */
function pileOffset(i: number, n: number): { x: number; y: number; r: number } {
  const R = rand(i + 7)
  return { x: (R() - 0.5) * 40, y: (R() - 0.5) * 30 - (n - i) * 2, r: (R() - 0.5) * 28 }
}

/** Where the orbiting star is at phase t (0..1) on a tilted ellipse; front = in front of the letter. */
function orbitPoint(t: number, rx: number, ry: number, tilt: number): { x: number; y: number; front: boolean } {
  const a = t * Math.PI * 2
  const x0 = Math.cos(a) * rx
  const y0 = Math.sin(a) * ry
  const c = Math.cos(tilt)
  const s = Math.sin(tilt)
  return { x: x0 * c - y0 * s, y: x0 * s + y0 * c, front: Math.sin(a) > 0 }
}

/** A slightly wobbly horizontal pen line from x1 to x2. */
function handLine(x1: number, x2: number, y: number, seed: number): string {
  const R = rand(seed)
  const n = Math.max(2, Math.round((x2 - x1) / 22))
  const pts: Pt[] = []
  for (let i = 0; i <= n; i++) pts.push([x1 + ((x2 - x1) * i) / n, y + (R() - 0.5) * 3])
  return smoothPath(pts)
}

function pad2(n: number): string {
  return (n < 10 ? "0" : "") + n
}

/** True for colours light enough to need dark text on top. */
function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return false
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
  const v = parseInt(h, 16)
  const lum = (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255
  return lum > 0.62
}

// ---- QR code: byte mode, error level M, versions 1–6 (up to 106 bytes).
const QR_EXP: number[] = []
const QR_LOG: number[] = []
  ; (function initGF() {
    let x = 1
    for (let i = 0; i < 255; i++) {
      QR_EXP[i] = x
      QR_LOG[x] = i
      x <<= 1
      if (x & 256) x ^= 0x11d
    }
    for (let i = 255; i < 512; i++) QR_EXP[i] = QR_EXP[i - 255]
  })()

function gfMul(a: number, b: number): number {
  return a && b ? QR_EXP[QR_LOG[a] + QR_LOG[b]] : 0
}

function rsRemainder(data: number[], n: number): number[] {
  let gen = [1]
  for (let i = 0; i < n; i++) {
    const next = new Array(gen.length + 1).fill(0)
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j]
      next[j + 1] ^= gfMul(gen[j], QR_EXP[i])
    }
    gen = next
  }
  const res = new Array(n).fill(0)
  for (const d of data) {
    const f = d ^ res[0]
    res.shift()
    res.push(0)
    for (let j = 0; j < n; j++) res[j] ^= gfMul(gen[j + 1], f)
  }
  return res
}

function utf8(s: string): number[] {
  const out: number[] = []
  for (const ch of s) {
    let c = ch.codePointAt(0) || 0
    if (c < 0x80) out.push(c)
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63))
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
  }
  return out
}

// [data codewords per block, EC codewords per block, blocks] at level M
const QR_M = [[0, 0, 0], [16, 10, 1], [28, 16, 1], [44, 26, 1], [32, 18, 2], [43, 24, 2], [27, 16, 4]]

function qrMask(m: number, x: number, y: number): boolean {
  switch (m) {
    case 0: return (x + y) % 2 === 0
    case 1: return y % 2 === 0
    case 2: return x % 3 === 0
    case 3: return (x + y) % 3 === 0
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
    default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
  }
}

function qrPenalty(g: boolean[][]): number {
  const n = g.length
  let p = 0
  let dark = 0
  for (let a = 0; a < n; a++) {
    for (const horiz of [true, false]) {
      let run = 1
      for (let b = 1; b <= n; b++) {
        const same = b < n && (horiz ? g[a][b] === g[a][b - 1] : g[b][a] === g[b - 1][a])
        if (same) run++
        else {
          if (run >= 5) p += run - 2
          run = 1
        }
      }
      for (let b = 0; b + 10 < n; b++) {
        let s = ""
        for (let k = 0; k < 11; k++) s += (horiz ? g[a][b + k] : g[b + k][a]) ? "1" : "0"
        if (s === "10111010000" || s === "00001011101") p += 40
      }
    }
  }
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (g[y][x]) dark++
      if (x < n - 1 && y < n - 1 && g[y][x] === g[y][x + 1] && g[y][x] === g[y + 1][x] && g[y][x] === g[y + 1][x + 1]) p += 3
    }
  p += Math.floor(Math.abs((dark * 20) / (n * n) - 10)) * 10
  return p
}

/** The QR module grid for `text` (true = dark), or null when it is too long. */
function qrMatrix(text: string): boolean[][] | null {
  const bytes = utf8(text)
  let ver = 1
  while (ver <= 6 && 12 + bytes.length * 8 > QR_M[ver][0] * QR_M[ver][2] * 8) ver++
  if (ver > 6) return null
  const [per, ecn, blocks] = QR_M[ver]
  const cap = per * blocks
  const bits: number[] = []
  const put = (v: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((v >>> i) & 1)
  }
  put(4, 4)
  put(bytes.length, 8)
  for (const b of bytes) put(b, 8)
  put(0, Math.min(4, cap * 8 - bits.length))
  while (bits.length % 8) bits.push(0)
  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2))
  for (let pad = 0xec; data.length < cap; pad ^= 0xec ^ 0x11) data.push(pad)
  const dataBlocks: number[][] = []
  const ecBlocks: number[][] = []
  for (let b = 0; b < blocks; b++) {
    const chunk = data.slice(b * per, (b + 1) * per)
    dataBlocks.push(chunk)
    ecBlocks.push(rsRemainder(chunk, ecn))
  }
  const stream: number[] = []
  for (let i = 0; i < per; i++) for (const blk of dataBlocks) stream.push(blk[i])
  for (let i = 0; i < ecn; i++) for (const blk of ecBlocks) stream.push(blk[i])

  const size = 17 + ver * 4
  const mods: boolean[][] = []
  const fn: boolean[][] = []
  for (let y = 0; y < size; y++) {
    mods.push(new Array(size).fill(false))
    fn.push(new Array(size).fill(false))
  }
  const set = (x: number, y: number, v: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    mods[y][x] = v
    fn[y][x] = true
  }
  for (const [fx, fy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy))
        set(fx + dx, fy + dy, d !== 2 && d !== 4)
      }
  }
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0)
    set(i, 6, i % 2 === 0)
  }
  if (ver > 1) {
    const c = size - 7
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) set(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
  }
  const drawFormat = (mask: number) => {
    const d = mask // level M is 00
    let rem = d
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
    const f = ((d << 10) | rem) ^ 0x5412
    const bit = (i: number) => ((f >>> i) & 1) === 1
    for (let i = 0; i <= 5; i++) set(8, i, bit(i))
    set(8, 7, bit(6))
    set(8, 8, bit(7))
    set(7, 8, bit(8))
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i))
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i))
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i))
    set(8, size - 8, true)
  }
  drawFormat(0)
  let i = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++)
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert
        if (!fn[y][x] && i < stream.length * 8) {
          mods[y][x] = ((stream[i >>> 3] >>> (7 - (i & 7))) & 1) === 1
          i++
        }
      }
  }
  let best: boolean[][] = mods
  let bestScore = Infinity
  for (let m = 0; m < 8; m++) {
    drawFormat(m)
    const g = mods.map((row, y) => row.map((v, x) => (fn[y][x] ? v : v !== qrMask(m, x, y))))
    const score = qrPenalty(g)
    if (score < bestScore) {
      bestScore = score
      best = g
    }
  }
  return best
}
// #endregion logic

/* ---------------------------------------------------------------- content */

// #region content
const U = "https://images.unsplash.com/photo-"

const DEFAULT_FONT =
  "https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Poppins:wght@300;400;500;600&display=swap"

const DEFAULT_PROJECTS: MgnProject[] = [
  {
    name: "TidePrint",
    tagline: "A coastal-focused digital experience.",
    kind: "Web experience · Coastal project",
    summary: "A coastal-focused digital experience with a public deployment and source repository. This case file links directly to the running product and code; implementation details will be expanded from the repository rather than inferred from the project name.",
    challenge: "Explore the live experience and inspect the source implementation.",
    note: "live build + source",
    images: [],
    accent: "#1769aa",
    tag: "featured build",
    demo: "https://tideprint-coastal.vercel.app/",
    repo: "https://github.com/pulkitsinghdev/tideprint",
    stack: [],
  },
  {
    name: "SmokePath",
    tagline: "Turning tomorrow's pollution forecast into a school-specific action plan.",
    kind: "Cloud · Data systems · Environmental tech",
    year: "2026",
    summary: "SmokePath turns tomorrow's pollution forecast into a school-specific action plan. Every three hours, it brings together CAMS PM2.5 forecasts, NASA VIIRS fire detections and NOAA GFS winds, then corrects forecasts using CPCB ground-monitor observations. It generates a *smoke ticket* with potential sources, estimated arrival times and air-quality status for each timetable period.",
    challenge: "Translate several environmental data sources into a useful, time-aware school decision aid.",
    note: "forecast → school action",
    images: [],
    accent: "#1769aa",
    tag: "cloud + data",
    demo: "https://d35jtpishdgz20.cloudfront.net/",
    repo: "https://github.com/dhruvdumra/smokepath",
    stack: ["AWS SAM", "Lambda", "EventBridge", "S3", "CloudFront", "DynamoDB", "Amazon Bedrock", "CAMS", "NASA VIIRS", "NOAA GFS", "CPCB"],
    attribution: "Team project · Repository maintained under dhruvdumra",
  },
  {
    name: "Holistic Human Classifier",
    tagline: "Browser-based human understanding with MediaPipe.",
    kind: "Computer vision · MediaPipe",
    year: "2021",
    summary: "A browser-based human-recognition experiment built with HTML, CSS, JavaScript and MediaPipe. It detects a person in front of the camera and draws a holistic visual frame over the subject, exploring how real-time human perception can support AR/VR and interactive experiences.",
    challenge: "Bring live human perception into a lightweight browser experience.",
    note: "camera → landmarks → overlay",
    images: [],
    coverImage: "/media/projects/holistic-human-classifier.webp",
    coverImageAlt: "Original MediaPipe Holistic demo capture showing facial and hand landmarks over camera input",
    coverImageLabel: "ORIGINAL SCREEN CAPTURE / MEDIAPIPE HOLISTIC",
    coverImageFit: "contain",
    accent: "#1769aa",
    tag: "computer vision",
    demo: "https://codepen.io/pulkitsinghdev/pen/qBRpxrj",
    devpost: "https://devpost.com/software/holistic-media-pipe",
    stack: ["JavaScript", "HTML", "CSS", "MediaPipe", "AI / ML"],
    contribution: "The Devpost project page lists Pulkit Singh as creator and documents the MediaPipe integration and browser implementation.",
  },
  {
    name: "Peace in Space",
    tagline: "A mood-aware web experience built for Peace Out Hacks.",
    kind: "Hackathon · Web · Applied AI",
    year: "2021",
    summary: "A mood-oriented web experience that recognises facial expressions and routes visitors to a matching page with calming activities. The team designed the interface in Figma, built the responsive website and integrated face-expression detection. It received the *Best Space App powered by Space Force* award at Peace Out Hacks.",
    challenge: "Connect an expression-recognition interaction with a responsive, mood-specific experience.",
    note: "team project · MLH award",
    images: [],
    coverImage: "/media/projects/peace-out-hacks-cover.webp",
    coverImageAlt: "Peace Out Hacks event artwork associated with the Peace in Space team submission",
    coverImageLabel: "PEACE OUT HACKS / EVENT ARTWORK",
    coverImageFit: "cover",
    accent: "#1769aa",
    tag: "award-winning team build",
    demo: "https://peace-in-space.vercel.app/",
    repo: "https://github.com/DevrajDC/mlh-peaceout-hacks",
    devpost: "https://devpost.com/software/peace-in-space",
    stack: ["HTML", "CSS", "JavaScript", "Face API", "Figma", "Deep Learning"],
    attribution: "Team project · Built with collaborators; see the Devpost and repository for team credits.",
    contribution: "My CV records designing the UI in Figma and helping build the responsive web app from scratch.",
  },
  {
    name: "Voice Based Pacman",
    tagline: "Classic gameplay controlled through voice commands.",
    kind: "Accessibility · JavaScript game",
    year: "2021",
    summary: "A voice-controlled Pac-Man game designed to make directional gameplay more accessible to people who may find keyboard-based movement difficult. Players can issue spoken commands instead of relying only on finger movements. The team submitted it to Hack the Space 2021 and secured second place.",
    challenge: "Make directional game controls possible through spoken commands.",
    note: "voice-first interaction",
    images: [],
    coverImage: "/media/projects/voice-based-pacman.webp",
    coverImageAlt: "Original Voice Based Pacman game capture showing the maze, score and voice-input control",
    coverImageLabel: "VOICE BASED PACMAN / GAME CAPTURE",
    coverImageFit: "contain",
    accent: "#f0183c",
    tag: "accessibility build",
    repo: "https://github.com/aeyshubh/Voice-based-Pacman",
    devfolio: "https://devfolio.co/projects/voice-based-pacman-db80",
    stack: ["JavaScript", "HTML", "CSS", "Alan AI"],
    attribution: "Team project · Repository and submission credit the project team.",
  },
  {
    name: "Social Distance & Mask Detector",
    tagline: "Computer vision for real-time safety monitoring.",
    kind: "Computer vision · Python",
    year: "2021",
    summary: "A collaborative project repository focused on social-distance monitoring and face-mask detection. The public source is included here as a documented team project; individual implementation ownership is not claimed without a contribution record.",
    challenge: "Apply live video analysis to two public-health monitoring tasks.",
    note: "collaborative repository",
    images: [],
    accent: "#1769aa",
    tag: "computer vision",
    repo: "https://github.com/DevrajDC/Social-Distance-and-Mask-Detector",
    stack: [],
    attribution: "Collaborative work · Repository is under DevrajDC; individual contribution details should be documented before publication.",
  },
]

const DEFAULT_EXPERIENCE: MgnRecord[] = [
  { title: "Full Stack Development Intern", organization: "TechVraksh", period: "Mar — Jun 2021", category: "Internship", description: "Worked with the core team on full-stack web development, collaborating with other interns and the team across project work.", tags: ["Web development", "Collaboration"] },
  { title: "Technical Writer (Contract)", organization: "KubeSphere", period: "Dec 2022 — Feb 2023", category: "Technical writing", description: "Wrote technical articles covering Kubernetes fundamentals, container runtimes, and migration from Docker to containerd and CRI-O.", href: "https://kubesphere.io/blogs/kubernetes-fundamentals-part-1/", linkLabel: "Read KubeSphere articles", tags: ["Kubernetes", "Documentation", "Cloud native"] },
  { title: "Technical Author", organization: "freeCodeCamp", period: "2021 · published work", category: "Technical publication", description: "Published beginner-friendly articles on online safety and developer communities. The articles remain publicly available in the freeCodeCamp publication archive.", href: "https://www.freecodecamp.org/news/how-to-be-safe-online/", linkLabel: "Read published articles", tags: ["Technical writing", "Developer education"] },
  { title: "Tech Co-Lead", organization: "ACM Student Chapter · SRM University-AP", period: "2026 — present", category: "Technical leadership", description: "Working with the chapter on technical activities and initiatives that connect hands-on engineering with the student developer community.", tags: ["ACM", "Technical community"] },
]

const DEFAULT_COMMUNITIES: MgnRecord[] = [
  { title: "Founder & Lead Organizer", organization: "Programmers Universal Group (PUG)", period: "2021 — 2023", category: "Community founded and built", description: "Founded and grew PUG into a developer community of 800+ members. Organised technical sessions, hackathons, podcasts and community activities, and mentored 100+ people as they explored programming and the wider developer ecosystem.", tags: ["800+ members", "Community building", "Mentorship", "Events"] },
  { title: "Founder & Lead Organizer", organization: "CNCF Navi Mumbai", period: "Jun 2021 — Jun 2023", category: "Cloud-native community", description: "Helped establish and lead the local CNCF community group, coordinating meetups and sessions with speakers and community collaborators around cloud-native technology.", href: "https://x.com/cncfnavimumbai", linkLabel: "Community profile", tags: ["CNCF", "Cloud native", "Meetups"] },
  { title: "Assistant Organizer", organization: "TensorFlow User Group Chandigarh", period: "2020 — 2021", category: "Community operations", description: "Supported the group’s operations, helped set up and moderate its Discord community, and hosted online meetups, events and talks.", tags: ["TFUG", "Meetups", "Community operations"] },
  { title: "Web Developer / Volunteer", organization: "Google Developer Group Cloud Chandigarh", period: "2020 — 2021", category: "Developer community", description: "Contributed to community web work and supported meetups and event activities as a volunteer.", tags: ["GDG Cloud", "Web development", "Events"] },
  { title: "Guild Leader, Organizer & Mentor", organization: "Major League Hacking", period: "Jan 2021 — Nov 2022", category: "Hackathon ecosystem", description: "Supported hackathon communities and participants through organizing, guidance and mentorship across the MLH ecosystem.", tags: ["MLH", "Hackathons", "Mentorship"] },
  { title: "Mentor & Judge", organization: "TechTogether · New York, Seattle & Atlanta", period: "2021 — 2022", category: "Hackathon community", description: "Supported participants through mentoring and judging roles across multiple TechTogether events.", tags: ["Mentorship", "Judging", "Hackathons"] },
  { title: "Volunteer & Speaker", organization: "Data on Kubernetes Community", period: "Aug — Nov 2021", category: "Cloud-native community", description: "Contributed to community activity and spoke at Data on Kubernetes Students Day 2021.", href: "https://youtube.com/playlist?list=PLHgdNuGxrJt0Tr28IbaGI7aYAEASIAiwz", linkLabel: "Watch event sessions", tags: ["Kubernetes", "Speaking"] },
  { title: "Event Ambassador", organization: "DeepLearning.AI", period: "2021", category: "Ambassador program", description: "Represented and promoted AI learning events as an event ambassador in the DeepLearning.AI community.", tags: ["AI education", "Community"] },
  { title: "Student Ambassador", organization: "AngelHack", period: "Sep 2021 — Mar 2023", category: "Developer ecosystem", description: "Supported hackathon and builder-community outreach as a student ambassador.", tags: ["Hackathons", "Outreach"] },
  { title: "Volunteer / Facilitator", organization: "Mozilla Festival", period: "Jan — Mar 2021", category: "Open web community", description: "Volunteered with the Mozilla Festival team and facilitated a youth-zone session introducing Git and GitHub.", href: "https://pretalx.com/mozfest-2021/talk/review/3YDMJA37HTK3TXTRAMUDGCJAXJHRBWRL/", linkLabel: "Festival session listing", tags: ["Mozilla", "Open web", "Git"] },
  { title: "Web Developer / Designer", organization: "Google Educator Groups · Ahmedabad & Pune", period: "2020 — 2021", category: "Community websites", description: "Helped develop and maintain responsive websites for the educator groups and supported their online presence.", tags: ["Web development", "Community"] },
  { title: "Judge & Mentor", organization: "SheCanSTEM · LunarHacks · RU Hacks · Hack the Mountains", period: "2021 — 2022", category: "Hackathon ecosystem", description: "Reviewed submissions, mentored participants and supported teams across multiple hackathon events.", href: "https://lunarhacks-2022.devpost.com/", linkLabel: "LunarHacks event", tags: ["Judging", "Mentorship", "Hackathons"] },
  { title: "Community Volunteer", organization: "Progate · HackOn · GitHub Field Day India", period: "2020 — 2021", category: "Community participation", description: "Participated in developer-community and learning initiatives, including selection to attend GitHub Field Day India 2021.", href: "https://githubfieldday.com/in2021/", linkLabel: "GitHub Field Day India", tags: ["Developer ecosystem", "Open source"] },
]


// A single chronological record of paid work, publication, community leadership,
// developer programmes, volunteering and mentorship. Education remains separate.
const DEFAULT_TIMELINE: MgnRecord[] = [
  ...DEFAULT_COMMUNITIES,
  ...DEFAULT_EXPERIENCE,
].sort((a, b) => {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
  const startOf = (record: MgnRecord) => {
    const period = record.period || ""
    const year = Number(period.match(/20\d{2}/)?.[0] ?? 9999)
    const monthName = period.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/i)?.[1]?.toLowerCase().slice(0, 3)
    return [year, monthName ? months.indexOf(monthName) + 1 : 0] as const
  }
  const [yearA, monthA] = startOf(a)
  const [yearB, monthB] = startOf(b)
  return yearA - yearB || monthA - monthB
})


const DEFAULT_TALKS: MgnRecord[] = [
  { title: "React India Remote Edition 2021", organization: "React India", period: "12–13 Nov 2021", category: "Conference speaker", description: "Listed in the official 2021 speaker archive as a representative of Programmers Universal Group. My contemporaneous profile described this as a milestone as the youngest speaker at React India.", href: "https://archive.reactindia.io/conferences/2021", linkLabel: "Official speaker archive", tags: ["React", "Conference", "Developer communities"] },
  { title: "Taking Your Code to the Next Level with Open Source (Git & GitHub)", organization: "C# Corner · Code Quality & Performance Virtual Conference", period: "18 Jun 2021", category: "Technical talk", description: "A session on using Git and GitHub to improve development workflows and engage with open source. The conference schedule lists the session under Pulkit Singh.", href: "https://youtube.com/playlist?list=PLEy5IbO-F1-kraSKXt_R-O-hTEPECklYX", linkLabel: "Watch conference recordings", tags: ["Git", "GitHub", "Open source"] },
  { title: "Data on Kubernetes Students Day", organization: "Data on Kubernetes Community", period: "2021", category: "Community speaker", description: "Spoke as part of the Students Day programming; recordings are available in the community playlist.", href: "https://youtube.com/playlist?list=PLHgdNuGxrJt0Tr28IbaGI7aYAEASIAiwz", linkLabel: "Watch event playlist", tags: ["Kubernetes", "Cloud native"] },
  { title: "Git & GitHub in the Youth Zone", organization: "Mozilla Festival", period: "2021", category: "Workshop / facilitation", description: "Facilitated a youth-zone session introducing Git and GitHub, helping younger participants understand the basics of open-source collaboration.", href: "https://pretalx.com/mozfest-2021/talk/review/3YDMJA37HTK3TXTRAMUDGCJAXJHRBWRL/", linkLabel: "Festival session listing", tags: ["Mozilla", "Git", "Youth education"] },
  { title: "Hackathon Judge & Mentor", organization: "TechTogether · SheCanSTEM · LunarHacks · RU Hacks · Hack the Mountains", period: "2021 — 2022", category: "Judging & mentorship", description: "Reviewed project submissions, mentored teams and supported participants across multiple hackathon events. Individual event roles are listed in the community history.", href: "https://lunarhacks-2022.devpost.com/", linkLabel: "LunarHacks judges listing", tags: ["Judging", "Mentorship", "Hackathons"] },
]


const DEFAULT_WRITING: MgnRecord[] = [
  { title: "How to Be Safe Online", organization: "freeCodeCamp News", period: "2021", category: "Published article", description: "A practical introduction to safer online habits and digital awareness for readers getting started with the web.", href: "https://www.freecodecamp.org/news/how-to-be-safe-online/", linkLabel: "Read article", tags: ["Digital safety", "Education"] },
  { title: "Tech Communities", organization: "freeCodeCamp News", period: "2021", category: "Published article", description: "An introduction to developer communities and the role they play in learning, collaboration and finding opportunities.", href: "https://www.freecodecamp.org/news/tech-communities/", linkLabel: "Read article", tags: ["Communities", "Open source"] },
  { title: "Kubernetes Fundamentals — Part 1", organization: "KubeSphere Blog", period: "2022", category: "Technical article", description: "A technical walkthrough introducing Kubernetes fundamentals.", href: "https://kubesphere.io/blogs/kubernetes-fundamentals-part-1/", linkLabel: "Read article", tags: ["Kubernetes", "Cloud native"] },
  { title: "Explaining Container Runtimes", organization: "KubeSphere Blog", period: "2022 — 2023", category: "Technical article", description: "A technical explainer on container runtimes and how they fit into the Kubernetes ecosystem.", href: "https://kubesphere.io/blogs/part-1-explaining-container-runtimes/", linkLabel: "Read article", tags: ["Containers", "Kubernetes"] },
  { title: "Migrating to containerd and CRI-O after Docker Deprecation", organization: "KubeSphere Blog", period: "2023", category: "Technical article", description: "A practical article covering the migration context and the use of containerd and CRI-O in Kubernetes environments.", href: "https://kubesphere.io/blogs/part-2-how-to-migrate-to-containerd-and-cri-o-after-docker-deprecation-in-kubernetes/", linkLabel: "Read article", tags: ["containerd", "CRI-O", "Kubernetes"] },
  { title: "Universal Casts", organization: "Community podcast", period: "2021", category: "Podcast / conversations", description: "A short-form podcast exploring developer communities and conversations with people from the cloud-native ecosystem.", href: "https://podcasts.apple.com/ug/podcast/universal-casts/id1584842047", linkLabel: "Listen to the podcast", tags: ["Podcast", "Community stories"] },
  { title: "Pulkit Singh on Hashnode", organization: "Hashnode", period: "Writing profile", category: "Writing profile", description: "A home for technical notes, learning write-ups and longer-form engineering stories.", href: "https://hashnode.com/@PulkitSingh", linkLabel: "Visit Hashnode", tags: ["Technical writing", "Build in public"] },
  { title: "DEV Community writing archive", organization: "DEV Community", period: "Since 2020", category: "Technical writing profile", description: "An archive of early programming and machine-learning write-ups, including an image-classifier tutorial built around Python, fastai and Google Colab.", href: "https://dev.to/pulkitsinghdev", linkLabel: "Visit DEV profile", tags: ["Python", "Machine learning", "Developer education"] },
]

const DEFAULT_RECOGNITION: MgnRecord[] = [
  { title: "Youngest Event Ambassador", organization: "DeepLearning.AI", period: "2021", category: "Ambassador recognition", description: "Recognised in my early profile and résumé as a young event ambassador for DeepLearning.AI learning events.", tags: ["DeepLearning.AI", "AI education"] },
  { title: "Top 10 Campus Ambassador", organization: "Developer Student Clubs · Week of Wonders", period: "2021", category: "Community recognition", description: "Listed in my earlier portfolio as one of the top ten campus ambassadors for the national Developer Student Clubs Week of Wonders initiative.", tags: ["Google Developers", "Community"] },
  { title: "Google Crowdsource Top Contributor", organization: "Google Crowdsource", period: "Early community years", category: "Community contribution", description: "Recognised in my earlier portfolio as a top contributor to Google Crowdsource.", tags: ["Google", "Community contribution"] },
  { title: "Open-source contributor recognition", organization: "Historical public contributor ranking", period: "Early community years", category: "Open-source recognition", description: "Previously listed among India’s active open-source contributors in a public ranking. Kept as a historical recognition rather than a current activity metric.", tags: ["Open source", "Community contribution"] },
  { title: "LiFT Scholarship — Teens-in-Training", organization: "The Linux Foundation", period: "2021", category: "Scholarship", description: "Selected as a recipient of the Linux Foundation LiFT scholarship in the Teens-in-Training category.", tags: ["Linux Foundation", "Open source"] },
  { title: "Best Space App powered by Space Force", organization: "Peace Out Hacks · Major League Hacking", period: "Sep 2021", category: "Hackathon award", description: "Recognition awarded to the Peace in Space team at Peace Out Hacks.", href: "https://x.com/MLHacks/status/1439695866500194314", linkLabel: "Award announcement", tags: ["MLH", "Peace in Space"] },
  { title: "Second Place — Hack the Space", organization: "Hack the Space Hackathon", period: "Apr 2021", category: "Hackathon result", description: "The Voice Based Pacman team secured second place in the Hack the Space hackathon.", href: "https://devfolio.co/submissions/voice-based-pacman-db80", linkLabel: "Project submission", tags: ["Hackathon", "Accessibility"] },
  { title: "Azure Hero", organization: "Microsoft Azure", period: "2021", category: "Community recognition", description: "Listed as an Azure Hero in the 2021 profile and résumé archive.", tags: ["Azure", "Community"] },
  { title: "Postman API Student Expert", organization: "Postman", period: "2021", category: "Program recognition", description: "Recognised as a Postman API Student Expert in the 2021 résumé archive.", tags: ["APIs", "Postman"] },
  { title: "Education Outreach Scholarship", organization: "GirlScript", period: "2021", category: "Scholarship", description: "Recipient of the GirlScript Education Outreach Program scholarship.", tags: ["GirlScript", "Education"] },
]

const DEFAULTS = {
  name: "Pulkit Singh",
  role: "Open Source & Community Builder · Speaker · Technical Writer",
  year: "2026",
  location: "India",
  title: "PULKIT",
  docLabel: "EARTH-928 / FIELD ARCHIVE",
  portrait: "",
  traits: ["open source", "community", "builder", "speaker", "writer", "mentor"],
  greeting: "Hey, I'm Pulkit.",
  bio: "For six years, I’ve been part of the developer ecosystem — building software, contributing to open source, writing technical articles, speaking at developer events, mentoring hackathon teams and organising communities. I founded Programmers Universal Group, which grew to *800+ members*, mentored 100+ people and contributed across 50+ community and hackathon spaces. I’ve worked with or around CNCF, Mozilla, TensorFlow, Major League Hacking and DeepLearning.AI; written for freeCodeCamp and KubeSphere; and spoken at React India and C# Corner. Along the way, I’ve built projects across web development, cloud-native tools and applied AI. The through-line is simple: *build useful things, share what I learn, and help more people get involved*.",
  educationIntro: "An academic path alongside years of building, writing and contributing across the developer ecosystem.",
  education: [
    { title: "B.Tech · Computer Science & Engineering", place: "SRM University-AP", period: "2026 — 2030", circled: true },
    { title: "School education", place: "Maharashtra HSC · CBSE", period: "Class X — XII" },
  ] as MgnEducation[],
  educationHighlights: [] as MgnAcademicHighlight[],
  cvUrl: null as string | null,
  cvNote: "curriculum vitae",
  languages: [] as MgnLanguage[],
  tools: [
    { name: "Git & GitHub", mark: "GH", bg: "#111827", fg: "#e8eef6", note: "version control, collaboration and open-source workflows" },
    { name: "Linux", mark: "TUX", bg: "#1b2636", fg: "#f5c451", note: "developer environments and command-line workflows" },
    { name: "Python", mark: "Py", bg: "#102c49", fg: "#ffd65a", note: "scripting, experiments and computer vision" },
    { name: "JavaScript", mark: "JS", bg: "#332c10", fg: "#f7df1e", note: "interactive web projects and browser APIs" },
    { name: "React", mark: "R", bg: "#102b38", fg: "#61dafb", note: "interactive web experiences" },
    { name: "Kubernetes", mark: "K8s", bg: "#10285b", fg: "#83b7ff", note: "cloud-native ecosystems and technical writing" },
    { name: "Docker", mark: "D", bg: "#10283d", fg: "#5db8ff", note: "containers and deployment workflows" },
    { name: "AWS", mark: "AWS", bg: "#2b2112", fg: "#ffb84d", note: "cloud services and project deployments" },
    { name: "MediaPipe", mark: "MP", bg: "#17243a", fg: "#b5d2ff", note: "browser-based human perception experiments" },
    { name: "Figma", mark: "figma", bg: "#1e1e1e", fg: "#ffffff", note: "interface design and project prototyping" },
    { name: "Postman", mark: "P", bg: "#3b1c12", fg: "#ff6c37", note: "API exploration and testing" },
    { name: "Azure", mark: "AZ", bg: "#122c46", fg: "#55b7ff", note: "cloud and developer ecosystem experience" },
  ] as MgnTool[],
  toolNote: "A working inventory drawn from my CVs, projects, articles and community work — not a claim of equal depth across every tool.",
  skillsIntro: "A broader inventory of technologies and platforms documented across my CVs, repositories, articles and event work. It records hands-on use or exposure across different chapters — not identical proficiency in every item.",
  skills: [
    "C / C++", "Python", "JavaScript", "HTML5 & CSS3", "PHP", "React", "React Native", "Node.js", "Vue.js", "VuePress", "Gridsome", "Django", "Bootstrap", "Tailwind CSS", "C++ STL", "Python libraries", "NumPy", "fastai", "MediaPipe", "OpenCV", "Git", "GitHub", "GitHub Actions", "GitHub Pages", "Linux", "VS Code", "Postman", "Jupyter Notebook", "Google Colab", "Figma", "Dialogflow", "Actions on Google", "Alan AI", "Speechly API", "Docker", "Kubernetes", "containerd", "CRI-O", "AWS", "AWS SAM", "Google Cloud", "Microsoft Azure", "MongoDB", "MySQL", "Firebase", "Amazon S3", "AWS Lambda", "EventBridge", "DynamoDB", "Amazon Bedrock", "CloudFront", "Shell scripting", "Linode",
  ],
  books: [
    { title: "OPEN SOURCE", color: "#1769aa" },
    { title: "CLOUD NATIVE", color: "#0a1a30" },
    { title: "AI / ML", color: "#f0183c" },
    { title: "WEB ENGINEERING", color: "#1d4774" },
    { title: "COMMUNITIES", color: "#142b46" },
  ],
  booksNote: "ecosystems I've worked across",
  projectsNote: "Six selected projects spanning coastal technology, environmental data, computer vision, accessibility and hackathon builds. Each project file links to its live experience, source repository or original submission where available. Actual supplied project images are used where available; other visual panels are explicitly labelled as illustrations rather than screenshots. Team projects are attributed, and individual contribution claims remain conservative where the public record does not specify them.",
  experience: DEFAULT_TIMELINE,
  talks: DEFAULT_TALKS,
  writing: DEFAULT_WRITING,
  recognition: DEFAULT_RECOGNITION,
  facts: [
    { label: "COMBAT SPORTS", text: "Boxing, MMA and martial-arts training" },
    { label: "STRENGTH & FITNESS", text: "Gym sessions, strength training and staying athletic" },
    { label: "MULTI-SPORT", text: "Badminton, multi-sport days and trying new games" },
    { label: "GAMING", text: "Competitive sessions, game experiments and the occasional deep dive" },
    { label: "ART & VISUALS", text: "Art, sketching and visual experimentation" },
    { label: "MUSIC", text: "Film scores, soundtracks and a permanently active playlist" },
    { label: "OUTSIDE", text: "Outdoor activities, movement and exploring new places" },
  ] as MgnFact[],
  factsNote: "off the keyboard / outside the terminal",
  thanks: "Let's build something.",
  email: "pulkitsinghid.official@gmail.com",
  links: [
    { label: "GitHub", href: "https://github.com/pulkitsinghdev" },
    { label: "X", href: "https://x.com/itspulkitsingh" },
    { label: "LinkedIn", href: "https://in.linkedin.com/in/pulkitsinghdev" },
    { label: "Devpost", href: "https://devpost.com/PulkitSinghDev" },
    { label: "Devfolio", href: "https://devfolio.co/@pulkitsinghdev" },
    { label: "Dev.to", href: "https://dev.to/pulkitsinghdev" },
    { label: "Sessionize", href: "https://sessionize.com/pulkitsingh/" },
    { label: "Hashnode", href: "https://hashnode.com/@PulkitSingh" },
  ] as MgnLink[],
  letter: "I started finding my way around technology early — by building, writing, joining communities, helping organise events and learning from people generous enough to share what they knew.\n\nThe best parts of that journey were never just the titles. They were the people, the projects, the conversations, the late-night builds and the moments when someone found their first way into open source.\n\nI'm still building, still learning and still interested in what happens when curious people get together and make something real. If that sounds like your kind of work, say hello.",
  sections: ["cover", "hello", "education", "experience", "skills", "projects", "cases", "talks", "writing", "recognition", "facts", "thanks"] as MgnSection[],
}


const SECTION_LABEL: { [k: string]: string } = {
  cover: "cover",
  hello: "about",
  education: "education",
  experience: "experience",
  communities: "communities / open source",
  skills: "toolkit",
  projects: "selected projects",
  cases: "project files",
  talks: "talks & events",
  writing: "writing & media",
  recognition: "recognition",
  facts: "off the keyboard",
  thanks: "contact",
}
// #endregion content

/* ------------------------------------------------------------------ style */

const CSS = `
.mgn-root{position:relative;container-type:inline-size;isolation:isolate;overflow-x:clip;background:var(--mgn-night);color:var(--mgn-paper);font-family:var(--mgn-body);font-weight:300;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;color-scheme:dark}
.mgn-root *,.mgn-root *::before,.mgn-root *::after{box-sizing:border-box}
.mgn-root :where(img){max-width:none;display:block}
.mgn-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.mgn-root :where(a){color:inherit;text-decoration:none}
.mgn-root :focus-visible{outline:2px dashed var(--mgn-pen);outline-offset:4px;border-radius:6px}

.mgn-display{font-family:var(--mgn-display);font-weight:400;line-height:.92;letter-spacing:-.012em}
.mgn-hand{font-family:var(--mgn-hand);color:var(--mgn-pen);font-weight:500;line-height:1.02}
.mgn-p{font-size:clamp(13px,1.08cqi,16px);line-height:1.7;color:var(--fg)}
.mgn-muted{color:var(--muted)}
.mgn-h2{font-size:clamp(54px,8.6cqi,150px);margin:0;color:var(--fg)}

.mgn-sheet{position:relative;isolation:isolate;display:flex;flex-direction:column;justify-content:center;min-height:var(--mgn-h);padding:clamp(76px,8cqi,130px) clamp(18px,5.2cqi,92px) clamp(56px,6cqi,100px);color:var(--fg)}
.mgn-sheet[data-tone=paper]{--fg:var(--mgn-ink);--muted:color-mix(in oklab,var(--mgn-ink) 60%,var(--mgn-paper));--rule:color-mix(in oklab,var(--mgn-ink) 16%,var(--mgn-paper));background:var(--mgn-paper)}
.mgn-sheet[data-tone=night]{--fg:var(--mgn-paper);--muted:color-mix(in oklab,var(--mgn-paper) 62%,var(--mgn-night));--rule:color-mix(in oklab,var(--mgn-paper) 16%,var(--mgn-night));isolation:isolate}
.mgn-sheet>*{width:100%}
.mgn-sheet-bg{position:absolute;inset:0;z-index:-1;background:radial-gradient(ellipse at 84% 14%,color-mix(in oklab,var(--mgn-blue) 24%,transparent),transparent 44%),var(--mgn-night);pointer-events:none}
.mgn-grain{position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.5;mix-blend-mode:multiply;background-image:radial-gradient(color-mix(in oklab,var(--mgn-ink) 9%,transparent) .6px,transparent .7px);background-size:5px 5px}
.mgn-sheet[data-tone=night] .mgn-grain{mix-blend-mode:screen;background-image:radial-gradient(rgba(255,255,255,.05) .6px,transparent .7px)}

.mgn-mk{position:relative;display:inline-block;white-space:normal}
.mgn-mark{position:absolute;overflow:visible;pointer-events:none;fill:none;stroke:var(--mgn-pen);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.mgn-draw{stroke-dasharray:1;stroke-dashoffset:0}
.mgn-ink{fill:none;stroke:var(--mgn-pen);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;overflow:visible}
.mgn-write,.mgn-card-write{display:inline-block}
.mgn-note-swap{display:inline-block;animation:mgn-swap .45s cubic-bezier(.2,.8,.2,1)}
@keyframes mgn-swap{from{opacity:0;transform:translateY(8px) rotate(-1deg)}}

.mgn-split{display:inline}
.mgn-w{display:inline-block;white-space:nowrap}
.mgn-c{display:inline-block;overflow:hidden;padding:.06em .01em .12em;margin:-.06em -.01em -.12em}
.mgn-ci{display:inline-block;will-change:transform}

.mgn-hd{position:relative;display:inline-block}
.mgn-uline{display:block;width:min(70%,320px);height:auto;aspect-ratio:300/26;margin-top:.1em}
.mgn-uline path{fill:none;stroke:var(--mgn-pen);stroke-width:2.2;stroke-linecap:round}

/* chrome */
.mgn-top{position:sticky;top:0;height:0;z-index:50;mix-blend-mode:difference;pointer-events:none}
.mgn-bar{position:absolute;left:0;right:0;top:0;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding:16px clamp(18px,5.2cqi,92px) 14px;color:#fff;font-size:12px;letter-spacing:.06em;pointer-events:auto}
.mgn-bar-right{justify-self:end;display:flex;align-items:baseline;gap:12px}
.mgn-bar-btn{position:relative;padding:4px 12px;letter-spacing:.06em}
.mgn-bar-btn .mgn-mark{stroke:#fff;opacity:0;transition:opacity .25s}
.mgn-bar-btn:hover .mgn-mark,.mgn-bar-btn:focus-visible .mgn-mark{opacity:1}
.mgn-bar-sec{font-family:var(--mgn-hand);font-size:19px;letter-spacing:0;min-width:5ch;text-align:right}
.mgn-progress{position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--mgn-pen);transform-origin:0 50%;transform:scaleX(0);opacity:.9}
.mgn-hold{position:sticky;top:0;height:0;z-index:60}
.mgn-index{position:absolute;left:0;right:0;top:0;height:var(--mgn-h);background:var(--mgn-night);color:var(--mgn-paper);display:flex;flex-direction:column;justify-content:safe center;padding:70px clamp(18px,5.2cqi,92px) 40px;overflow:auto;clip-path:circle(0% at 50% 0%);visibility:hidden;transition:clip-path .7s cubic-bezier(.7,0,.2,1),visibility 0s .7s}
.mgn-index[data-open=true]{clip-path:circle(150% at 50% 0%);visibility:visible;transition:clip-path .8s cubic-bezier(.7,0,.2,1),visibility 0s}
.mgn-index ol{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-flow:column;grid-template-rows:repeat(var(--rows),auto);gap:clamp(4px,.8cqi,12px) clamp(24px,4cqi,64px)}
.mgn-index li button{display:flex;align-items:baseline;gap:clamp(12px,2cqi,30px);font-family:var(--mgn-display);font-size:clamp(30px,4.2cqi,68px);line-height:1.04;text-align:left;color:var(--mgn-paper)}
.mgn-index li button small{font-family:var(--mgn-hand);font-size:.38em;color:var(--mgn-pen);min-width:2.2ch}
.mgn-index li button .mgn-mk .mgn-draw{stroke-dashoffset:1;transition:stroke-dashoffset .55s cubic-bezier(.6,0,.2,1)}
.mgn-index li button:hover .mgn-draw,.mgn-index li button:focus-visible .mgn-draw{stroke-dashoffset:0}
.mgn-index-close{position:absolute;top:16px;right:clamp(18px,5.2cqi,92px);font-family:var(--mgn-hand);font-size:22px;color:var(--mgn-pen)}
.mgn-index-foot{margin-top:clamp(24px,4cqi,56px);font-size:12px;letter-spacing:.06em;color:color-mix(in oklab,var(--mgn-paper) 62%,var(--mgn-night))}

/* cover */
.mgn-cover{display:grid;place-items:center;overflow:hidden;padding-top:60px;touch-action:pan-y}
.mgn-cover:before{content:"";position:absolute;inset:-12%;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 18% 28%,rgba(240,24,60,.19),transparent 36%),radial-gradient(ellipse at 82% 62%,rgba(23,105,170,.28),transparent 38%),linear-gradient(115deg,transparent 42%,rgba(240,24,60,.055) 49%,transparent 56%);mix-blend-mode:screen}
.mgn-cover:after{content:"";position:absolute;inset:0;z-index:4;pointer-events:none;opacity:.12;background:repeating-linear-gradient(to bottom,rgba(232,238,246,.16) 0,rgba(232,238,246,.16) 1px,transparent 1px,transparent 5px);mask-image:linear-gradient(to bottom,transparent,black 12%,black 88%,transparent)}
.mgn-cover-in{z-index:1}
.mgn-canvas{position:absolute;inset:0;width:100%;height:100%;max-width:none;pointer-events:none;z-index:3}
.mgn-cover-in{position:relative;display:flex;flex-direction:column;align-items:center}
.mgn-title{display:flex;white-space:nowrap;font-size:clamp(78px,21.5cqi,370px);color:var(--fg);margin:0;position:relative;z-index:1}
.mgn-l{position:relative;display:inline-block;will-change:transform}
.mgn-lc{display:inline-block;overflow:hidden;padding:.08em .015em .16em;margin:-.08em -.015em -.16em}
.mgn-li{display:inline-block}
.mgn-orbit{position:absolute;left:50%;top:52%;width:0;height:0;pointer-events:none}
.mgn-orbit svg{position:absolute;overflow:visible;left:0;top:0}
.mgn-orbit-back{z-index:-1}
.mgn-star{position:absolute;left:0;top:0;width:0;height:0;z-index:2}
.mgn-star svg{position:absolute;left:-14px;top:-14px;width:28px;height:28px;overflow:visible}
.mgn-star path{fill:var(--mgn-pen);stroke:none}
.mgn-sig{position:absolute;right:-1%;top:-.55em;transform:rotate(-7deg);font-size:clamp(30px,4.4cqi,72px);white-space:nowrap;cursor:default;z-index:2}
.mgn-sig-arrow{position:absolute;right:calc(100% - .55em);top:.5em;width:2.3em;height:auto;aspect-ratio:150/110;stroke-width:2.1}
.mgn-pill-wrap{position:relative;margin-top:clamp(8px,1.2cqi,18px);align-self:flex-end;margin-right:6%}
.mgn-pill{position:relative;display:inline-block;padding:.32em 1.1em .36em;border:1.5px solid currentColor;border-radius:999px;font-size:clamp(12px,1.35cqi,19px);font-weight:400;letter-spacing:.02em;color:var(--fg)}
.mgn-cover-meta{position:absolute;left:clamp(18px,5.2cqi,92px);right:clamp(18px,5.2cqi,92px);bottom:clamp(20px,3cqi,40px);display:flex;justify-content:space-between;align-items:flex-end;gap:16px;font-size:12px;letter-spacing:.06em;color:var(--muted)}
.mgn-hint{display:flex;align-items:center;gap:6px;font-family:var(--mgn-hand);font-size:22px;letter-spacing:0;color:var(--mgn-pen)}
.mgn-hint svg{width:22px;height:40px;animation:mgn-bob 2.2s ease-in-out infinite}
@keyframes mgn-bob{0%,100%{transform:translateY(-3px)}50%{transform:translateY(5px)}}

/* hello */
.mgn-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,6cqi,110px);align-items:center;max-width:1500px;margin:0 auto}
.mgn-traits{position:relative;width:100%;max-width:560px;aspect-ratio:500/520;margin:0 auto}
.mgn-traits>svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.mgn-portrait{position:absolute;left:27%;top:17%;width:46%;height:66%}
.mgn-portrait-img{position:absolute;inset:0;overflow:hidden;border-radius:4px;background:var(--mgn-ink)}
.mgn-portrait-img img{width:100%;height:100%;max-width:none;object-fit:cover;filter:grayscale(1) contrast(1.05);transform:scale(1.04);transition:filter .7s ease,transform 1.2s cubic-bezier(.2,.7,.2,1)}
.mgn-portrait-img video{width:100%;height:100%;max-width:none;object-fit:cover;filter:contrast(1.08) saturate(1.15);transform:scale(1.04);transition:filter .7s ease,transform 1.2s cubic-bezier(.2,.7,.2,1)}
.mgn-portrait:hover .mgn-portrait-img img{filter:grayscale(0) contrast(1);transform:scale(1.09)}
.mgn-portrait:hover .mgn-portrait-img video{filter:contrast(1.12) saturate(1.25);transform:scale(1.09)}
.mgn-trait{position:absolute;transform:translate(-50%,-50%);font-size:clamp(17px,1.9cqi,27px);white-space:nowrap}
.mgn-hello-copy .mgn-h2{font-size:clamp(64px,10.5cqi,180px)}
.mgn-hello-copy .mgn-p{max-width:52ch;margin-top:clamp(18px,2.4cqi,34px);text-align:justify;hyphens:auto}

/* education */
.mgn-edu{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:clamp(32px,6cqi,110px);max-width:1500px;margin:0 auto;align-items:start}
.mgn-edu-intro{max-width:46ch;margin-top:clamp(14px,2cqi,28px)}
.mgn-edu-aside{max-width:34em;margin-top:clamp(20px,3cqi,42px);padding:clamp(18px,2.4cqi,32px);border:1px solid color-mix(in oklab,var(--mgn-blue) 48%,var(--mgn-night));border-left:3px solid var(--mgn-pen);border-radius:4px;background:color-mix(in oklab,var(--mgn-blue) 20%,var(--mgn-night));color:var(--mgn-paper)}
.mgn-edu-aside h3{font-family:var(--mgn-display);font-size:clamp(27px,3.2cqi,46px);font-weight:400;line-height:1;margin:0 0 12px}
.mgn-edu-aside p{margin:0;max-width:48ch}
.mgn-edu-list{list-style:none;padding:0;margin:clamp(26px,3.4cqi,52px) 0 0;display:grid;gap:clamp(16px,1.8cqi,26px)}
.mgn-edu-list li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:baseline}
.mgn-edu-list li::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--fg);transform:translateY(-3px)}
.mgn-edu-t{font-weight:500;font-size:clamp(14px,1.2cqi,18px)}
.mgn-edu-s{font-size:clamp(12px,.98cqi,14px);color:var(--muted);margin-top:3px}
.mgn-qr-wrap{position:relative;display:grid;grid-template-columns:auto 1fr;gap:clamp(16px,2.4cqi,36px);align-items:center}
.mgn-qr{position:relative;display:block;width:clamp(120px,13cqi,190px);padding:10px;background:#fff;border-radius:10px;box-shadow:0 18px 40px -22px rgba(0,0,0,.35);transform:rotate(-2deg);transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.mgn-qr:hover{transform:rotate(0deg) scale(1.06)}
.mgn-qr svg{display:block;width:100%;height:auto}
.mgn-qr-tag{position:absolute;left:8px;top:-22px;font-family:var(--mgn-hand);font-size:17px;color:var(--mgn-pen)}
.mgn-cvnote{position:relative;font-size:clamp(24px,2.6cqi,38px);max-width:7em}
.mgn-cvnote svg{display:block;width:clamp(60px,6cqi,90px);height:auto;aspect-ratio:90/60;margin:0 0 6px -6px}
.mgn-langs{margin-top:clamp(40px,5cqi,80px)}
.mgn-langs h3{font-family:var(--mgn-display);font-weight:400;font-size:clamp(30px,3.6cqi,56px);margin:0 0 clamp(14px,1.8cqi,24px);color:var(--fg)}
.mgn-lang{display:grid;grid-template-columns:6.5em 3.5em minmax(0,1fr);align-items:center;gap:14px;padding:10px 0;border-top:1px solid var(--rule);font-size:clamp(13px,1.05cqi,15px)}
.mgn-lang b{font-weight:500}
.mgn-lang svg{width:100%;height:16px;overflow:visible}

/* skills */
.mgn-skills{max-width:1500px;margin:0 auto}
.mgn-skills-top{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:clamp(32px,6cqi,110px);align-items:end}
.mgn-skills-top-full{grid-template-columns:minmax(0,1fr)}
.mgn-tools{position:relative;display:flex;flex-wrap:wrap;gap:clamp(10px,1.2cqi,16px);margin-top:clamp(26px,3cqi,44px);padding:14px 18px;width:max-content;max-width:100%}
.mgn-tool{position:relative;width:clamp(48px,4.6cqi,64px);aspect-ratio:1;border-radius:24%;display:grid;place-items:center;font-weight:600;font-size:clamp(16px,1.6cqi,22px);letter-spacing:-.02em;box-shadow:0 10px 22px -14px rgba(0,0,0,.6);transition:transform .45s cubic-bezier(.2,.9,.2,1.3);font-family:var(--mgn-body)}
.mgn-tool:hover,.mgn-tool:focus-visible,.mgn-tool[data-on=true]{transform:translateY(-8px) rotate(-6deg) scale(1.08)}
.mgn-tool-note{min-height:2.2em;margin-top:6px;font-size:clamp(20px,2cqi,28px);padding-left:18px}
.mgn-books{position:relative;justify-self:center;width:min(100%,360px)}
.mgn-books>svg{display:block;width:100%;height:auto;overflow:visible}
.mgn-books-note{position:absolute;right:-4%;top:-6%;font-size:clamp(20px,2.1cqi,30px);transform:rotate(6deg);text-align:right;width:7em}
.mgn-skills-low{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:clamp(32px,6cqi,110px);margin-top:clamp(40px,5cqi,80px);align-items:start}
.mgn-skill-list{list-style:none;margin:0;padding:0;columns:2;column-gap:clamp(20px,3cqi,48px)}
.mgn-skill-list li{position:relative;padding:7px 0 7px 18px;break-inside:avoid;font-size:clamp(13px,1.1cqi,16px);border-bottom:1px solid var(--rule);transition:color .3s,padding .3s}
.mgn-skill-list li::before{content:"";position:absolute;left:2px;top:50%;width:6px;height:6px;border-radius:50%;background:var(--fg);transform:translateY(-50%);transition:background .3s,transform .3s}
.mgn-skill-list li:hover{padding-left:24px;color:var(--mgn-blue)}
.mgn-skill-list li:hover::before{background:var(--mgn-pen);transform:translateY(-50%) scale(1.5)}
.mgn-more{display:flex;align-items:center;gap:14px;margin-top:clamp(26px,3cqi,40px);font-size:clamp(20px,2cqi,28px)}
.mgn-more svg{width:clamp(56px,5cqi,74px);height:auto;flex:none}

/* project dossier grid */
.mgn-deal{display:block;height:auto;min-height:var(--mgn-h);padding:0}
.mgn-deal-stage{position:relative;top:auto;min-height:var(--mgn-h);height:auto;display:flex;flex-direction:column;padding:clamp(84px,8cqi,130px) clamp(18px,5.2cqi,92px) clamp(56px,6cqi,90px);overflow:visible;max-width:1700px;margin:0 auto}
.mgn-deal-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:clamp(28px,4cqi,54px)}
.mgn-project-intro{max-width:62ch;margin-top:18px;color:var(--muted)}
.mgn-project-index,.mgn-record-stamp{font-size:clamp(18px,1.8cqi,26px);color:var(--mgn-pen);transform:rotate(-4deg);white-space:nowrap}
.mgn-project-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.mgn-project-tile{position:relative;display:flex;flex-direction:column;align-items:stretch;min-height:270px;padding:clamp(18px,2.1cqi,30px);text-align:left;border:1px solid rgba(232,238,246,.16);border-radius:5px;background:linear-gradient(145deg,rgba(23,105,170,.18),rgba(10,26,48,.72) 48%,rgba(7,21,37,.94));box-shadow:0 18px 55px -38px rgba(0,0,0,.9);overflow:hidden;transition:transform .35s ease,border-color .35s ease,background .35s ease}
.mgn-project-tile:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 0 46%,rgba(240,24,60,.12) 46.2%,transparent 47%),linear-gradient(rgba(232,238,246,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(232,238,246,.035) 1px,transparent 1px);background-size:auto,26px 26px,26px 26px;mask-image:linear-gradient(135deg,#000,transparent 85%)}
.mgn-project-tile:hover{transform:translateY(-7px);border-color:rgba(240,24,60,.7);background:linear-gradient(145deg,rgba(23,105,170,.28),rgba(10,26,48,.82) 48%,rgba(7,21,37,.98))}
.mgn-project-tile>*{position:relative}
.mgn-project-tile-media{display:block;height:clamp(118px,13vw,174px);margin:17px 0 0;overflow:hidden;border:1px solid rgba(126,183,238,.2);border-radius:3px;background:#050d19}
.mgn-project-tile-media img{display:block;width:100%;height:100%;max-width:none;object-fit:cover;transition:transform .55s cubic-bezier(.2,.7,.2,1)}
.mgn-project-tile-media.is-contain img{object-fit:contain;padding:8px;background:#050d19}
.mgn-project-tile:hover .mgn-project-tile-media img{transform:scale(1.025)}
.mgn-project-tile:has(.mgn-project-tile-media) .mgn-project-tile-title{margin-top:17px}
.mgn-project-tile-top,.mgn-project-tile-bottom{display:flex;justify-content:space-between;gap:12px;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.15em;color:var(--muted)}
.mgn-project-dot{width:7px;height:7px;border-radius:50%;background:var(--mgn-pen);box-shadow:0 0 14px var(--mgn-pen)}
.mgn-project-tile-title{font-family:var(--mgn-display);font-size:clamp(28px,3cqi,43px);line-height:1.02;margin-top:28px;color:var(--mgn-paper)}
.mgn-project-tile-kind{margin-top:9px;color:#7eb7ee;font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.mgn-project-tile-desc{margin-top:14px;color:rgba(232,238,246,.76);font-size:13px;line-height:1.5;max-width:38ch}
.mgn-project-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto;padding-top:20px}
.mgn-project-chips i{font-style:normal;border:1px solid rgba(232,238,246,.17);border-radius:2px;padding:4px 7px;font-size:10px;color:#c8d8e9}
.mgn-project-tile-bottom{margin-top:18px;padding-top:12px;border-top:1px solid rgba(232,238,246,.12);color:var(--mgn-pen)}

/* project case files */
.mgn-case{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:clamp(32px,6cqi,110px);align-items:center;max-width:1560px;margin:0 auto}
.mgn-case-wrap[data-flip=true] .mgn-case-copy{order:2}
.mgn-eyebrow{font-size:clamp(19px,1.9cqi,27px)}
.mgn-case-title{font-size:clamp(56px,8.2cqi,140px);margin:.12em 0 0;color:var(--fg)}
.mgn-case-title em{font-style:normal;color:var(--mgn-pen)}
.mgn-case-copy .mgn-p{max-width:58ch;margin-top:clamp(16px,2cqi,28px)}
.mgn-challenge{position:relative;margin-top:clamp(22px,2.6cqi,38px);display:grid;grid-template-columns:auto minmax(0,1fr);gap:18px;align-items:start;max-width:42em}
.mgn-challenge-l{font-size:clamp(20px,2cqi,28px);white-space:nowrap;padding:2px 8px;color:var(--mgn-pen)}
.mgn-challenge-t{font-size:clamp(13px,1.05cqi,15px);line-height:1.6;padding:9px 12px;border:1px solid rgba(240,24,60,.5);border-radius:4px;color:var(--fg);background:rgba(240,24,60,.045)}
.mgn-project-attribution{margin-top:15px;max-width:55ch;color:var(--muted);font-size:11px;line-height:1.55}
.mgn-project-attribution strong{color:var(--mgn-paper)}
.mgn-project-stack{display:flex;flex-wrap:wrap;gap:7px;margin-top:clamp(22px,2.4cqi,34px)}
.mgn-project-stack-label{width:100%;font:10px ui-monospace,monospace;letter-spacing:.16em;color:var(--mgn-pen);margin-bottom:3px}
.mgn-project-stack>span:not(.mgn-project-stack-label){font-size:11px;padding:6px 9px;border:1px solid rgba(126,183,238,.26);background:rgba(23,105,170,.13);color:#d8e9f8;border-radius:2px}
.mgn-project-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:clamp(22px,2.4cqi,34px)}
.mgn-project-links a,.mgn-record-link{display:inline-flex;align-items:center;gap:7px;padding:9px 13px;border:1px solid rgba(240,24,60,.72);border-radius:2px;color:var(--mgn-paper);font-size:11px;letter-spacing:.04em;transition:background .25s ease,transform .25s ease}
.mgn-project-links a:hover,.mgn-record-link:hover{background:rgba(240,24,60,.17);transform:translateY(-2px)}
.mgn-project-visual-wrap{position:relative;max-width:660px;width:100%;margin:0 auto}
.mgn-project-visual{position:relative;min-height:480px;aspect-ratio:1.08/1;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(126,183,238,.22);border-radius:5px;background:radial-gradient(ellipse at 52% 44%,rgba(23,105,170,.35),transparent 54%),linear-gradient(140deg,#0a1a30,#071525 68%,#100f1a);box-shadow:0 35px 100px -55px rgba(0,0,0,.95),inset 0 0 60px rgba(23,105,170,.08)}
.mgn-project-visual:before,.mgn-project-visual:after{content:"";position:absolute;inset:0;pointer-events:none}
.mgn-project-visual:before{background:linear-gradient(rgba(232,238,246,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(232,238,246,.04) 1px,transparent 1px);background-size:28px 28px;mask-image:radial-gradient(ellipse,#000,transparent 78%)}
.mgn-project-visual:after{background:linear-gradient(120deg,transparent 38%,rgba(240,24,60,.12) 38.2%,transparent 39%),linear-gradient(300deg,transparent 61%,rgba(23,105,170,.15) 61.2%,transparent 62%)}
.mgn-project-visual-hud,.mgn-project-visual-foot{position:absolute;left:22px;right:22px;display:flex;justify-content:space-between;gap:14px;font:10px ui-monospace,monospace;letter-spacing:.14em;color:#8fb8dd;z-index:4}
.mgn-project-visual-hud{top:20px}.mgn-project-visual-foot{bottom:20px;color:rgba(232,238,246,.42)}
.mgn-project-visual-orbit{position:absolute;width:70%;aspect-ratio:1;border:1px solid rgba(23,105,170,.32);border-radius:50%;transform:rotate(-28deg) scaleY(.55);box-shadow:0 0 36px rgba(23,105,170,.08)}
.mgn-project-orbit-a{border-top-color:var(--mgn-pen);border-bottom-color:transparent;animation:mgn-orbit 22s linear infinite}
.mgn-project-orbit-b{width:88%;border-color:rgba(240,24,60,.18);transform:rotate(46deg) scaleY(.42);animation:mgn-orbit 34s linear infinite reverse}
@keyframes mgn-orbit{to{rotate:360deg}}
.mgn-project-monogram{position:absolute;font-family:var(--mgn-display);font-size:clamp(100px,19cqi,230px);line-height:1;color:rgba(232,238,246,.045);letter-spacing:-.08em;transform:translateY(-8%);z-index:1}
.mgn-project-terminal{position:relative;z-index:3;width:min(78%,480px);border:1px solid rgba(232,238,246,.22);border-radius:5px;background:rgba(7,21,37,.83);backdrop-filter:blur(16px);box-shadow:0 24px 60px rgba(0,0,0,.42),0 0 35px rgba(23,105,170,.13);transform:rotate(-2deg)}
.mgn-project-terminal-bar{display:flex;align-items:center;gap:6px;padding:12px 14px;border-bottom:1px solid rgba(232,238,246,.12)}
.mgn-project-terminal-bar>span{width:7px;height:7px;border-radius:50%;background:#f0183c}.mgn-project-terminal-bar>span:nth-child(2){background:#1769aa}.mgn-project-terminal-bar>span:nth-child(3){background:#d1e7ff}
.mgn-project-terminal-bar b{margin-left:8px;font:9px ui-monospace,monospace;letter-spacing:.12em;color:#9db4c9;font-weight:400}
.mgn-project-terminal-body{padding:20px 15px 22px;display:grid;gap:15px}
.mgn-terminal-line{display:grid;grid-template-columns:22px minmax(0,1fr) 20px;gap:9px;align-items:center;font:9px ui-monospace,monospace;letter-spacing:.04em;color:rgba(232,238,246,.68)}
.mgn-terminal-line i{font-style:normal;color:var(--mgn-pen)}.mgn-terminal-line b{font-weight:400;color:#63b6ee;text-align:right}
.mgn-project-visual-note{position:absolute;right:-3%;bottom:4%;max-width:10em;font-size:25px;transform:rotate(5deg);color:var(--mgn-pen)}

/* record collections: experience, talks, writing and recognition */
.mgn-record-wrap{max-width:1500px;margin:0 auto}
.mgn-record-heading{position:relative;margin-bottom:clamp(34px,4.5cqi,64px)}
.mgn-record-intro{max-width:66ch;margin-top:20px;color:var(--muted)}
.mgn-record-stamp{position:absolute;right:0;bottom:12px}
.mgn-record-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.mgn-record-card{position:relative;display:flex;flex-direction:column;align-items:flex-start;min-height:245px;padding:clamp(18px,2.2cqi,30px);border:1px solid rgba(232,238,246,.14);border-radius:4px;background:linear-gradient(145deg,rgba(10,26,48,.8),rgba(7,21,37,.96));overflow:hidden;transition:transform .3s ease,border-color .3s ease}
.mgn-record-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:linear-gradient(var(--mgn-pen),var(--mgn-blue));opacity:.9}
.mgn-record-card:hover{transform:translateY(-4px);border-color:rgba(23,105,170,.55)}
.mgn-record-meta{display:flex;justify-content:space-between;gap:12px;width:100%;font:9px ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--mgn-pen)}
.mgn-record-meta span:last-child{color:#90a7bf;text-align:right}
.mgn-record-card h3{font-family:var(--mgn-display);font-weight:400;font-size:clamp(25px,3cqi,39px);line-height:1.06;margin:24px 0 7px;color:var(--mgn-paper)}
.mgn-record-org{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#7eb7ee}
.mgn-record-card p{font-size:13px;line-height:1.65;color:rgba(232,238,246,.72);max-width:62ch;margin:15px 0 0}
.mgn-record-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:18px}
.mgn-record-tags span{padding:4px 7px;border:1px solid rgba(232,238,246,.13);font-size:9px;color:#a9bfd4;border-radius:2px}
.mgn-record-link{margin-top:auto;margin-top:20px;color:#e8eef6;font-size:10px;padding:7px 10px}

/* A readable year-by-year story that keeps the full record one click away. */
.mgn-timeline-years{position:relative;display:grid;gap:clamp(24px,4cqi,52px);max-width:1180px;padding-left:clamp(54px,7cqi,96px)}
.mgn-timeline-years::before{content:"";position:absolute;left:clamp(17px,2.2cqi,30px);top:12px;bottom:12px;width:1px;background:linear-gradient(180deg,#f0183c,rgba(23,105,170,.8) 52%,rgba(126,183,238,.22));box-shadow:0 0 14px rgba(23,105,170,.2)}
.mgn-timeline-year{position:relative;display:grid;grid-template-columns:minmax(90px,.22fr) minmax(0,1fr);gap:clamp(18px,3cqi,42px);align-items:start}
.mgn-timeline-year-label{position:relative;margin:2px 0 0;color:var(--mgn-pen);font:clamp(24px,3.2cqi,42px)/1 var(--mgn-display)}
.mgn-timeline-year-label::before{content:"";position:absolute;left:calc(-1 * clamp(54px,7cqi,96px) + clamp(11px,1.45cqi,20px));top:8px;width:11px;height:11px;border:2px solid #e8eef6;border-radius:50%;background:#f0183c;box-shadow:0 0 0 4px rgba(23,105,170,.24)}
.mgn-timeline-year-records{display:grid;gap:8px}
.mgn-timeline-entry{border:1px solid rgba(126,183,238,.18);border-radius:3px;background:linear-gradient(110deg,rgba(10,26,48,.78),rgba(7,21,37,.62));transition:border-color .2s ease,background .2s ease}
.mgn-timeline-entry:hover,.mgn-timeline-entry[open]{border-color:rgba(23,105,170,.55);background:rgba(10,26,48,.84)}
.mgn-timeline-entry summary{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 18px;cursor:pointer;list-style:none}
.mgn-timeline-entry summary::-webkit-details-marker{display:none}
.mgn-timeline-entry summary:focus-visible{outline:2px solid #1769aa;outline-offset:3px}
.mgn-timeline-entry-copy{display:grid;gap:4px;min-width:0}
.mgn-timeline-entry-period,.mgn-timeline-entry-category{font:9px ui-monospace,monospace;letter-spacing:.13em;text-transform:uppercase;color:var(--mgn-pen)}
.mgn-timeline-entry-title{font:clamp(19px,2.3cqi,27px)/1.12 var(--mgn-display);color:var(--mgn-paper)}
.mgn-timeline-entry-org{font:10px/1.5 var(--mgn-body);letter-spacing:.06em;text-transform:uppercase;color:#7eb7ee}
.mgn-timeline-entry-toggle{display:grid;place-items:center;flex:none;width:26px;height:26px;border:1px solid rgba(232,238,246,.2);border-radius:50%;color:#e8eef6;font-size:18px;transition:transform .2s ease,border-color .2s ease}
.mgn-timeline-entry[open] .mgn-timeline-entry-toggle{transform:rotate(45deg);border-color:rgba(240,24,60,.65)}
.mgn-timeline-entry-detail{padding:0 18px 18px 18px}
.mgn-timeline-entry-detail p{max-width:68ch;margin:5px 0 0;color:rgba(232,238,246,.72);font-size:12px;line-height:1.65}
.mgn-timeline-entry-detail .mgn-record-tags{margin-top:12px}
.mgn-timeline-entry-detail .mgn-record-link{display:inline-flex;margin-top:12px}

/* facts */
.mgn-facts{max-width:1400px;margin:0 auto}
.mgn-facts-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px}
.mgn-facts-note{font-size:clamp(21px,2.2cqi,32px);max-width:10em;transform:rotate(-4deg);margin-bottom:1.2em}
.mgn-facts-note svg{display:block;width:70px;height:50px;margin:6px 0 0 40%}
.mgn-fact-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(30px,5cqi,80px) clamp(20px,4cqi,64px);margin-top:clamp(40px,5cqi,80px)}
.mgn-fact{display:flex;flex-direction:column;align-items:flex-start;gap:10px;text-align:left}
.mgn-fact:nth-child(3n+2){transform:translateY(clamp(20px,3cqi,50px))}
.mgn-fact:nth-child(3n){transform:translateY(clamp(-10px,-1cqi,-4px))}
.mgn-fact svg{width:clamp(64px,7cqi,104px);height:auto;aspect-ratio:1;transform-origin:50% 80%}
.mgn-fact:hover svg,.mgn-fact:focus-visible svg{animation:mgn-wiggle .7s ease-in-out}
@keyframes mgn-wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-9deg)}55%{transform:rotate(7deg)}80%{transform:rotate(-3deg)}}
.mgn-fact-t{font-size:clamp(21px,2.2cqi,32px);max-width:11em}
.mgn-fact:nth-child(odd) .mgn-fact-t{transform:rotate(-2deg)}
.mgn-fact:nth-child(even) .mgn-fact-t{transform:rotate(1.5deg)}

/* thanks */
.mgn-thanks{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,6cqi,110px);align-items:center;max-width:1500px;margin:0 auto;min-height:calc(var(--mgn-h) - 220px)}
.mgn-avatar{position:relative;width:clamp(96px,10cqi,150px);aspect-ratio:1}
.mgn-avatar img{width:100%;height:100%;max-width:none;object-fit:cover;border-radius:50%;filter:grayscale(1)}
.mgn-thanks-title{font-size:clamp(58px,7.8cqi,140px);margin:clamp(18px,2.4cqi,34px) 0 0;color:var(--fg)}
.mgn-touch{margin-top:clamp(18px,2.2cqi,30px);display:grid;gap:6px;font-size:clamp(13px,1.08cqi,16px)}
.mgn-touch b{font-weight:600}
.mgn-email{position:relative;justify-self:start;font-weight:400;font-size:clamp(14px,1.25cqi,18px);text-align:left;color:var(--fg)}
.mgn-email .mgn-draw{stroke-dashoffset:1;transition:stroke-dashoffset .5s cubic-bezier(.6,0,.2,1)}
.mgn-email:hover .mgn-draw,.mgn-email:focus-visible .mgn-draw{stroke-dashoffset:0}
.mgn-copied{position:absolute;left:100%;top:-.9em;margin-left:10px;font-family:var(--mgn-hand);font-size:20px;color:var(--mgn-pen);white-space:nowrap;opacity:0;transform:translateY(6px) rotate(-6deg);transition:opacity .3s,transform .3s}
.mgn-copied[data-on=true]{opacity:1;transform:translateY(0) rotate(-6deg)}
.mgn-links{display:flex;flex-wrap:wrap;gap:6px 22px;margin-top:clamp(18px,2.4cqi,32px)}
.mgn-links a{position:relative;font-family:var(--mgn-hand);font-size:clamp(20px,2cqi,28px);color:var(--mgn-pen)}
.mgn-links a .mgn-draw{stroke-dashoffset:1;transition:stroke-dashoffset .45s cubic-bezier(.6,0,.2,1)}
.mgn-links a:hover .mgn-draw,.mgn-links a:focus-visible .mgn-draw{stroke-dashoffset:0}
.mgn-letter{font-size:clamp(21px,2.05cqi,30px);line-height:1.22;max-width:21em;justify-self:end}
.mgn-letter p{margin:0 0 .8em}
.mgn-signature{position:relative;display:inline-block;font-size:1.5em;margin-top:.2em;transform:rotate(-4deg)}
.mgn-foot{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:16px;padding-top:clamp(36px,5cqi,70px);margin-top:clamp(36px,5cqi,70px);border-top:1px solid var(--rule);font-size:12px;letter-spacing:.06em;color:var(--muted);max-width:1500px;margin-left:auto;margin-right:auto}
.mgn-foot button{font-family:var(--mgn-hand);font-size:21px;letter-spacing:0;color:var(--mgn-pen);display:flex;align-items:center;gap:6px}

@container (max-width:860px){
  .mgn-two,.mgn-edu,.mgn-skills-top,.mgn-skills-low,.mgn-case,.mgn-thanks{grid-template-columns:minmax(0,1fr)}
  .mgn-project-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .mgn-record-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .mgn-record-stamp{position:static;display:block;margin-top:18px}
  .mgn-project-visual{min-height:380px}
  .mgn-case-wrap[data-flip=true] .mgn-case-copy{order:0}
  .mgn-books{justify-self:start;width:min(80%,320px)}
  .mgn-letter{justify-self:start}
  .mgn-hello-copy .mgn-p{text-align:left;hyphens:manual}
  .mgn-sig{right:2%}
  .mgn-row{flex-wrap:wrap;align-content:center;gap:34px 18px}
  .mgn-card{width:clamp(76px,25cqi,170px)}
  .mgn-deal-head,.mgn-facts-head{flex-direction:column;align-items:flex-start}
  .mgn-facts-head .mgn-hd{order:-1}
  .mgn-deal-note{text-align:left}
  .mgn-fact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .mgn-fact:nth-child(n){transform:none}
  .mgn-fact:nth-child(even){transform:translateY(26px)}
}
@container (max-width:520px){
  .mgn-bar{grid-template-columns:auto 1fr;font-size:11px}
  .mgn-bar>:first-child{display:none}
  .mgn-bar>:nth-child(2){justify-self:start}
  .mgn-bar-name{display:none}
  .mgn-skill-list{columns:1}
  .mgn-index ol{grid-template-columns:minmax(0,1fr);grid-auto-flow:row;grid-template-rows:none}
  .mgn-card{width:23cqi}
  .mgn-row{gap:22px 12px}
  .mgn-project-grid,.mgn-record-grid{grid-template-columns:minmax(0,1fr)}
  .mgn-project-index{display:none}
  .mgn-project-visual{min-height:310px}
  .mgn-project-case-title{font-size:clamp(46px,12cqi,84px)}
  .mgn-deal-stage{padding-top:64px}
  .mgn-card-tag{display:none}
  .mgn-lang{grid-template-columns:5.5em 3em minmax(0,1fr)}
  .mgn-qr-wrap{grid-template-columns:minmax(0,1fr)}
}
@media (prefers-reduced-motion:reduce){
  .mgn-deal{height:auto}
  .mgn-deal-stage{position:relative;height:auto;min-height:var(--mgn-h)}
  .mgn-hint svg,.mgn-fact:hover svg,.mgn-note-swap{animation:none}
  .mgn-index,.mgn-index[data-open=true]{transition:none}
  .mgn-portrait-img img,.mgn-tool,.mgn-card>button,.mgn-qr{transition:none}
}

/* Spider-Verse / Miguel O'Hara visual language */
.mgn-root{background:var(--mgn-night);color:var(--mgn-paper);--mgn-cyan:#49c7dc;position:relative}
.mgn-root:before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 12% 18%,rgba(23,105,170,.20),transparent 42%),radial-gradient(ellipse at 88% 70%,rgba(240,24,60,.12),transparent 42%),linear-gradient(135deg,rgba(7,21,37,.96),rgba(10,26,48,.98))}
.mgn-sheet[data-tone=night]{background:transparent}
.mgn-sheet-bg{background:radial-gradient(ellipse at 84% 14%,rgba(23,105,170,.23),transparent 43%),radial-gradient(ellipse at 14% 82%,rgba(240,24,60,.11),transparent 40%),linear-gradient(145deg,#071525,#0a1a30 58%,#071525)}
.mgn-grain{opacity:.32;background-image:radial-gradient(rgba(126,183,238,.10) .55px,transparent .7px);background-size:4px 4px;mix-blend-mode:screen}
.mgn-bar{font-family:ui-monospace,monospace;text-transform:uppercase;letter-spacing:.12em}
.mgn-bar-btn{color:#e8eef6}
.mgn-bar-btn:hover{color:#fff}
.mgn-progress{background:linear-gradient(90deg,#1769aa,#f0183c)}
.mgn-hd .mgn-morph,.mgn-mark,.mgn-ink{stroke:var(--mgn-pen)}
.mgn-hand{color:#ff526c}
.mgn-project-index,.mgn-record-stamp{color:#ff526c}
.mgn-portrait-img video{filter:contrast(1.12) saturate(1.1);box-shadow:0 0 0 1px rgba(23,105,170,.48),0 0 45px rgba(23,105,170,.16)}
.mgn-portrait:after{content:"EARTH-928 / SUBJECT: PULKIT";position:absolute;left:-8%;bottom:-24px;font:9px ui-monospace,monospace;letter-spacing:.12em;color:#80b9e7;white-space:nowrap}
.mgn-case-wrap .mgn-sheet-bg{background:radial-gradient(ellipse at 82% 40%,rgba(23,105,170,.24),transparent 50%),radial-gradient(ellipse at 12% 84%,rgba(240,24,60,.14),transparent 36%),#071525}
.mgn-record-section .mgn-sheet-bg{background:radial-gradient(ellipse at 90% 10%,rgba(23,105,170,.2),transparent 45%),#071525}
.mgn-root ::selection{background:rgba(240,24,60,.55);color:#fff}
.mgn-root{--mgn-cyan:#63c8e8}
.mgn-cover:after{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;opacity:.17;background:linear-gradient(90deg,transparent 0 49.8%,rgba(99,200,232,.18) 50%,transparent 50.2%),repeating-linear-gradient(0deg,transparent 0 5px,rgba(232,238,246,.035) 6px,transparent 7px);mask-image:linear-gradient(180deg,#000,transparent 75%)}
.mgn-title{text-shadow:0 0 34px rgba(23,105,170,.12)}
.mgn-l:hover{filter:drop-shadow(2px 0 rgba(240,24,60,.75)) drop-shadow(-2px 0 rgba(99,200,232,.55))}
.mgn-root .mgn-sheet-bg{background-image:radial-gradient(ellipse at 78% 20%,rgba(23,105,170,.22),transparent 46%),radial-gradient(ellipse at 14% 78%,rgba(240,24,60,.12),transparent 42%),linear-gradient(145deg,#071525,#0a1a30 58%,#071525)}
@media(max-width:700px){.mgn-project-visual-note{right:0;font-size:20px}.mgn-project-tile{min-height:240px}.mgn-record-stamp{white-space:normal}}
@media(max-width:700px){.mgn-timeline-years{padding-left:36px}.mgn-timeline-years::before{left:8px}.mgn-timeline-year{grid-template-columns:minmax(0,1fr);gap:10px}.mgn-timeline-year-label::before{left:-33px;top:6px;width:9px;height:9px}.mgn-timeline-entry summary{padding:13px}.mgn-timeline-entry-detail{padding:0 13px 14px}.mgn-timeline-entry-title{font-size:21px}}

`


const REFINEMENT_CSS = `
/* One continuous Earth-928 canvas across every chapter. */
.mgn-root {
  background-color: #071525 !important;
  background-image:
    radial-gradient(ellipse at 12% 3%, rgba(240,24,60,.095), transparent 31%),
    radial-gradient(ellipse at 88% 13%, rgba(23,105,170,.23), transparent 38%),
    linear-gradient(145deg, #071525 0%, #0a1a30 52%, #071525 100%) !important;
  background-attachment: fixed !important;
}
.mgn-root .mgn-sheet,
.mgn-root .mgn-sheet[data-tone="paper"],
.mgn-root .mgn-sheet[data-tone="night"] {
  --fg: #e8eef6 !important;
  --muted: rgba(200,215,231,.68) !important;
  --rule: rgba(200,215,231,.16) !important;
  color: #e8eef6 !important;
  background: transparent !important;
}
.mgn-root .mgn-sheet-bg { display: none !important; }

/* A single connected timeline for paid work, community roles and programmes. */
.mgn-record-grid.mgn-record-timeline {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  max-width: 1180px;
  padding-left: 54px;
}
.mgn-record-grid.mgn-record-timeline::before {
  content: "";
  position: absolute;
  left: 15px;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: linear-gradient(180deg, #f0183c 0%, rgba(23,105,170,.9) 48%, rgba(126,183,238,.25) 100%);
  box-shadow: 0 0 16px rgba(23,105,170,.28);
}
.mgn-record-timeline .mgn-record-card {
  min-height: 0;
  margin: 0;
  padding: clamp(20px, 2.3cqi, 30px);
  border-color: rgba(126,183,238,.2);
  border-radius: 5px;
  background: linear-gradient(110deg, rgba(10,26,48,.88), rgba(7,21,37,.76));
  box-shadow: 0 18px 48px -40px rgba(0,0,0,.9), inset 0 1px 0 rgba(232,238,246,.045);
}
.mgn-record-timeline .mgn-record-card::before {
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 2px;
  border-radius: 2px;
}
.mgn-timeline-dot {
  position: absolute;
  left: -46px;
  top: 28px;
  z-index: 2;
  width: 13px;
  height: 13px;
  border: 2px solid #e8eef6;
  border-radius: 50%;
  background: #f0183c;
  box-shadow: 0 0 0 4px rgba(23,105,170,.28), 0 0 20px rgba(240,24,60,.42);
}
.mgn-record-timeline .mgn-record-card h3 { margin-top: 15px; }
.mgn-record-timeline .mgn-record-card:hover {
  transform: translateX(6px);
  border-color: rgba(240,24,60,.55);
}
.mgn-record-timeline .mgn-record-link { margin-top: 18px; }

/* Keep reveal motion crisp: no blur filters on text, cards or full sections. */
.mgn-root .mgn-record-card,
.mgn-root .mgn-project-tile { backface-visibility: hidden; }
@media (max-width: 700px) {
  .mgn-record-grid.mgn-record-timeline { padding-left: 38px; gap: 12px; }
  .mgn-record-grid.mgn-record-timeline::before { left: 10px; }
  .mgn-timeline-dot { left: -34px; }
  .mgn-record-timeline .mgn-record-card { padding: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .mgn-record-timeline .mgn-record-card,
  .mgn-project-tile { transition: none !important; }
}
`


const FINAL_POLISH_CSS = `
/* One continuous Earth-928 environment; section backgrounds never swap. */
.mgn-root .mgn-top .mgn-bar{transition:background .28s ease,border-color .28s ease,box-shadow .28s ease,backdrop-filter .28s ease}
.mgn-root .mgn-top:not([data-scrolled="true"]) .mgn-bar{border-bottom-color:transparent;background:transparent!important;box-shadow:none;backdrop-filter:none}
.mgn-root .mgn-top[data-scrolled="true"] .mgn-bar{border-bottom-color:rgba(126,183,238,.18);background:rgba(7,21,37,.94)!important;box-shadow:0 7px 24px rgba(0,0,0,.18);backdrop-filter:blur(14px) saturate(120%)}
.mgn-root .mgn-cover:before{display:none}
.mgn-spider-particles{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none;opacity:.84;mask-image:linear-gradient(90deg,transparent,black 18%,black 88%,transparent)}
.mgn-spider-particles canvas{display:block;width:100%;height:100%}
.mgn-experience-section,.mgn-writing-section{justify-content:flex-start;padding-top:clamp(86px,9cqi,140px)}
.mgn-experience-wrap,.mgn-writing-archive{width:100%;max-width:1400px;margin:0 auto}
.mgn-scroll-archive{position:relative;display:grid;gap:clamp(18px,2.5cqi,30px);width:min(100%,1120px);margin:clamp(28px,4cqi,52px) auto 0;perspective:1200px}
.mgn-scroll-card{position:relative;z-index:0;isolation:isolate;display:flex;flex-direction:column;justify-content:center;min-height:clamp(400px,58svh,620px);padding:clamp(28px,4.5cqi,62px);overflow:hidden;border:1px solid rgba(126,183,238,.22);border-radius:3px;background:linear-gradient(140deg,rgba(10,26,48,.97),rgba(7,21,37,.98));box-shadow:0 26px 72px -54px rgba(0,0,0,.92);transform-style:preserve-3d;backface-visibility:hidden;opacity:.42;transform:translate3d(0,38px,-86px) scale(.975);transition:transform .62s cubic-bezier(.22,.61,.36,1),opacity .62s ease,border-color .35s ease,box-shadow .35s ease;will-change:transform,opacity}
.mgn-scroll-card[data-phase="past"]{z-index:0;opacity:.25;transform:translate3d(0,-30px,-72px) scale(.97)}
.mgn-scroll-card[data-phase="active"]{z-index:2;opacity:1;transform:translate3d(0,0,0) scale(1)}
.mgn-scroll-card[data-phase="next"]{z-index:1;opacity:.42;transform:translate3d(0,38px,-86px) scale(.975)}
.mgn-scroll-card:before{content:"";position:absolute;inset:0 0 auto;height:1px;background:linear-gradient(90deg,rgba(240,24,60,.8),rgba(99,200,232,.5),transparent 76%);opacity:.64}
.mgn-scroll-card[data-active="true"]{border-color:rgba(99,200,232,.5);box-shadow:0 34px 90px -58px rgba(23,105,170,.65),inset 0 1px 0 rgba(232,238,246,.07);opacity:1}
.mgn-scroll-card-head{display:flex;justify-content:space-between;align-items:center;gap:18px;color:#ff526c;font:10px ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase}
.mgn-scroll-card-head span:last-child{color:#9bc7ee;text-align:right}
.mgn-scroll-card h3{max-width:22ch;margin:clamp(30px,5cqi,58px) 0 10px;color:#e8eef6;font:clamp(36px,5.2cqi,68px)/1.04 var(--mgn-display);text-wrap:balance}
.mgn-scroll-card-org{color:#7eb7ee;font:12px/1.55 var(--mgn-body);letter-spacing:.08em;text-transform:uppercase}
.mgn-scroll-card p{max-width:68ch;margin:clamp(19px,2.5cqi,30px) 0 0;color:rgba(232,238,246,.78);font:15px/1.8 var(--mgn-body)}
.mgn-scroll-card .mgn-record-tags{margin-top:22px}
.mgn-scroll-card-bottom{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:clamp(25px,3cqi,38px)}
.mgn-scroll-card-link{display:inline-flex;align-items:center;gap:9px;padding:10px 13px;border:1px solid rgba(240,24,60,.5);color:#e8eef6;font:10px ui-monospace,monospace;letter-spacing:.05em;transition:background .25s ease,border-color .25s ease}
.mgn-scroll-card-link:hover{background:rgba(240,24,60,.14);border-color:#f0183c}
.mgn-scroll-card-number{color:#8ca7c0;font:10px ui-monospace,monospace;letter-spacing:.14em;white-space:nowrap}
.mgn-scroll-card-number b{color:#ff526c;font-size:13px;font-weight:500}
.mgn-writing-archive .mgn-scroll-card{min-height:clamp(380px,54svh,580px)}
.mgn-foot-credit{display:inline-flex;align-items:center;gap:5px;letter-spacing:.02em}
.mgn-foot-credit a{color:#e8eef6;text-decoration:underline;text-decoration-color:rgba(99,200,232,.55);text-underline-offset:4px;transition:color .2s ease,text-decoration-color .2s ease}
.mgn-foot-credit a:hover{color:#63c8e8;text-decoration-color:#f0183c}
@media(max-width:700px){.mgn-scroll-archive{gap:16px;margin-top:28px}.mgn-scroll-card,.mgn-writing-archive .mgn-scroll-card{min-height:clamp(390px,62svh,560px);padding:26px 22px}.mgn-scroll-card-head{font-size:8px;letter-spacing:.09em;flex-wrap:wrap}.mgn-scroll-card h3{margin-top:34px;font-size:clamp(34px,9vw,48px)}.mgn-scroll-card p{font-size:14px}.mgn-scroll-card-bottom{margin-top:24px}}
@media(max-width:390px){.mgn-scroll-card,.mgn-writing-archive .mgn-scroll-card{min-height:390px;padding:23px 18px}.mgn-scroll-card h3{font-size:32px}}
@media(prefers-reduced-motion:reduce){.mgn-scroll-card,.mgn-scroll-card:before{transition:none!important}.mgn-scroll-card[data-phase]{opacity:1!important;transform:none!important}}
.mgn-tilted-project-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(12px,1.6cqi,22px);align-items:center;perspective:1500px;transform-style:preserve-3d;mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);padding:12px 0 22px}
.mgn-tilted-project-tile{position:relative;isolation:isolate;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;min-width:0;min-height:clamp(320px,31cqi,450px);padding:clamp(16px,2cqi,27px);overflow:hidden;border:1px solid rgba(126,183,238,.2);border-radius:3px;background:#071525;color:#e8eef6;text-align:left;box-shadow:0 24px 55px -38px rgba(0,0,0,.9);transform-style:preserve-3d;transition:transform .6s cubic-bezier(.2,.7,.2,1),border-color .35s ease,box-shadow .35s ease;cursor:pointer}
.mgn-tilted-project-tile:nth-child(3n+1){transform:rotateY(9deg) translateY(14px)}
.mgn-tilted-project-tile:nth-child(3n){transform:rotateY(-9deg) translateY(14px)}
.mgn-tilted-project-tile:nth-child(3n+2){transform:translateY(-10px)}
.mgn-tilted-project-tile:hover,.mgn-tilted-project-tile:focus-visible{z-index:2;transform:rotateY(0) translateY(-7px) scale(1.015);border-color:rgba(240,24,60,.72);box-shadow:0 28px 70px -38px rgba(23,105,170,.5)}
.mgn-tilted-project-tile:focus-visible{outline:2px solid #63c8e8;outline-offset:4px}
.mgn-tilted-project-media,.mgn-tilted-project-shade{position:absolute;inset:0;z-index:-1;display:block}
.mgn-tilted-project-media{overflow:hidden;background:radial-gradient(ellipse at 50% 32%,rgba(23,105,170,.25),transparent 62%),#071525}
.mgn-tilted-project-media img,.mgn-tilted-project-media .mgn-project-art,.mgn-tilted-project-media .mgn-project-realshot{display:block;width:100%;height:100%;max-width:none;object-fit:cover;transition:transform .9s cubic-bezier(.2,.7,.2,1)}
.mgn-tilted-project-media .mgn-project-art{padding:8%;object-fit:contain}
.mgn-tilted-project-media .mgn-project-realshot img{display:block;width:100%;height:100%;max-width:none;object-fit:cover}
.mgn-tilted-project-tile:hover .mgn-tilted-project-media img,.mgn-tilted-project-tile:hover .mgn-tilted-project-media .mgn-project-art{transform:scale(1.055)}
.mgn-tilted-project-shade{background:linear-gradient(180deg,rgba(7,21,37,.46),transparent 30%,rgba(7,21,37,.24) 48%,rgba(7,21,37,.97) 100%)}
.mgn-tilted-project-meta{display:flex;justify-content:space-between;gap:10px;width:100%;font:9px ui-monospace,monospace;letter-spacing:.13em;color:#b6cde1;text-transform:uppercase}
.mgn-tilted-project-title{margin-top:auto;padding-top:clamp(105px,13cqi,180px);font:clamp(24px,2.5cqi,36px)/1.04 var(--mgn-display);color:#e8eef6;text-wrap:balance}
.mgn-tilted-project-kind{margin-top:9px;color:#9bc7ee;font:10px/1.5 var(--mgn-body);letter-spacing:.08em;text-transform:uppercase}
.mgn-tilted-project-open{margin-top:18px;padding-top:10px;width:100%;border-top:1px solid rgba(232,238,246,.18);color:#ff526c;font:9px ui-monospace,monospace;letter-spacing:.15em}
@media(max-width:1050px){.mgn-tilted-project-grid{grid-template-columns:repeat(2,minmax(0,1fr));mask-image:linear-gradient(90deg,transparent,#000 3%,#000 97%,transparent)}.mgn-tilted-project-tile:nth-child(n){transform:none}.mgn-tilted-project-tile:nth-child(4n+1){transform:rotateY(5deg) translateY(8px)}.mgn-tilted-project-tile:nth-child(4n){transform:rotateY(-5deg) translateY(8px)}}
@media(max-width:700px){.mgn-root .mgn-title{font-size:clamp(54px,20cqi,138px)}.mgn-root .mgn-sig{font-size:clamp(22px,6vw,38px)}.mgn-root .mgn-pill-wrap{align-self:center;margin-right:0;max-width:100%;text-align:center}.mgn-root .mgn-pill{font-size:clamp(10px,3.5vw,15px);line-height:1.55}.mgn-root .mgn-cover-meta{left:16px;right:16px;bottom:18px;gap:8px;font-size:9px}.mgn-tilted-project-grid{grid-template-columns:1fr;gap:12px;mask-image:none;padding-top:4px}.mgn-tilted-project-tile:nth-child(n){min-height:310px;transform:none}.mgn-tilted-project-title{font-size:29px;padding-top:108px}}
@media(max-width:390px){.mgn-root .mgn-title{font-size:clamp(48px,19cqi,74px)}.mgn-root .mgn-cover-meta{font-size:8px}}
@media(prefers-reduced-motion:reduce){.mgn-tilted-project-tile,.mgn-tilted-project-media img,.mgn-tilted-project-media .mgn-project-art{transition:none!important}}
.mgn-root {
  position: relative;
  isolation: isolate;
  background: #071525 !important;
  background-image:
    radial-gradient(ellipse at 82% 8%, rgba(23,105,170,.18), transparent 34%),
    radial-gradient(ellipse at 8% 64%, rgba(240,24,60,.075), transparent 36%),
    linear-gradient(145deg, #071525 0%, #0a1a30 54%, #071525 100%) !important;
  background-attachment: fixed !important;
  user-select: none;
  -webkit-user-select: none;
}
.mgn-root::before { display: none !important; }
.mgn-root .mgn-sheet,
.mgn-root .mgn-sheet[data-tone="paper"],
.mgn-root .mgn-sheet[data-tone="night"] {
  --fg: #e8eef6 !important;
  --muted: rgba(200,215,231,.72) !important;
  --rule: rgba(200,215,231,.15) !important;
  color: #e8eef6 !important;
  background: transparent !important;
}
.mgn-root .mgn-sheet-bg { display: none !important; }
.mgn-root .mgn-grain {
  opacity: .11 !important;
  mix-blend-mode: screen !important;
  background-image: radial-gradient(rgba(126,183,238,.12) .55px, transparent .7px) !important;
  background-size: 5px 5px !important;
}
.mgn-root .mgn-sheet:not(.mgn-cover)::before {
  content: "";
  position: absolute;
  top: 0;
  left: clamp(18px, 5.2cqi, 92px);
  right: clamp(18px, 5.2cqi, 92px);
  height: 1px;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(23,105,170,.42), rgba(240,24,60,.34), transparent);
  opacity: .7;
}

/* A real fixed navigation bar, independent of the section flow. */
.mgn-top {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 62px !important;
  z-index: 1200 !important;
  mix-blend-mode: normal !important;
  pointer-events: none !important;
}
.mgn-bar {
  position: relative !important;
  height: 62px !important;
  display: grid !important;
  grid-template-columns: minmax(70px,1fr) auto minmax(120px,1fr) !important;
  align-items: center !important;
  padding: 0 clamp(18px, 4vw, 64px) !important;
  border-bottom: 1px solid rgba(126,183,238,.18);
  background: linear-gradient(180deg, rgba(7,21,37,.96), rgba(7,21,37,.88)) !important;
  box-shadow: 0 8px 28px rgba(0,0,0,.16);
  color: #e8eef6 !important;
  backdrop-filter: saturate(120%);
  pointer-events: auto !important;
}
.mgn-bar > span:first-child {
  color: rgba(200,215,231,.68);
}
.mgn-bar-btn {
  justify-self: center;
  color: #e8eef6 !important;
}
.mgn-bar-btn .mgn-mark { stroke: #f0183c !important; }
.mgn-bar-right {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 18px;
}
.mgn-bar-name { color: rgba(200,215,231,.68); }
.mgn-bar-sec { color: #e8eef6 !important; }
.mgn-progress {
  height: 2px !important;
  bottom: -1px !important;
  background: linear-gradient(90deg, #1769aa, #49c7dc 55%, #f0183c) !important;
}
.mgn-hold {
  position: fixed !important;
  inset: 0 !important;
  height: 0 !important;
  z-index: 1250 !important;
  pointer-events: none !important;
}
.mgn-index {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 100svh !important;
  pointer-events: auto !important;
}

.mgn-index { scrollbar-width: none !important; -ms-overflow-style: none !important; }
.mgn-index::-webkit-scrollbar { display: none !important; width: 0 !important; }

/* Social links: recognizable marks, labels available through tooltips/AT. */
.mgn-links {
  display: flex !important;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px !important;
  margin-top: clamp(20px, 2.4cqi, 34px) !important;
}
.mgn-links a {
  position: relative;
  display: grid !important;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 1px solid rgba(126,183,238,.28);
  border-radius: 50%;
  color: #c9d8e8 !important;
  background: linear-gradient(145deg, rgba(23,105,170,.15), rgba(7,21,37,.4));
  transition: transform .25s ease, color .25s ease, border-color .25s ease, background .25s ease;
}
.mgn-links a svg {
  width: 21px;
  height: 21px;
  display: block;
  fill: currentColor;
}
.mgn-links a:hover,
.mgn-links a:focus-visible {
  color: #e8eef6 !important;
  border-color: #f0183c;
  background: rgba(240,24,60,.14);
  transform: translateY(-4px);
}
.mgn-links a::after {
  content: attr(data-label);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 9px);
  transform: translate(-50%, 4px);
  padding: 5px 8px;
  border: 1px solid rgba(126,183,238,.24);
  border-radius: 3px;
  background: #071525;
  color: #e8eef6;
  font: 9px ui-monospace, monospace;
  letter-spacing: .08em;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity .2s ease, transform .2s ease;
}
.mgn-links a:hover::after,
.mgn-links a:focus-visible::after {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* Crisp, one-way reveal motion: elements enter; the entire page never fades away. */
.mgn-root .mgn-record-card,
.mgn-root .mgn-project-tile,
.mgn-root .mgn-fact {
  backface-visibility: hidden;
  will-change: transform, opacity;
}
@media (max-width: 700px) {
  .mgn-bar {
    grid-template-columns: auto 1fr !important;
    padding-inline: 16px !important;
  }
  .mgn-bar > span:first-child { display: none; }
  .mgn-bar-btn { justify-self: start; }
  .mgn-bar-name { display: none; }
  .mgn-links a { width: 42px; height: 42px; }
}
@media (prefers-reduced-motion: reduce) {
  .mgn-links a { transition: none !important; }
}
`;

const SPIDER_VERSE_CSS = `
/* Reference-led Miguel / Spider-Verse treatment: restrained, graphic and continuous. */
.mgn-root {
  background: #071525 !important;
  color: #e8eef6 !important;
  --mgn-cyan: #49c7dc;
}
.mgn-root .mgn-sheet,
.mgn-root .mgn-sheet[data-tone="paper"],
.mgn-root .mgn-sheet[data-tone="night"] {
  --fg: #e8eef6 !important;
  --muted: rgba(200,215,231,.72) !important;
  --rule: rgba(126,183,238,.16) !important;
  color: #e8eef6 !important;
  background: transparent !important;
}
.mgn-root .mgn-sheet-bg {
  display: block !important;
  background: #071525 !important;
}
.mgn-root .mgn-sheet-bg:after { display: none !important; }
.mgn-root .mgn-cover .mgn-sheet-bg {
  background:
    radial-gradient(ellipse at 82% 44%, rgba(23,105,170,.18), transparent 42%),
    linear-gradient(115deg, #071525 0%, #0a1a30 56%, #071525 100%) !important;
}
.mgn-root .mgn-cover:before {
  content: "";
  position: absolute;
  inset: 0 0 0 auto;
  width: min(64vw, 980px);
  pointer-events: none;
  z-index: 0;
  opacity: .24;
  background:
    repeating-radial-gradient(circle at 100% 0%, transparent 0 29px, rgba(73,199,220,.26) 30px 31px, transparent 32px 57px),
    repeating-conic-gradient(from 188deg at 100% 0%, transparent 0deg 11.8deg, rgba(240,24,60,.20) 12deg 12.35deg, transparent 12.6deg 24deg);
  mask-image: linear-gradient(130deg, transparent 0%, #000 42%, #000 100%);
}
.mgn-root .mgn-cover:after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: .16;
  background-image: radial-gradient(rgba(240,24,60,.7) .8px, transparent 1.1px);
  background-size: 7px 7px;
  mask-image: radial-gradient(ellipse at 0% 100%, #000 0%, transparent 42%), radial-gradient(ellipse at 100% 0%, #000 0%, transparent 35%);
}
.mgn-root .mgn-cover-in { position: relative; z-index: 2; }
.mgn-root .mgn-cover-meta { position: absolute; z-index: 3; }
.mgn-root .mgn-title { text-shadow: 0 4px 30px rgba(7,21,37,.62); }
.mgn-root .mgn-title .mgn-l:hover { filter: drop-shadow(2px 0 rgba(240,24,60,.7)) drop-shadow(-2px 0 rgba(73,199,220,.6)); }
.mgn-root .mgn-hand { color: #ff526c; }
.mgn-root .mgn-project-index,.mgn-root .mgn-record-stamp { color: #ff526c; }
.mgn-root .mgn-portrait { left: 18%; top: 17%; width: 64%; height: 64%; }
.mgn-root .mgn-portrait-img {
  background: #050d19;
  border: 1px solid rgba(73,199,220,.34);
  box-shadow: 0 0 0 1px rgba(240,24,60,.2), 0 22px 46px rgba(0,0,0,.35);
}
.mgn-root .mgn-portrait-img video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #050d19;
  filter: contrast(1.14) saturate(1.12);
  transform: none;
}
.mgn-root .mgn-portrait:after {
  content: "ASCII MOTION / MIGUEL O'HARA · EARTH-928";
  position: absolute;
  left: -2%;
  bottom: -24px;
  font: 9px ui-monospace,monospace;
  letter-spacing: .12em;
  color: #80b9e7;
  white-space: nowrap;
}
.mgn-root ::selection { background: rgba(240,24,60,.55); color: #fff; }

/* Fixed header: the archive label is branding; only the right-hand index button opens navigation. */
.mgn-root .mgn-top {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 64px !important;
  z-index: 1400 !important;
  mix-blend-mode: normal !important;
  pointer-events: none !important;
}
.mgn-root .mgn-bar {
  position: relative !important;
  height: 64px !important;
  display: grid !important;
  grid-template-columns: minmax(60px,1fr) auto minmax(220px,1fr) !important;
  align-items: center !important;
  gap: 16px !important;
  padding: 0 clamp(18px, 4vw, 64px) !important;
  border-bottom: 1px solid rgba(126,183,238,.18);
  background: rgba(7,21,37,.94) !important;
  box-shadow: 0 7px 24px rgba(0,0,0,.18);
  color: #e8eef6 !important;
  backdrop-filter: blur(14px) saturate(120%);
  pointer-events: auto !important;
}
.mgn-root .mgn-bar-year { color: rgba(200,215,231,.68); }
.mgn-root .mgn-bar-brand {
  justify-self: center;
  color: rgba(232,238,246,.9);
  font: 600 10px ui-monospace,monospace;
  letter-spacing: .14em;
  white-space: nowrap;
  pointer-events: none;
}
.mgn-root .mgn-bar-right {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: clamp(10px,1.5vw,22px);
  min-width: 0;
}
.mgn-root .mgn-bar-name {
  color: rgba(200,215,231,.68);
  font-size: 10px;
  letter-spacing: .12em;
  white-space: nowrap;
}
.mgn-root .mgn-bar-sec {
  min-width: 5ch;
  color: #e8eef6 !important;
  font-family: var(--mgn-hand);
  font-size: 18px;
  letter-spacing: 0;
  white-space: nowrap;
}
.mgn-root .mgn-menu-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(126,183,238,.35);
  border-radius: 3px;
  color: #e8eef6;
  background: rgba(10,26,48,.76);
  font: 600 9px ui-monospace,monospace;
  letter-spacing: .16em;
  cursor: pointer;
  transition: background .2s ease,border-color .2s ease,color .2s ease;
}
.mgn-root .mgn-menu-toggle:hover { color: #fff; border-color: #f0183c; background: rgba(23,105,170,.24); }
.mgn-root .mgn-menu-toggle svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; }
.mgn-root .mgn-progress {
  height: 2px !important;
  bottom: -1px !important;
  background: linear-gradient(90deg,#1769aa,#49c7dc 55%,#f0183c) !important;
}
.mgn-root .mgn-hold {
  position: fixed !important;
  inset: 0 !important;
  height: 0 !important;
  z-index: 1500 !important;
  pointer-events: none !important;
}
.mgn-root .mgn-index {
  position: fixed !important;
  inset: 0 !important;
  display: block !important;
  width: 100vw;
  height: 100vh !important;
  height: 100dvh !important;
  padding: 88px clamp(22px,6.5vw,104px) 34px !important;
  overflow: auto !important;
  background: #071525 !important;
  visibility: hidden;
  pointer-events: none !important;
  clip-path: circle(0 at calc(100% - 55px) 32px) !important;
  transition: clip-path .62s cubic-bezier(.72,0,.18,1), visibility 0s .62s !important;
}
.mgn-root .mgn-index[data-open="true"] {
  visibility: visible;
  pointer-events: auto !important;
  clip-path: circle(150vmax at calc(100% - 55px) 32px) !important;
  transition: clip-path .68s cubic-bezier(.72,0,.18,1), visibility 0s !important;
}
.mgn-root .mgn-index-inner { width: min(1440px,100%); margin: 0 auto; }
.mgn-root .mgn-index-head { display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:clamp(24px,4vw,52px); }
.mgn-root .mgn-index-kicker { color:rgba(126,183,238,.78);font:10px ui-monospace,monospace;letter-spacing:.18em; }
.mgn-root .mgn-index-close { position:static !important; color:#f0183c !important;font-family:var(--mgn-hand);font-size:21px; }
.mgn-root .mgn-index-groups { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(24px,4vw,64px) clamp(24px,4.5vw,76px); }
.mgn-root .mgn-index-group h2 { margin:0 0 13px;padding-bottom:9px;border-bottom:1px solid rgba(126,183,238,.2);color:#f0183c;font:600 9px ui-monospace,monospace;letter-spacing:.2em; }
.mgn-root .mgn-index-group ol { list-style:none !important;display:grid;grid-template-columns:minmax(0,1fr) !important;grid-auto-flow:row !important;grid-template-rows:none !important;gap:9px !important;margin:0 !important;padding:0 !important; }
.mgn-root .mgn-index-group li button { display:flex;align-items:baseline;gap:12px;width:100%;font-family:var(--mgn-display);font-size:clamp(24px,2.2vw,39px);line-height:1.08;color:#e8eef6;text-align:left;transition:color .18s ease,transform .18s ease; }
.mgn-root .mgn-index-group li button:hover { color:#fff;transform:translateX(5px); }
.mgn-root .mgn-index-group li button small { min-width:2ch;color:#f0183c;font:10px ui-monospace,monospace; }
.mgn-root .mgn-index-link-label { position:relative; }
.mgn-root .mgn-index-link-label:after { content:"";position:absolute;left:0;right:100%;bottom:-4px;height:1px;background:#f0183c;transition:right .2s ease; }
.mgn-root .mgn-index-group li button:hover .mgn-index-link-label:after { right:0; }
.mgn-root .mgn-index-foot { margin-top:clamp(28px,4vw,56px);padding-top:16px;border-top:1px solid rgba(126,183,238,.16);color:rgba(200,215,231,.5);font:9px ui-monospace,monospace;letter-spacing:.14em; }

@media (max-width: 900px) {
  .mgn-root .mgn-index-groups { grid-template-columns:repeat(2,minmax(0,1fr)); }
}
@media (max-width: 620px) {
  .mgn-root .mgn-bar { grid-template-columns:44px minmax(0,1fr) auto !important;gap:8px !important;padding:0 12px !important; }
  .mgn-root .mgn-bar-year { font-size:9px; }
  .mgn-root .mgn-bar-brand { justify-self:start;font-size:8px;letter-spacing:.08em;overflow:hidden;text-overflow:ellipsis; }
  .mgn-root .mgn-bar-right { gap:8px; }
  .mgn-root .mgn-bar-name { display:none; }
  .mgn-root .mgn-bar-sec { display:none; }
  .mgn-root .mgn-menu-toggle { min-height:34px;padding:0 9px; }
  .mgn-root .mgn-index { padding:78px 20px 28px !important; }
  .mgn-root .mgn-index-groups { grid-template-columns:1fr 1fr;gap:22px 20px; }
  .mgn-root .mgn-index-group li button { font-size:clamp(20px,5vw,29px); }
  .mgn-root .mgn-cover-in { max-width:100%; }
  .mgn-root .mgn-portrait { left:18%;top:17%;width:64%;height:64%; }
}
@media (prefers-reduced-motion: reduce) {
  .mgn-root .mgn-menu-toggle,.mgn-root .mgn-index,.mgn-root .mgn-index-group li button { transition:none !important; }
}
`;


const REFERENCE_LED_CSS = `
/* Education: one strong editorial image, no duplicated scores or dashboard widgets. */
.mgn-root .mgn-education-side { min-width:0; display:flex; flex-direction:column; gap:22px; }
.mgn-root .mgn-edu-visual {
  position:relative; display:block; width:100%; margin:0; min-height:330px; aspect-ratio:1.14 / 1;
  overflow:hidden; border:1px solid rgba(126,183,238,.28); border-radius:3px;
  background:#071525; box-shadow:0 26px 70px rgba(0,0,0,.28);
}
.mgn-root .mgn-edu-visual img { display:block; width:100%; height:100%; max-width:none; object-fit:cover; }
.mgn-root .mgn-edu-visual:after { content:""; position:absolute; inset:0; pointer-events:none; background:linear-gradient(180deg,rgba(7,21,37,.02) 48%,rgba(7,21,37,.68) 100%); }
.mgn-root .mgn-edu-visual figcaption {
  position:absolute; z-index:2; left:18px; right:18px; bottom:16px; display:flex; justify-content:space-between; gap:12px;
  color:#d9e8f6; font:9px ui-monospace,monospace; letter-spacing:.14em; text-transform:uppercase;
}
.mgn-root .mgn-edu-visual figcaption span:last-child { color:#8bb6dc; text-align:right; }

/* Off-the-keyboard: typography and spacing replace decorative, unrelated pictograms. */
.mgn-root .mgn-fact-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:clamp(28px,4.6cqi,66px) clamp(22px,4cqi,58px); margin-top:clamp(34px,4.5cqi,66px); }
.mgn-root .mgn-fact {
  min-width:0; min-height:145px; display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-start;
  gap:16px; padding:17px 0 8px; border-top:1px solid rgba(126,183,238,.22); text-align:left;
  transform:none !important; cursor:default;
}
.mgn-root .mgn-fact-index { color:#83acd0; font:9px ui-monospace,monospace; letter-spacing:.15em; line-height:1.4; }
.mgn-root .mgn-fact-t { display:block; max-width:22ch; margin:0; color:#ff526c; font-size:clamp(22px,2.25cqi,31px); line-height:1.12; transform:none !important; }
.mgn-root .mgn-fact:nth-child(odd) .mgn-fact-t,
.mgn-root .mgn-fact:nth-child(even) .mgn-fact-t { transform:none !important; }

/* Project files: actual supplied captures, never the previous generic mock illustrations for these three projects. */
.mgn-root .mgn-project-realshot { position:absolute; inset:0; z-index:1; display:grid; place-items:center; overflow:hidden; background:#050d19; }
.mgn-root .mgn-project-realshot img { display:block; width:100%; height:100%; max-width:none; object-fit:cover; }
.mgn-root .mgn-project-realshot.is-contain img { object-fit:contain; padding:14px; background:#050d19; }
.mgn-root .mgn-project-visual:has(.mgn-project-realshot) { background:#050d19; }
.mgn-root .mgn-project-visual:has(.mgn-project-realshot):before { opacity:.12; }
.mgn-root .mgn-project-visual:has(.mgn-project-realshot):after { background:linear-gradient(120deg,transparent 39%,rgba(240,24,60,.08) 39.2%,transparent 40%); }
.mgn-root .mgn-project-visual-foot { z-index:5; text-shadow:0 1px 5px rgba(0,0,0,.9); color:rgba(232,238,246,.76); }

/* The live section title is the sole menu trigger; the central archive label remains static. */
.mgn-root button.mgn-bar-sec {
  display:inline-flex; align-items:center; justify-content:flex-end; min-width:5ch; padding:3px 1px 4px;
  border:0; border-bottom:1px solid transparent; background:transparent; color:#e8eef6 !important;
  font-family:var(--mgn-hand); font-size:19px; line-height:1.1; text-align:right; cursor:pointer;
  transition:color .2s ease,border-color .2s ease;
}
.mgn-root button.mgn-bar-sec:hover,
.mgn-root button.mgn-bar-sec[aria-expanded="true"] { color:#ff526c !important; border-bottom-color:#f0183c; }
.mgn-root button.mgn-bar-sec:focus-visible { outline:2px solid #f0183c; outline-offset:5px; }
@media(max-width:620px) {
  .mgn-root .mgn-bar { grid-template-columns:40px minmax(0,1fr) auto !important; gap:8px !important; }
  .mgn-root .mgn-bar-name { display:none !important; }
  .mgn-root button.mgn-bar-sec { display:inline-flex !important; min-width:0; max-width:31vw; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mgn-root .mgn-fact-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px 18px; }
  .mgn-root .mgn-fact { min-height:125px; }
  .mgn-root .mgn-edu-visual { min-height:250px; }
}
@media(prefers-reduced-motion:reduce) {
  .mgn-root button.mgn-bar-sec { transition:none !important; }
}
`;

/* ------------------------------------------------------------- primitives */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, MorphSVGPlugin)

const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function photo(url: string, w: number): string {
  if (!/^https:\/\/images\.unsplash\.com\//.test(url) || url.includes("?")) return url
  return url + "?auto=format&fit=crop&w=" + w + "&q=72"
}

type MarkKind = "oval" | "under" | "box"

/** A pen mark sized to its parent: an oval round it, a line under it, or a sketchy box. */
function PenMark({ kind, seed = 1, padX = 10, padY = 6 }: { kind: MarkKind; seed?: number; padX?: number; padY?: number }) {
  const ref = React.useRef(null as SVGSVGElement | null)
  const [box, setBox] = React.useState({ w: 0, h: 0 })
  useIso(() => {
    const host = ref.current && ref.current.parentElement
    if (!host) return
    const measure = () => {
      const w = host.offsetWidth
      const h = host.offsetHeight
      setBox((b) => (b.w === w && b.h === h ? b : { w, h }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    return () => ro.disconnect()
  }, [])
  const W = Math.max(1, box.w + padX * 2)
  const H = Math.max(1, box.h + padY * 2)
  const d =
    kind === "oval" ? ovalPath(W, H, seed) : kind === "under" ? underlinePath(W, H, seed) : boxPath(box.w, box.h, seed)
  const vb = kind === "box" ? -padX + " " + -padY + " " + W + " " + H : "0 0 " + W + " " + H
  return (
    <svg ref={ref} className="mgn-mark" aria-hidden="true" viewBox={vb} style={{ left: -padX, top: -padY, width: W, height: H }}>
      <path className="mgn-draw" pathLength={1} d={d} />
    </svg>
  )
}

/** Text with *underlined* and [circled] phrases. */
function Marked({ text, seed = 1 }: { text: string; seed?: number }) {
  return (
    <>
      {parseMarks(text).map((m, i) =>
        m.mark ? (
          <span key={i} className="mgn-mk">
            {m.text}
            <PenMark kind={m.mark} seed={seed + i} padX={m.mark === "oval" ? 9 : 1} padY={m.mark === "oval" ? 4 : 7} />
          </span>
        ) : (
          <React.Fragment key={i}>{m.text}</React.Fragment>
        ),
      )}
    </>
  )
}

/** Word-wrapped text split into masked characters for the rise-in. */
function Split({ text }: { text: string }) {
  const words = text.split(" ")
  return (
    <span className="mgn-split" aria-label={text} role="text">
      {words.map((w, wi) => (
        <React.Fragment key={wi}>
          <span className="mgn-w" aria-hidden="true">
            {Array.from(w).map((c, ci) => (
              <span key={ci} className="mgn-c">
                <span className="mgn-ci">{c}</span>
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </span>
  )
}

/** A big serif heading whose pen underline morphs from a zig-zag into a swoosh. */
function Heading({ text, seed, className }: { text: string; seed: number; className?: string }) {
  const m = React.useMemo(() => underlineMorph(300, seed), [seed])
  return (
    <div className="mgn-hd">
      <h2 className={"mgn-display mgn-h2" + (className ? " " + className : "")}>
        <Split text={text} />
      </h2>
      <svg className="mgn-uline" viewBox="0 0 300 26" aria-hidden="true">
        <path className="mgn-morph mgn-draw" pathLength={1} d={m.to} data-from={m.from} data-to={m.to} />
      </svg>
    </div>
  )
}

function Arrow({ a, b, bend = 0.2, head = 9 }: { a: Pt; b: Pt; bend?: number; head?: number }) {
  const p = arrowPaths(a, b, bend, head)
  return (
    <g>
      <path className="mgn-draw" pathLength={1} d={p.shaft} />
      <path className="mgn-draw" pathLength={1} d={p.head} />
    </g>
  )
}

const DOODLES: { [k: string]: string[] } = {
  guitar: [
    "M25 33c-7-2-13 3-13 10 0 8 7 13 14 13 7 0 11-5 12-10 1-4 4-5 6-8 3-4 1-9-3-10-4-1-6 1-8 3-2 2-3 4-8 2z",
    "M30 44a4.5 4.5 0 1 1-9 0a4.5 4.5 0 1 1 9 0",
    "M33 38L51 20",
    "M36 41L54 23",
    "M50 15l7 7-3 3-7-7z",
    "M19 51L55 18",
  ],
  dumbbell: ["M21 32h22", "M9 23h6v18H9z", "M15 19h6v26h-6z", "M49 23h6v18h-6z", "M43 19h6v26h-6z", "M5 32h4M55 32h4"],
  music: [
    "M23 51c-3 0-6-2-6-4.5s3-4.5 6-4.5 6 2 6 4.5-3 4.5-6 4.5z",
    "M46 45c-3 0-6-2-6-4.5s3-4.5 6-4.5 6 2 6 4.5-3 4.5-6 4.5z",
    "M29 47V17",
    "M52 41V11",
    "M29 17L52 11",
    "M29 24L52 18",
  ],
  plane: ["M7 31L57 10L45 53L32 39Z", "M32 39L57 10", "M32 39v12l6-7", "M5 46c5 3 10 3 15 0", "M9 54c4 2 8 2 11 0"],
  coffee: [
    "M14 27h30v11c0 9-6 15-15 15S14 47 14 38z",
    "M44 31c6 0 8 3 8 6s-3 6-8 6",
    "M9 57h40",
    "M22 21c-3-3 3-6 0-10",
    "M30 21c-3-3 3-6 0-10",
    "M38 21c-3-3 3-6 0-10",
  ],
  camera: [
    "M12 21h40a4 4 0 0 1 4 4v23a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V25a4 4 0 0 1 4-4z",
    "M22 21l4-7h12l4 7",
    "M42 37a10 10 0 1 1-20 0a10 10 0 1 1 20 0",
    "M37 37a5 5 0 1 1-10 0a5 5 0 1 1 10 0",
    "M47 27h4",
  ],
  plant: [
    "M20 40h24l-3 17H23z",
    "M17 40h30",
    "M32 40V21",
    "M32 31c-9 0-15-6-15-15 9 0 15 6 15 15z",
    "M32 25c7 0 13-5 13-13-8 0-13 5-13 13z",
  ],
  book: [
    "M32 18c-6-4-14-5-24-4v34c10-1 18 0 24 4 6-4 14-5 24-4V14c-10-1-18 0-24 4z",
    "M32 18v34",
    "M14 24c4 0 8 0 12 2",
    "M14 31c4 0 8 0 12 2",
    "M38 26c4-2 8-2 12-2",
    "M38 33c4-2 8-2 12-2",
  ],
  headphones: [
    "M12 40v-8a20 20 0 0 1 40 0v8",
    "M10 38h6v15h-6a2 2 0 0 1-2-2V40a2 2 0 0 1 2-2z",
    "M48 38h6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-6z",
  ],
  globe: [
    "M54 32a22 22 0 1 1-44 0a22 22 0 1 1 44 0",
    "M32 10c-9 6-9 38 0 44",
    "M32 10c9 6 9 38 0 44",
    "M11 25h42",
    "M11 39h42",
  ],
  cat: [
    "M14 24l4-13 10 8h8l10-8 4 13c3 5 4 10 2 15-3 9-12 13-20 13s-17-4-20-13c-2-5-1-10 2-15z",
    "M24 32v3",
    "M40 32v3",
    "M29 41l3 2 3-2",
    "M6 38l13 2M6 45l13-1",
    "M58 38l-13 2M58 45l-13-1",
  ],
  pencil: ["M12 52l4-13 27-27 9 9-27 27z", "M16 39l9 9", "M38 17l9 9", "M12 52l9-4", "M5 58c10-3 20 2 30-1"],
  mountain: ["M5 53L24 22l10 16 8-10 17 25z", "M50 16a6 6 0 1 1-12 0a6 6 0 1 1 12 0", "M18 32l6 5 5-5"],
  boxing: ["M15 34c0-12 7-21 17-21s17 9 17 21v10c0 6-5 10-11 10H26c-7 0-11-4-11-10z", "M15 29l-6-7 9-9 8 7", "M49 29l6-7-9-9-8 7", "M24 35h16"],
  gamepad: ["M16 24h32c7 0 12 6 12 13v9c0 5-5 8-9 5l-9-7H26l-9 7c-5 3-9 0-9-5v-9c0-7 5-13 8-13z", "M19 31v12M13 37h12", "M44 34h.1M51 41h.1"],
  palette: ["M32 9c-14 0-24 10-24 23s10 23 24 23c5 0 8-3 8-7 0-3-3-5-3-8 0-3 3-5 7-5h5c7 0 11-5 11-11C60 15 47 9 32 9z", "M19 27h.1", "M27 18h.1", "M40 18h.1", "M48 27h.1"],
  medal: ["M22 8h20l-5 22H27z", "M32 30l-13 12 3 15 10-6 10 6 3-15z", "M32 38v8"],
  ball: ["M32 8a24 24 0 1 0 0 48a24 24 0 1 0 0-48z", "M8 32h48", "M32 8c-9 8-13 16-13 24s4 16 13 24", "M32 8c9 8 13 16 13 24s-4 16-13 24"],
}

function Doodle({ kind }: { kind: MgnDoodle }) {
  const paths = kind === "heart" ? [heartPath(32, 32, 22)] : DOODLES[kind] || DOODLES.pencil
  return (
    <svg viewBox="0 0 64 64" className="mgn-ink" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} className="mgn-draw" pathLength={1} d={d} />
      ))}
    </svg>
  )
}

function FigmaMark() {
  return (
    <svg viewBox="0 0 38 57" width="44%" aria-hidden="true">
      <path d="M19 0H9.5a9.5 9.5 0 0 0 0 19H19z" fill="#f24e1e" />
      <path d="M19 0h9.5a9.5 9.5 0 0 1 0 19H19z" fill="#ff7262" />
      <path d="M9.5 19a9.5 9.5 0 0 0 0 19H19V19z" fill="#a259ff" />
      <circle cx="28.5" cy="28.5" r="9.5" fill="#1abcfe" />
      <path d="M9.5 38a9.5 9.5 0 1 0 9.5 9.5V38z" fill="#0acf83" />
    </svg>
  )
}

function QRCode({ text }: { text: string }) {
  const g = React.useMemo(() => qrMatrix(text), [text])
  if (!g) return null
  const n = g.length
  let d = ""
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (g[y][x]) d += "M" + x + " " + y + "h1v1h-1z"
  return (
    <svg viewBox={"-2 -2 " + (n + 4) + " " + (n + 4)} shapeRendering="crispEdges" role="img" aria-label={"QR code: " + text}>
      <path d={d} fill="#141416" />
    </svg>
  )
}

function BookStack({ books }: { books: { title: string; color: string }[] }) {
  const list = books.slice(0, 7)
  const R = rand(5)
  const bh = 30
  const base = list.length * bh + 64
  return (
    <svg viewBox={"0 0 260 " + (base + 6)} aria-hidden="true">
      <g className="mgn-ink">
        <path className="mgn-draw" pathLength={1} d={handLine(6, 254, base + 2, 3)} />
      </g>
      {list.map((b, i) => {
        const w = 168 + R() * 56
        const x = (260 - w) / 2 + (R() - 0.5) * 22
        const y = base - (i + 1) * bh
        const rot = (R() - 0.5) * 5
        const dark = !isLight(b.color)
        const title = b.title.toUpperCase()
        return (
          <g key={i} transform={"rotate(" + rot.toFixed(2) + " " + (x + w / 2).toFixed(1) + " " + (y + bh / 2).toFixed(1) + ")"}>
            <rect x={x} y={y} width={w} height={bh - 3} rx={3} fill={b.color} stroke="rgba(0,0,0,.28)" strokeWidth={0.7} />
            <rect x={x + 9} y={y} width={4} height={bh - 3} fill={dark ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.12)"} />
            <rect x={x + w - 13} y={y} width={4} height={bh - 3} fill={dark ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.12)"} />
            <text
              x={x + w / 2}
              y={y + bh / 2 + 2}
              textAnchor="middle"
              fontSize={9}
              fill={dark ? "#f4f2ec" : "#232325"}
              textLength={Math.min(w - 42, title.length * 6.2)}
              lengthAdjust="spacingAndGlyphs"
              style={{ fontFamily: "var(--mgn-body)", fontWeight: 500, letterSpacing: ".06em" }}
            >
              {title}
            </text>
          </g>
        )
      })}
      <g className="mgn-ink" transform={"translate(104 " + (base - list.length * bh - 52) + ")"}>
        <path className="mgn-draw" pathLength={1} d="M10 22h30v10c0 8-6 13-15 13S10 40 10 32z" />
        <path className="mgn-draw" pathLength={1} d="M40 25c6 0 7 3 7 5s-2 6-7 6" />
        <path className="mgn-draw" pathLength={1} d="M19 16c-3-3 3-6 0-10M29 16c-3-3 3-6 0-10" />
      </g>
    </svg>
  )
}

/* ----------------------------------------------------------------- phones */

function Pic({ src, alt = "" }: { src: string; alt?: string }) {
  if (!src) return <div className="mgn-scr-img" style={{ background: "linear-gradient(160deg,#d9d6ce,#a9a59b)" }} />
  return <img className="mgn-scr-img" src={src} alt={alt} loading="lazy" decoding="async" draggable={false} />
}

function Status({ light }: { light?: boolean }) {
  return (
    <div className="mgn-status" style={{ color: light ? "#fff" : "#18181a" }}>
      <span>9:41</span>
      <i>
        <s />
        <b />
      </i>
    </div>
  )
}

function Tabbar({ accent, on = 0 }: { accent: string; on?: number }) {
  return (
    <div className="mgn-tabbar">
      {[0, 1, 2, 3].map((k) => (
        <span key={k} style={k === on ? { background: accent, width: "11cqw", borderRadius: "99px" } : undefined} />
      ))}
    </div>
  )
}

function Screen({ kind, p, shift }: { kind: MgnScreen; p: MgnProject; shift: number }) {
  const accent = p.accent || "#7d84ef"
  const n = Math.max(1, p.images.length)
  const im = (k: number) => photo(p.images[(shift + k) % n] || "", 520)
  const abs = { position: "absolute" } as React.CSSProperties

  if (kind === "cover")
    return (
      <div className="mgn-screen">
        <Pic src={im(0)} />
        <div style={{ ...abs, inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,.3) 0%,rgba(0,0,0,0) 26%,rgba(0,0,0,.08) 48%,rgba(0,0,0,.84) 100%)" }} />
        <Status light />
        <div style={{ ...abs, left: "8cqw", right: "8cqw", bottom: "9cqw", color: "#fff" }}>
          <div style={{ fontFamily: "var(--mgn-display)", fontSize: "15cqw", lineHeight: 0.95 }}>{p.name}</div>
          <div style={{ fontSize: "4.4cqw", opacity: 0.86, marginTop: "3cqw", lineHeight: 1.35 }}>{p.tagline || p.kind}</div>
          <div style={{ marginTop: "7cqw", height: "13cqw", borderRadius: 99, background: accent, display: "grid", placeItems: "center", fontSize: "4.4cqw", fontWeight: 600 }}>
            Explore work
          </div>
          <div style={{ display: "flex", gap: "1.6cqw", justifyContent: "center", marginTop: "5cqw" }}>
            {[0, 1, 2].map((k) => (
              <span key={k} style={{ width: k ? "1.8cqw" : "6cqw", height: "1.8cqw", borderRadius: 99, background: k ? "rgba(255,255,255,.5)" : "#fff" }} />
            ))}
          </div>
        </div>
      </div>
    )

  if (kind === "detail")
    return (
      <div className="mgn-screen">
        <div style={{ ...abs, left: 0, right: 0, top: 0, height: "58%" }}>
          <Pic src={im(0)} />
        </div>
        <Status light />
        <div style={{ ...abs, top: "15cqw", left: "6cqw", right: "6cqw", display: "flex", justifyContent: "space-between", zIndex: 2 }}>
          {["‹", "♡"].map((c) => (
            <span key={c} style={{ width: "10cqw", height: "10cqw", borderRadius: "50%", background: "var(--mgn-night)", display: "grid", placeItems: "center", fontSize: "5.4cqw", color: "var(--mgn-paper)" }}>
              {c}
            </span>
          ))}
        </div>
        <div style={{ ...abs, left: 0, right: 0, bottom: 0, height: "50%", background: "var(--mgn-night)", color: "var(--mgn-paper)", borderRadius: "9cqw 9cqw 0 0", padding: "5cqw 7cqw 0" }}>
          <div style={{ width: "12cqw", height: "1.4cqw", borderRadius: 99, background: "color-mix(in oklab,var(--mgn-blue) 35%,var(--mgn-night))", margin: "0 auto 5cqw" }} />
          <div style={{ fontSize: "7.2cqw", fontWeight: 600, lineHeight: 1.1 }}>{p.name}</div>
          <div style={{ fontSize: "3.6cqw", color: "color-mix(in oklab,var(--mgn-paper) 62%,var(--mgn-ink))", marginTop: "1.4cqw" }}>{p.kind || p.tagline}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "2cqw", marginTop: "3.4cqw", fontSize: "3.6cqw" }}>
            <span style={{ color: accent, letterSpacing: ".08em", fontWeight: 600 }}>{p.year || "PROJECT"}</span>
            <span style={{ color: "color-mix(in oklab,var(--mgn-paper) 62%,var(--mgn-ink))", fontSize: "3.2cqw" }}>{p.kind || "Project notes"}</span>
          </div>
          <div className="mgn-bars" style={{ marginTop: "4cqw" }}>
            <span />
            <span style={{ width: "88%" }} />
            <span style={{ width: "64%" }} />
          </div>
          <div style={{ ...abs, left: "7cqw", right: "7cqw", bottom: "7cqw", height: "13cqw", borderRadius: 99, background: accent, color: "#fff", display: "grid", placeItems: "center", fontSize: "4.4cqw", fontWeight: 600 }}>
            Read notes
          </div>
        </div>
      </div>
    )

  if (kind === "stats") {
    const metric = p.stats && p.stats[0]
    const displayValue = metric ? String(metric.value) + (metric.suffix || "") : (p.year || "Active")
    const displayLabel = metric ? metric.label : (p.kind || "Project snapshot")
    return (
      <div className="mgn-screen">
        <Status light />
        <div style={{ ...abs, left: "7cqw", right: "7cqw", top: "15cqw" }}>
          <div style={{ fontSize: "3.8cqw", color: "color-mix(in oklab,var(--mgn-paper) 62%,var(--mgn-ink))", letterSpacing: ".08em", textTransform: "uppercase" }}>Project snapshot</div>
          <div style={{ fontSize: "13cqw", fontWeight: 600, color: accent, marginTop: "3cqw", lineHeight: 1 }}>{displayValue}</div>
          <div style={{ fontSize: "4cqw", color: "var(--mgn-paper)", marginTop: "1.5cqw" }}>{displayLabel}</div>
          <div style={{ marginTop: "8cqw", paddingTop: "5cqw", borderTop: "1px solid color-mix(in oklab,var(--mgn-blue) 38%,var(--mgn-ink))" }}>
            <div style={{ fontSize: "3.5cqw", color: "color-mix(in oklab,var(--mgn-paper) 62%,var(--mgn-ink))", textTransform: "uppercase", letterSpacing: ".08em" }}>Focus</div>
            <div style={{ fontSize: "5.2cqw", lineHeight: 1.2, fontWeight: 600, marginTop: "2cqw" }}>{p.tagline || p.name}</div>
            <div style={{ fontSize: "3.5cqw", lineHeight: 1.45, marginTop: "3cqw", color: "color-mix(in oklab,var(--mgn-paper) 76%,var(--mgn-ink))" }}>{p.challenge || p.kind}</div>
          </div>
          <div style={{ position: "relative", height: "32cqw", borderRadius: "5cqw", overflow: "hidden", marginTop: "7cqw" }}>
            <Pic src={im(1)} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(7,21,37,.05),rgba(7,21,37,.55))" }} />
          </div>
        </div>
        <Tabbar accent={accent} on={2} />
      </div>
    )
  }

  // feed
  return (
    <div className="mgn-screen">
      <Status light />
      <div style={{ ...abs, left: "7cqw", right: "7cqw", top: "15cqw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "3.8cqw", color: "color-mix(in oklab,var(--mgn-paper) 62%,var(--mgn-ink))" }}>Project log</div>
            <div style={{ fontSize: "7.4cqw", fontWeight: 600, marginTop: ".6cqw" }}>{p.name}</div>
          </div>
          <span style={{ width: "10cqw", height: "10cqw", borderRadius: "50%", background: accent, opacity: 0.9 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2.4cqw", height: "11cqw", borderRadius: 99, background: "color-mix(in oklab,var(--mgn-blue) 24%,var(--mgn-ink))", marginTop: "5cqw", padding: "0 4cqw", fontSize: "3.6cqw", color: "color-mix(in oklab,var(--mgn-paper) 62%,var(--mgn-ink))" }}>
          <span style={{ width: "3.6cqw", height: "3.6cqw", borderRadius: "50%", border: ".6cqw solid var(--mgn-blue)" }} />
          Find a note
        </div>
        <div style={{ display: "flex", gap: "2cqw", marginTop: "4cqw" }}>
          {["Overview", "Process", "Notes"].map((c, k) => (
            <span key={c} className="mgn-chip" style={k ? undefined : { background: accent, color: "#fff" }}>
              {c}
            </span>
          ))}
        </div>
        <div style={{ position: "relative", height: "66cqw", borderRadius: "7cqw", overflow: "hidden", marginTop: "4.6cqw" }}>
          <Pic src={im(0)} />
          <div style={{ ...abs, inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.7))" }} />
          <div style={{ ...abs, left: "5cqw", right: "5cqw", bottom: "4.6cqw", color: "#fff" }}>
            <div style={{ fontSize: "5.4cqw", fontWeight: 600 }}>{p.tagline ? p.tagline.split(/[,.]/)[0] : p.name}</div>
            <div style={{ fontSize: "3.4cqw", opacity: 0.8, marginTop: "1cqw" }}>From the build</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3cqw", marginTop: "3cqw" }}>
          {[1, 2].map((k) => (
            <div key={k} style={{ position: "relative", height: "34cqw", borderRadius: "5cqw", overflow: "hidden" }}>
              <Pic src={im(k)} />
            </div>
          ))}
        </div>
      </div>
      <Tabbar accent={accent} />
    </div>
  )
}

function Phone({ p, kind, shift = 0 }: { p: MgnProject; kind: MgnScreen; shift?: number }) {
  return (
    <div className="mgn-phone" role="img" aria-label={p.name + " — " + kind + " screen"}>
      <div className="mgn-phone-body">
        <Screen kind={kind} p={p} shift={shift} />
        <span className="mgn-island" />
      </div>
    </div>
  )
}

function TiltPhone({ slot, p, kind }: { slot: number; p: MgnProject; kind: MgnScreen }) {
  const inner = React.useRef(null as HTMLDivElement | null)
  const move = (e: React.PointerEvent) => {
    if (!inner.current || e.pointerType === "touch" || reducedMotion()) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - r.left) / r.width - 0.5
    const dy = (e.clientY - r.top) / r.height - 0.5
    gsap.to(inner.current, { rotationY: dx * 22, rotationX: -dy * 16, duration: 0.6, ease: "power3.out", overwrite: "auto" })
  }
  const leave = () => {
    if (inner.current) gsap.to(inner.current, { rotationY: 0, rotationX: 0, duration: 1, ease: "elastic.out(1,0.5)", overwrite: "auto" })
  }
  return (
    <div className="mgn-trio-p" data-slot={slot} data-depth={[0.7, 1, 0.4][slot]}>
      <div className="mgn-tilt" ref={inner} onPointerMove={move} onPointerLeave={leave}>
        <Phone p={p} kind={kind} shift={slot} />
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- sheets */

type SheetInfo = { id: string; label: string; tone: "paper" | "night"; morph: boolean }

function Sheet({ info, className, flip, children }: { info: SheetInfo; className?: string; flip?: boolean; children: React.ReactNode }) {
  return (
    <section
      className={"mgn-sheet" + (className ? " " + className : "")}
      data-tone={info.tone}
      data-sheet={info.id}
      data-sec=""
      data-label={info.label}
      data-flip={flip ? "true" : undefined}
    >
      {info.tone === "night" && <div className="mgn-sheet-bg" data-morph={info.morph ? "true" : undefined} />}
      <div className="mgn-grain" aria-hidden="true" />
      {children}
    </section>
  )
}

const ORBIT_TILT = (-18 * Math.PI) / 180

function Cover({ info, title, name, role, year, location, docLabel, inkTrail }: {
  info: SheetInfo; title: string; name: string; role: string; year: string; location: string; docLabel: string; inkTrail: boolean
}) {
  const chars = Array.from(title)
  let orbitAt = title.toLowerCase().lastIndexOf("o")
  if (orbitAt < 0) orbitAt = chars.length - 1
  const sparkle = React.useMemo(() => sparklePath(0, 0, 13), [])
  const heart = React.useMemo(() => heartPath(0, 0, 13), [])
  const starRef = React.useRef(null as SVGPathElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const start = orbitPoint(0.15, 92, 30, ORBIT_TILT)

  const morphStar = (toHeart: boolean) => {
    if (!starRef.current) return
    gsap.to(starRef.current, { morphSVG: toHeart ? heart : sparkle, duration: reducedMotion() ? 0 : 0.6, ease: "back.out(2)", overwrite: "auto" })
  }

  React.useEffect(() => {
    const cv = canvasRef.current
    const host = cv && cv.parentElement
    if (!inkTrail || !cv || !host || reducedMotion()) return
    const ctx = cv.getContext("2d")
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      cv.width = Math.round(host.clientWidth * dpr)
      cv.height = Math.round(host.clientHeight * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    const pen = getComputedStyle(host).getPropertyValue("--mgn-pen").trim() || "#7d84ef"
    const LIFE = 950
    const pts = [] as { x: number; y: number; t: number; gap: boolean }[]
    let raf = 0
    const draw = () => {
      raf = 0
      const now = performance.now()
      while (pts.length && now - pts[0].t > LIFE) pts.shift()
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = pen
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]
        const b = pts[i]
        if (b.gap) continue
        const life = 1 - (now - b.t) / LIFE
        ctx.globalAlpha = clamp(life, 0, 1) * 0.9
        ctx.lineWidth = (0.5 + 2.1 * life) * dpr
        ctx.beginPath()
        ctx.moveTo(a.x * dpr, a.y * dpr)
        ctx.lineTo(b.x * dpr, b.y * dpr)
        ctx.stroke()
      }
      if (pts.length) raf = requestAnimationFrame(draw)
    }
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      const now = performance.now()
      const last = pts[pts.length - 1]
      pts.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: now, gap: !last || now - last.t > 90 })
      if (!raf) raf = requestAnimationFrame(draw)
    }
    host.addEventListener("pointermove", onMove)
    return () => {
      host.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [inkTrail])

  return (
    <Sheet info={info} className="mgn-cover">
      <SpiderParticles />
      <canvas ref={canvasRef} className="mgn-canvas" aria-hidden="true" />
      <div className="mgn-cover-in">
        <h1 className="mgn-display mgn-title" aria-label={title + " — " + name + ", " + role}>
          {chars.map((c, i) => (
            <span key={i} className="mgn-l" aria-hidden="true">
              <span className="mgn-lc">
                <span className="mgn-li">{c === " " ? " " : c}</span>
              </span>
              {i === orbitAt && (
                <span className="mgn-orbit">
                  <svg className="mgn-orbit-back mgn-ink" viewBox="-100 -100 200 200" style={{ width: "1.32em", height: "1.32em", left: "-.66em", top: "-.66em" }}>
                    <g transform="rotate(-18)">
                      <path className="mgn-draw" pathLength={1} d="M-92 0A92 30 0 0 1 92 0" />
                    </g>
                  </svg>
                  <svg className="mgn-ink" viewBox="-100 -100 200 200" style={{ width: "1.32em", height: "1.32em", left: "-.66em", top: "-.66em", zIndex: 2 }}>
                    <g transform="rotate(-18)">
                      <path className="mgn-draw" pathLength={1} d="M92 0A92 30 0 0 1 -92 0" />
                    </g>
                    <g className="mgn-star-g" transform={"translate(" + start.x.toFixed(2) + " " + start.y.toFixed(2) + ")"}>
                      <g className="mgn-star-s">
                        <path ref={starRef} d={sparkle} style={{ fill: "var(--mgn-pen)", stroke: "none" }} />
                      </g>
                    </g>
                  </svg>
                </span>
              )}
            </span>
          ))}
          <span className="mgn-sig mgn-hand" onPointerEnter={() => morphStar(true)} onPointerLeave={() => morphStar(false)}>
            <svg className="mgn-sig-arrow mgn-ink" viewBox="0 0 150 110" aria-hidden="true">
              <path className="mgn-draw" pathLength={1} d="M146 14C128 34 104 30 101 17C98 4 120 2 117 24C114 48 70 74 24 96" />
              <path className="mgn-draw" pathLength={1} d="M30 80L22 97L41 99" />
            </svg>
            <span className="mgn-write">{name}</span>
          </span>
        </h1>
        <div className="mgn-pill-wrap">
          <span className="mgn-pill">{role}</span>
        </div>
      </div>
      <div className="mgn-cover-meta">
        <span>
          {location} — {year}
        </span>
        <span className="mgn-hint" aria-hidden="true">
          scroll
          <svg viewBox="0 0 22 40" className="mgn-ink">
            <path d="M11 2c-6 6 6 10 0 16s6 10 0 18" />
            <path d="M5 31l6 7 6-7" />
          </svg>
        </span>
        <span>{docLabel}</span>
      </div>
    </Sheet>
  )
}

const TRAIT_SPOTS: { at: Pt; a: Pt; b: Pt; bend: number }[] = [
  { at: [104, 40], a: [122, 60], b: [150, 94], bend: 0.22 },
  { at: [398, 38], a: [380, 58], b: [352, 94], bend: -0.22 },
  { at: [64, 226], a: [84, 248], b: [126, 262], bend: -0.3 },
  { at: [438, 300], a: [418, 282], b: [374, 270], bend: -0.28 },
  { at: [112, 488], a: [130, 468], b: [158, 438], bend: 0.25 },
  { at: [392, 490], a: [372, 470], b: [342, 440], bend: -0.25 },
]

function Hello({ info, portrait, portraitVideo, traits, greeting, bio, name }: {
  info: SheetInfo; portrait: string; portraitVideo?: string; traits: string[]; greeting: string; bio: string; name: string
}) {
  const layer = React.useRef(null as HTMLDivElement | null)
  const pic = React.useRef(null as HTMLDivElement | null)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.playsInline = true
    const attemptPlay = () => {
      // This is the actual ASCII portrait visual, not a decorative motion layer.
      // It is muted, inline and loops; the poster remains as a no-motion fallback.
      void video.play().catch(() => undefined)
    }
    video.addEventListener("loadeddata", attemptPlay)
    video.addEventListener("canplay", attemptPlay)
    if (video.readyState >= 2) attemptPlay()
    return () => {
      video.removeEventListener("loadeddata", attemptPlay)
      video.removeEventListener("canplay", attemptPlay)
    }
  }, [portraitVideo])
  const move = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || reducedMotion()) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - r.left) / r.width - 0.5
    const dy = (e.clientY - r.top) / r.height - 0.5
    gsap.to(layer.current, { x: dx * 18, y: dy * 14, duration: 0.8, ease: "power3.out", overwrite: "auto" })
    gsap.to(pic.current, { x: -dx * 8, y: -dy * 6, duration: 0.8, ease: "power3.out", overwrite: "auto" })
  }
  const leave = () => gsap.to([layer.current, pic.current], { x: 0, y: 0, duration: 1, ease: "power3.out", overwrite: "auto" })
  const list = traits.slice(0, TRAIT_SPOTS.length)
  return (
    <Sheet info={info}>
      <div className="mgn-two">
        <div className="mgn-traits" data-ink onPointerMove={move} onPointerLeave={leave}>
          <div className="mgn-portrait" ref={pic}>
            <div className="mgn-portrait-img">
              {portraitVideo ? (
                <video ref={videoRef} autoPlay muted loop playsInline preload="auto" poster="/media/ascii-art-poster.png" aria-label="Animated Miguel O’Hara-inspired ASCII artwork" disablePictureInPicture>
                  <source src={portraitVideo} type="video/webm" />
                </video>
              ) : portrait ? (
                <img src={photo(portrait, 720)} alt={name} loading="lazy" decoding="async" />
              ) : null}
            </div>
            <PenMark kind="box" seed={21} padX={10} padY={10} />
            <PenMark kind="box" seed={22} padX={16} padY={16} />
          </div>
          <div ref={layer} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <svg viewBox="0 0 500 520" className="mgn-ink" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              {list.map((_, i) => (
                <Arrow key={i} a={TRAIT_SPOTS[i].a} b={TRAIT_SPOTS[i].b} bend={TRAIT_SPOTS[i].bend} head={8} />
              ))}
            </svg>
            {list.map((t, i) => (
              <span key={i} className="mgn-trait mgn-hand" style={{ left: TRAIT_SPOTS[i].at[0] / 5 + "%", top: TRAIT_SPOTS[i].at[1] / 5.2 + "%" }}>
                <span className="mgn-write">{t}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="mgn-hello-copy">
          <Heading text={greeting} seed={10} />
          <p className="mgn-p" data-ink>
            <Marked text={bio} seed={100} />
          </p>
        </div>
      </div>
    </Sheet>
  )
}

function Education({ info, intro, education, cvUrl, cvNote }: {
  info: SheetInfo; intro: string; education: MgnEducation[]; cvUrl: string | null; cvNote: string
}) {
  return (
    <Sheet info={info}>
      <div className="mgn-edu">
        <div>
          <Heading text="Education" seed={11} />
          {intro && (
            <p className="mgn-p mgn-edu-intro mgn-muted" data-rise>
              {intro}
            </p>
          )}
          <ul className="mgn-edu-list" data-ink>
            {education.map((e, i) => (
              <li key={i} data-rise>
                <div>
                  <div className="mgn-edu-t">
                    {e.circled ? (
                      <span className="mgn-mk">
                        {e.title}
                        <PenMark kind="oval" seed={30 + i} padX={12} padY={7} />
                      </span>
                    ) : (
                      e.title
                    )}
                  </div>
                  <div className="mgn-edu-s">{[e.place, e.period].filter(Boolean).join(" · ")}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mgn-education-side">
          <figure className="mgn-edu-visual" data-rise>
            <img
              src="/media/education-dimensional-study.webp"
              alt="Original red, cobalt and ice editorial illustration of an open book leading into a dimensional archive"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <span>EDUCATION / FIELD NOTES</span>
              <span>EARTH-928 · 2026—2030</span>
            </figcaption>
          </figure>
          {cvUrl && (
            <div className="mgn-qr-wrap" data-ink>
              <a className="mgn-qr" href={cvUrl} target="_blank" rel="noreferrer" aria-label={"Open my CV: " + cvUrl}>
                <span className="mgn-qr-tag">
                  <span className="mgn-write">scan me</span>
                </span>
                <QRCode text={cvUrl} />
              </a>
              <div className="mgn-cvnote mgn-hand">
                <svg viewBox="0 0 90 60" className="mgn-ink" aria-hidden="true">
                  <Arrow a={[84, 50]} b={[10, 16]} bend={-0.3} head={9} />
                </svg>
                <span className="mgn-write">{cvNote}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  )
}

function Skills({ info, tools, toolNote, intro, skills, books, booksNote, heading }: {
  info: SheetInfo; tools: MgnTool[]; toolNote: string; intro: string; skills: string[]; books: { title: string; color: string }[]; booksNote: string; heading: string
}) {
  const [on, setOn] = React.useState(-1)
  const note = on >= 0 && tools[on] ? tools[on].name + (tools[on].note ? " — " + tools[on].note : "") : toolNote
  return (
    <Sheet info={info}>
      <div className="mgn-skills">
        <div className={"mgn-skills-top" + (books.length ? "" : " mgn-skills-top-full")}>
          <div>
            <Heading text={heading || "Skills"} seed={12} />
            <div className="mgn-tools" data-ink onPointerLeave={() => setOn(-1)}>
              {tools.map((t, i) => (
                <button
                  key={i}
                  className="mgn-tool"
                  style={{ background: t.bg, color: t.fg }}
                  data-on={on === i}
                  aria-label={t.name}
                  onPointerEnter={() => setOn(i)}
                  onFocus={() => setOn(i)}
                  onBlur={() => setOn(-1)}
                  onClick={() => setOn(i)}
                >
                  {t.mark === "figma" ? <FigmaMark /> : t.mark}
                </button>
              ))}
              <PenMark kind="oval" seed={13} padX={6} padY={6} />
            </div>
            <div className="mgn-tool-note mgn-hand" aria-live="polite">
              <span key={on} className="mgn-note-swap">
                {note}
              </span>
            </div>
          </div>
          {books.length > 0 && (
            <div className="mgn-books" data-ink>
              <BookStack books={books} />
              <div className="mgn-books-note mgn-hand">
                <span className="mgn-write">{booksNote}</span>
                <svg viewBox="0 0 60 50" className="mgn-ink" aria-hidden="true" style={{ display: "block", width: 54, height: 44, marginLeft: "auto" }}>
                  <Arrow a={[44, 4]} b={[18, 44]} bend={-0.35} head={8} />
                </svg>
              </div>
            </div>
          )}
        </div>
        <div className="mgn-skills-low">
          <div>
            <p className="mgn-p mgn-muted" data-rise>
              {intro}
            </p>
            <div className="mgn-more mgn-hand" data-ink>
              <Doodle kind="pencil" />
              <span className="mgn-write">there's plenty more in my toolkit</span>
            </div>
          </div>
          <ul className="mgn-skill-list" data-rise>
            {skills.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </Sheet>
  )
}

function Deal({ info, projects, note, onOpen, heading }: { info: SheetInfo; projects: MgnProject[]; note: string; onOpen: (i: number) => void; heading: string }) {
  return (
    <Sheet info={info} className="mgn-deal">
      <div className="mgn-deal-stage">
        <div className="mgn-deal-head">
          <div>
            <Heading text={heading || "Selected work."} seed={14} />
            <p className="mgn-project-intro mgn-p">{note}</p>
          </div>
          <span className="mgn-project-index mgn-hand">BUILD LOG / 001—006</span>
        </div>
        <TiltedProjectGrid projects={projects} onOpen={onOpen} />
      </div>
    </Sheet>
  )
}

function ProjectArtwork({ p }: { p: MgnProject }) {
  const key = p.name.toLowerCase()
  if (p.coverImage) {
    return (
      <div className={"mgn-project-realshot" + (p.coverImageFit === "contain" ? " is-contain" : "")}>
        <img
          src={p.coverImage}
          alt={p.coverImageAlt || p.name + " project image"}
          loading="lazy"
          decoding="async"
          onError={(event) => { event.currentTarget.style.display = "none" }}
        />
      </div>
    )
  }

  if (key.includes("tideprint")) {
    return (
      <svg className="mgn-project-art" viewBox="0 0 640 520" role="img" aria-label="Abstract coastal contour and tidal data illustration">
        <defs>
          <linearGradient id="tideSea" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1769AA" stopOpacity=".8"/><stop offset="1" stopColor="#071525" stopOpacity=".08"/></linearGradient>
          <linearGradient id="tideLine" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#42D8F5"/><stop offset=".58" stopColor="#1769AA"/><stop offset="1" stopColor="#F0183C"/></linearGradient>
        </defs>
        <g fill="none" stroke="#7EB7EE" strokeOpacity=".25" strokeWidth="1">
          <path d="M-20 125C75 75 116 185 216 134S372 31 660 116"/>
          <path d="M-20 155C75 105 116 215 216 164S372 61 660 146"/>
          <path d="M-20 185C75 135 116 245 216 194S372 91 660 176"/>
          <path d="M-20 215C75 165 116 275 216 224S372 121 660 206"/>
          <path d="M-20 245C75 195 116 305 216 254S372 151 660 236"/>
          <path d="M-20 275C75 225 116 335 216 284S372 181 660 266"/>
        </g>
        <path d="M0 300C82 255 110 285 165 264S248 212 294 249 385 306 444 258 559 208 640 246V520H0Z" fill="url(#tideSea)" opacity=".72"/>
        <path d="M0 354C88 309 150 350 218 325S351 263 424 311 553 352 640 292" fill="none" stroke="url(#tideLine)" strokeWidth="4" strokeLinecap="round"/>
        <path d="M0 390C112 353 178 397 251 372S371 325 450 359 564 407 640 348" fill="none" stroke="#49C7DC" strokeOpacity=".55" strokeWidth="2"/>
        <g fill="#F0183C">
          <circle cx="218" cy="325" r="5"/><circle cx="424" cy="311" r="5"/><circle cx="640" cy="292" r="5"/>
        </g>
        <g fill="#E8EEF6" fontFamily="monospace" fontSize="12" letterSpacing="2">
          <text x="34" y="56">COASTAL SIGNAL / LIVE MODEL</text>
          <text x="34" y="82" fill="#7EB7EE">TIDEPRINT · CONTOUR STUDY</text>
          <text x="34" y="466" fill="#91B5D3">SHORELINE / TIDAL DATA / FIELD NOTES</text>
        </g>
        <g stroke="#F0183C" strokeWidth="1.5" fill="none"><path d="M516 76h72v72h-72z"/><path d="M532 112h40M552 92v40"/></g>
      </svg>
    )
  }

  if (key.includes("smokepath")) {
    return (
      <svg className="mgn-project-art" viewBox="0 0 640 520" role="img" aria-label="Abstract atmospheric plume and air-quality forecast map illustration">
        <defs>
          <radialGradient id="smokePlume"><stop stopColor="#F0183C" stopOpacity=".5"/><stop offset=".55" stopColor="#1769AA" stopOpacity=".34"/><stop offset="1" stopColor="#071525" stopOpacity="0"/></radialGradient>
        </defs>
        <g stroke="#7EB7EE" strokeOpacity=".14" strokeWidth="1">
          {Array.from({length:9},(_,i)=><path key={"h"+i} d={`M0 ${105+i*38}H640`}/>)}
          {Array.from({length:12},(_,i)=><path key={"v"+i} d={`M${32+i*52} 80V450`}/>)}
        </g>
        <path d="M70 150C140 90 180 120 219 160S288 207 327 176 423 96 478 154 534 254 472 282 356 303 326 352 197 411 137 351 62 246 70 150Z" fill="url(#smokePlume)"/>
        <g fill="none" stroke="#49C7DC" strokeOpacity=".75" strokeWidth="2">
          <path d="M82 328C150 295 176 214 244 229S338 292 406 229 512 175 580 190"/>
          <path d="M80 354C149 321 187 245 250 257S345 318 421 257 516 211 582 224"/>
        </g>
        <g fill="#F0183C"><circle cx="244" cy="229" r="5"/><circle cx="406" cy="229" r="5"/><circle cx="512" cy="211" r="4"/></g>
        <g fill="#E8EEF6" fontFamily="monospace" fontSize="12" letterSpacing="2">
          <text x="34" y="48">SMOKE PATH / ATMOSPHERIC MODEL</text>
          <text x="34" y="74" fill="#7EB7EE">FORECAST WINDOW / 48H</text>
          <text x="34" y="473" fill="#91B5D3">CAMS · VIIRS · GFS · CPCB</text>
        </g>
        <g transform="translate(462 48)">
          <rect width="130" height="66" fill="#071525" stroke="#7EB7EE" strokeOpacity=".45"/>
          <text x="12" y="20" fill="#7EB7EE" fontFamily="monospace" fontSize="9">AIR SIGNAL</text>
          <text x="12" y="48" fill="#E8EEF6" fontFamily="monospace" fontSize="22">FORECAST</text>
        </g>
      </svg>
    )
  }

  if (key.includes("holistic")) {
    return (
      <svg className="mgn-project-art" viewBox="0 0 640 520" role="img" aria-label="Abstract MediaPipe pose landmarks over a camera frame">
        <g stroke="#7EB7EE" strokeOpacity=".22" fill="none">
          <rect x="54" y="60" width="532" height="392" rx="8"/>
          <path d="M54 105h28M54 105V77M586 105h-28M586 105V77M54 407h28M54 407v28M586 407h-28M586 407v28"/>
          <path d="M320 70v372M70 256h500" strokeDasharray="4 8"/>
        </g>
        <g stroke="#49C7DC" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M320 145L320 218L255 278L220 362M320 218L389 280L423 364"/>
          <path d="M320 218L276 232L239 206L215 188M320 218L364 232L402 204L428 182"/>
          <path d="M320 218L319 326L277 397M319 326L361 396"/>
        </g>
        <g fill="#F0183C" stroke="#071525" strokeWidth="2">
          {[[320,130],[320,145],[320,218],[255,278],[220,362],[389,280],[423,364],[276,232],[239,206],[215,188],[364,232],[402,204],[428,182],[319,326],[277,397],[361,396]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r={i===0?8:5}/>)}
        </g>
        <g fill="#E8EEF6" fontFamily="monospace" fontSize="12" letterSpacing="2">
          <text x="78" y="40">HOLISTIC HUMAN / LANDMARK TRACE</text>
          <text x="78" y="486" fill="#7EB7EE">CAMERA INPUT · POSE POINTS · REAL-TIME OVERLAY</text>
        </g>
      </svg>
    )
  }

  if (key.includes("pacman")) {
    return (
      <svg className="mgn-project-art" viewBox="0 0 640 520" role="img" aria-label="Original arcade maze illustration for the voice-controlled Pacman project">
        <rect x="68" y="72" width="504" height="358" rx="8" fill="#040914" stroke="#1769AA" strokeWidth="7"/>
        <g stroke="#1769AA" strokeWidth="8" fill="none" strokeLinecap="square">
          <path d="M108 110H240V158H180V206H108V330H180V382H240V332H320V382H398V330H470V382H530"/>
          <path d="M280 110H350V158H412V206H530V270H470V318H412V270H350V220H280"/>
          <path d="M108 270H170M230 270H300M340 270H410"/>
        </g>
        <g fill="#E8EEF6">
          {Array.from({length:14},(_,i)=><circle key={"a"+i} cx={112+i*31} cy="92" r="3"/>)}
          {Array.from({length:11},(_,i)=><circle key={"b"+i} cx="92" cy={126+i*26} r="3"/>)}
          {Array.from({length:10},(_,i)=><circle key={"c"+i} cx={224+i*30} cy="408" r="3"/>)}
        </g>
        <path d="M296 183a27 27 0 1 0 0 54a31 31 0 0 0 26-15a31 31 0 0 0-26-39Z" fill="#F7D842"/>
        <g fill="#F0183C"><circle cx="446" cy="167" r="13"/><circle cx="496" cy="226" r="13"/></g>
        <g fill="#E8EEF6" fontFamily="monospace" fontSize="12" letterSpacing="2">
          <text x="82" y="42">VOICE INPUT / ARCADE ENGINE</text>
          <text x="82" y="474" fill="#7EB7EE">SAY: LEFT · RIGHT · UP · DOWN</text>
        </g>
        <g transform="translate(460 340)" stroke="#49C7DC" strokeWidth="2" fill="none"><path d="M0 24Q18 0 36 24M-10 14Q18 -18 46 14M10 34Q18 26 26 34"/></g>
      </svg>
    )
  }

  if (key.includes("social distance")) {
    return (
      <svg className="mgn-project-art" viewBox="0 0 640 520" role="img" aria-label="Abstract computer-vision frame with detection boxes">
        <rect x="52" y="62" width="536" height="390" rx="8" fill="#08192C" stroke="#1769AA" strokeWidth="2"/>
        <g stroke="#7EB7EE" strokeOpacity=".18">
          {Array.from({length:12},(_,i)=><path key={"x"+i} d={`M${72+i*44} 62V452`}/>)}
          {Array.from({length:9},(_,i)=><path key={"y"+i} d={`M52 ${84+i*42}H588`}/>)}
        </g>
        <g fill="none" stroke="#49C7DC" strokeWidth="3">
          <rect x="152" y="126" width="98" height="168" rx="5"/>
          <rect x="346" y="115" width="106" height="174" rx="5"/>
        </g>
        <g fill="none" stroke="#F0183C" strokeWidth="2">
          <path d="M148 118h18M148 118v18M254 118h-18M254 118v18M342 107h18M342 107v18M456 107h-18M456 107v18"/>
          <path d="M340 300h18M340 300v-18M456 300h-18M456 300v-18"/>
        </g>
        <g fill="#E8EEF6" fontFamily="monospace" fontSize="11" letterSpacing="1.5">
          <text x="170" y="113">PERSON / 01</text>
          <text x="365" y="99">PERSON / 02</text>
          <text x="74" y="42" fontSize="12" letterSpacing="2">VISION SYSTEM / DETECTION PASS</text>
          <text x="74" y="486" fill="#7EB7EE">MASK DETECTION · SPATIAL AWARENESS</text>
        </g>
        <circle cx="201" cy="171" r="21" stroke="#49C7DC" strokeWidth="2" fill="none"/>
        <circle cx="399" cy="160" r="21" stroke="#49C7DC" strokeWidth="2" fill="none"/>
      </svg>
    )
  }

  return (
    <svg className="mgn-project-art" viewBox="0 0 640 520" role="img" aria-label={p.name + " abstract project illustration"}>
      <circle cx="320" cy="250" r="150" fill="none" stroke="#1769AA" strokeWidth="2"/>
      <circle cx="320" cy="250" r="115" fill="none" stroke="#F0183C" strokeOpacity=".6" strokeWidth="2" strokeDasharray="4 11"/>
      <text x="320" y="270" fill="#E8EEF6" textAnchor="middle" fontSize="82" fontFamily="Georgia">{p.name.slice(0,2).toUpperCase()}</text>
    </svg>
  )
}

function TiltedProjectGrid({ projects, onOpen }: { projects: MgnProject[]; onOpen: (index: number) => void }) {
  return (
    <div className="mgn-tilted-project-grid" aria-label="Selected projects">
      {projects.map((project, i) => (
        <button
          className="mgn-tilted-project-tile"
          key={project.name}
          type="button"
          onClick={() => onOpen(i)}
          aria-label={`Open ${project.name} project details`}
        >
          <span className="mgn-tilted-project-media" aria-hidden="true">
            {project.coverImage ? (
              <img src={project.coverImage} alt="" loading="lazy" decoding="async" />
            ) : (
              <ProjectArtwork p={project} />
            )}
          </span>
          <span className="mgn-tilted-project-shade" aria-hidden="true" />
          <span className="mgn-tilted-project-meta"><span>{pad2(i + 1)} / FIELD STUDY</span><span>{project.year || "ARCHIVE"}</span></span>
          <span className="mgn-tilted-project-title">{project.name}</span>
          <span className="mgn-tilted-project-kind">{project.kind}</span>
          <span className="mgn-tilted-project-open">OPEN PROJECT ↗</span>
        </button>
      ))}
    </div>
  )
}

function ProjectVisual({ p, i }: { p: MgnProject; i: number }) {
  const year = p.year || "ARCHIVE"
  return (
    <div className="mgn-project-visual" aria-label={p.name + " project visual"}>
      <div className="mgn-project-visual-hud">
        <span>EARTH-928 // PROJECT FILE</span>
        <span>00{i + 1} : {year}</span>
      </div>
      <ProjectArtwork p={p} />
      <div className="mgn-project-visual-foot">
        <span>{p.coverImage ? (p.coverImageLabel || "PUBLIC PROJECT CAPTURE") : "ORIGINAL PROJECT VISUAL / NOT A SCREENSHOT"}</span>
        <span>2099</span>
      </div>
    </div>
  )
}

function Case({ info, p, i, flip }: { info: SheetInfo; p: MgnProject; i: number; flip: boolean }) {
  const meta = [p.kind, p.year].filter(Boolean).join(" · ")
  const projectLinks = [
    p.demo ? { label: "Live demo", href: p.demo } : null,
    p.repo ? { label: "Source code", href: p.repo } : null,
    p.devpost ? { label: "Devpost", href: p.devpost } : null,
    p.devfolio ? { label: "Devfolio", href: p.devfolio } : null,
  ].filter(Boolean) as { label: string; href: string }[]
  return (
    <Sheet info={info} className="mgn-case-wrap" flip={flip}>
      <div className="mgn-case">
        <div className="mgn-case-copy">
          <div className="mgn-eyebrow mgn-hand" data-ink>
            <span className="mgn-write">{pad2(i + 1)} — {meta}</span>
          </div>
          <Heading text={p.name} seed={40 + i} className="mgn-case-title" />
          <p className="mgn-p" data-ink><Marked text={p.summary} seed={200 + i * 11} /></p>
          {p.challenge && <div className="mgn-challenge" data-ink><span className="mgn-challenge-l mgn-hand">problem space</span><span className="mgn-challenge-t">{p.challenge}</span></div>}
          {p.attribution && <p className="mgn-project-attribution">{p.attribution}</p>}
          {p.contribution && <p className="mgn-project-attribution"><strong>Contribution:</strong> {p.contribution}</p>}
          {p.stack && p.stack.length > 0 && <div className="mgn-project-stack"><span className="mgn-project-stack-label">TECH / TOOLS</span>{p.stack.map((t) => <span key={t}>{t}</span>)}</div>}
          {projectLinks.length > 0 && <div className="mgn-project-links">{projectLinks.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noreferrer">{l.label} ↗</a>)}</div>}
        </div>
        <div className="mgn-project-visual-wrap"><ProjectVisual p={p} i={i} />{p.note && <span className="mgn-project-visual-note mgn-hand">{p.note}</span>}</div>
      </div>
    </Sheet>
  )
}

function RecordsSection({ info, heading, intro, records, timeline = false }: { info: SheetInfo; heading: string; intro: string; records: MgnRecord[]; timeline?: boolean }) {
  const timelineGroups = timeline
    ? records.reduce((groups, record) => {
        const year = record.period?.match(/20\d{2}/)?.[0] || "Earlier years"
        const group = groups.find((item) => item.year === year)
        if (group) group.records.push(record)
        else groups.push({ year, records: [record] })
        return groups
      }, [] as { year: string; records: MgnRecord[] }[])
    : []

  return (
    <Sheet info={info} className="mgn-record-section">
      <div className="mgn-record-wrap">
        <div className="mgn-record-heading">
          <Heading text={heading} seed={22 + heading.length} />
          {intro && <p className="mgn-p mgn-record-intro">{intro}</p>}
          <span className="mgn-record-stamp mgn-hand">FIELD LOG / VERIFIED LINKS</span>
        </div>
        {timeline ? (
          <div className="mgn-timeline-years">
            {timelineGroups.map(({ year, records: yearRecords }) => (
              <section className="mgn-timeline-year" key={year} aria-label={`${year} experience`}>
                <h3 className="mgn-timeline-year-label">{year}</h3>
                <div className="mgn-timeline-year-records">
                  {yearRecords.map((r, i) => (
                    <details className="mgn-timeline-entry" key={r.title + i}>
                      <summary>
                        <span className="mgn-timeline-entry-copy">
                          <span className="mgn-timeline-entry-period">{r.period}</span>
                          <span className="mgn-timeline-entry-title">{r.title}</span>
                          {r.organization && <span className="mgn-timeline-entry-org">{r.organization}</span>}
                        </span>
                        <span className="mgn-timeline-entry-toggle" aria-hidden="true">+</span>
                      </summary>
                      <div className="mgn-timeline-entry-detail">
                        <span className="mgn-timeline-entry-category">{r.category || "FIELD NOTE"}</span>
                        <p>{r.description}</p>
                        {r.tags && r.tags.length > 0 && <div className="mgn-record-tags">{r.tags.map((t) => <span key={t}>{t}</span>)}</div>}
                        {r.href && <a className="mgn-record-link" href={r.href} target="_blank" rel="noreferrer">{r.linkLabel || "Open reference"} ↗</a>}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mgn-record-grid">
            {records.map((r, i) => (
              <article className="mgn-record-card" key={r.title + i}>
                {r.image && <div className="mgn-record-media"><img src={r.image} alt={r.imageAlt || r.title} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.parentElement?.remove() }} /></div>}
                <div className="mgn-record-meta"><span>{r.category || "FIELD NOTE"}</span><span>{r.period}</span></div>
                <h3>{r.title}</h3>
                {r.organization && <div className="mgn-record-org">{r.organization}</div>}
                <p>{r.description}</p>
                {r.tags && r.tags.length > 0 && <div className="mgn-record-tags">{r.tags.map((t) => <span key={t}>{t}</span>)}</div>}
                {r.href && <a className="mgn-record-link" href={r.href} target="_blank" rel="noreferrer">{r.linkLabel || "Open reference"} ↗</a>}
              </article>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  )
}

function useScrollActiveIndex<T extends HTMLElement>(count: number) {
  const containerRef = React.useRef<T>(null)
  const [active, setActive] = React.useState(0)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container || count < 2) return
    let frame = 0
    const update = () => {
      frame = 0
      const center = window.innerHeight * 0.52
      const cards = container.querySelectorAll<HTMLElement>(".mgn-scroll-card")
      let nearest = -1
      let distance = Infinity
      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect()
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) return
        const nextDistance = Math.abs(rect.top + rect.height / 2 - center)
        if (nextDistance < distance) {
          distance = nextDistance
          nearest = index
        }
      })
      if (nearest >= 0) setActive((current) => current === nearest ? current : nearest)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [count])

  return { containerRef, active }
}

function ScrollArchiveCard({ record, index, total, phase, kind }: {
  record: MgnRecord; index: number; total: number; phase: "past" | "active" | "next"; kind: string
}) {
  return (
    <article className="mgn-scroll-card" data-active={phase === "active"} data-phase={phase} data-index={pad2(index + 1)}>
      <div className="mgn-scroll-card-head"><span>{record.category || kind}</span><span>{record.period}</span></div>
      <h3>{record.title}</h3>
      {record.organization && <div className="mgn-scroll-card-org">{record.organization}</div>}
      {record.description && <p>{record.description}</p>}
      {record.tags?.length ? <div className="mgn-record-tags">{record.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
      <div className="mgn-scroll-card-bottom">
        {record.href
          ? <a className="mgn-scroll-card-link" href={record.href} target="_blank" rel="noreferrer">{record.linkLabel || "Open reference"} ↗</a>
          : <span />}
        <span className="mgn-scroll-card-number"><b>{pad2(index + 1)}</b> / {pad2(total)}</span>
      </div>
    </article>
  )
}

function ExperienceCarousel({ info, heading, intro, records }: { info: SheetInfo; heading: string; intro: string; records: MgnRecord[] }) {
  const { containerRef, active } = useScrollActiveIndex<HTMLDivElement>(records.length)
  return (
    <Sheet info={info} className="mgn-experience-section">
      <div className="mgn-experience-wrap">
        <div className="mgn-record-heading">
          <Heading text={heading} seed={22 + heading.length} />
          <p className="mgn-p mgn-record-intro">{intro}</p>
          <span className="mgn-record-stamp mgn-hand">THE JOURNEY / 2020—NOW</span>
        </div>
        <div className="mgn-scroll-archive" ref={containerRef} role="region" aria-label="Chronological experience and community timeline">
          {records.map((record, index) => <ScrollArchiveCard key={`${record.title}-${record.period}`} record={record} index={index} total={records.length} phase={index === active ? "active" : index < active ? "past" : "next"} kind="FIELD NOTE" />)}
        </div>
      </div>
    </Sheet>
  )
}

function WritingArchiveSection({ info, heading, intro, records }: { info: SheetInfo; heading: string; intro: string; records: MgnRecord[] }) {
  const { containerRef, active } = useScrollActiveIndex<HTMLDivElement>(records.length)
  return (
    <Sheet info={info} className="mgn-writing-section">
      <div className="mgn-writing-archive">
        <div className="mgn-record-heading">
          <Heading text={heading} seed={22 + heading.length} />
          {intro && <p className="mgn-p mgn-record-intro">{intro}</p>}
          <span className="mgn-record-stamp mgn-hand">READ / LISTEN / EXPLORE</span>
        </div>
        <div className="mgn-scroll-archive" ref={containerRef} role="region" aria-label="Writing and media archive">
          {records.map((record, index) => <ScrollArchiveCard key={`${record.title}-${record.period}`} record={record} index={index} total={records.length} phase={index === active ? "active" : index < active ? "past" : "next"} kind="ARTICLE / MEDIA" />)}
        </div>
      </div>
    </Sheet>
  )
}

function Facts({ info, facts, note, heading }: { info: SheetInfo; facts: MgnFact[]; note: string; heading: string }) {
  return (
    <Sheet info={info}>
      <div className="mgn-facts">
        <div className="mgn-facts-head">
          {note ? (
            <div className="mgn-facts-note mgn-hand" data-ink>
              <span className="mgn-write">{note}</span>
              <svg viewBox="0 0 70 50" className="mgn-ink" aria-hidden="true">
                <Arrow a={[6, 4]} b={[60, 44]} bend={0.3} head={8} />
              </svg>
            </div>
          ) : (
            <span />
          )}
          <Heading text={heading || "Off the keyboard."} seed={15} />
        </div>
        <div className="mgn-fact-grid">
          {facts.map((f, i) => (
            <article className="mgn-fact" key={i} data-ink>
              <span className="mgn-fact-index">{pad2(i + 1)} / {f.label || "PERSONAL INTEREST"}</span>
              <span className="mgn-fact-t mgn-hand">
                <span className="mgn-write">{f.text}</span>
              </span>
            </article>
          ))}
        </div>
      </div>
    </Sheet>
  )
}


function SocialMark({ label }: { label: string }) {
  const key = label.toLowerCase().replace(/[^a-z]/g, "");
  const common = { viewBox: "0 0 24 24", "aria-hidden": true as const, focusable: false as const };
  switch (key) {
    case "github":
      return <svg {...common}><path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.1c-3.1.68-3.76-1.32-3.76-1.32-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.7 1.15 1.7 1.15.99 1.69 2.6 1.2 3.23.91.1-.72.39-1.2.7-1.48-2.48-.28-5.08-1.24-5.08-5.52 0-1.22.44-2.21 1.15-2.99-.12-.29-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.1-1.44 3.04-1.14 3.04-1.14.61 1.53.23 2.66.12 2.95.71.78 1.14 1.77 1.14 2.99 0 4.29-2.6 5.23-5.09 5.51.4.35.75 1.02.75 2.06v3.1c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"/></svg>;
    case "x":
      return <svg {...common}><path d="M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.9-7.04L5.88 22H2.74l7.25-8.29L2.4 2h6.4l4.43 6.4L18.9 2Zm-1.1 18h1.73L7.86 3.9H6.02L17.8 20Z"/></svg>;
    case "linkedin":
      return <svg {...common}><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z"/></svg>;
    case "devpost":
      return <svg {...common}><path d="M4 2.5h9.2c5.1 0 8.8 3.8 8.8 9.5s-3.7 9.5-8.8 9.5H4V2.5Zm5 4.2v10.6h4.2c2.4 0 3.9-2 3.9-5.3s-1.5-5.3-3.9-5.3H9Z"/></svg>;
    case "devfolio":
      return <svg {...common} viewBox="0 0 60.3 66.2"><path fill="#E8EEF6" d="M60.3,36.4C60.3,52,48.6,64.7,33.8,66c0,0-19.1,0.5-25.4-0.1c-2.4-0.3-4.4-1.8-5.3-4c0.9,0.4,1.8,0.7,2.8,0.8C8,62.9,11.5,63,16.4,63c7.2,0,15.1-0.2,15.1-0.2h0.1c7.9-0.7,15.2-4.3,20.4-10.2c4.5-5,7.4-11.3,8.2-17.9C60.3,35.2,60.3,35.8,60.3,36.4z"/><path fill="#E8EEF6" d="M58,30c0,15.6-11.7,28.3-26.6,29.5c0,0-19.1,0.5-25.4-0.1c-3.4-0.3-5.9-3.5-6-7.1l0.1-45c0.1-3.6,2.7-6.8,6.1-7.1c6.3-0.5,25.4,0.1,25.4,0.1C46.4,1.6,58,14.4,58,30z"/></svg>;
    case "devto":
      return <svg {...common}><path d="M3 3h18v18H3V3Zm3.1 5.1v7.8h2.4c2.1 0 3.3-1.3 3.3-3.9s-1.2-3.9-3.3-3.9H6.1Zm1.9 1.6h.4c1 0 1.5.7 1.5 2.3s-.5 2.3-1.5 2.3H8V9.7Zm5.2-1.6v7.8h4.9v-1.6h-3v-1.6h2.7v-1.6h-2.7V9.7h3V8.1h-4.9Z"/></svg>;
    case "sessionize":
      return <svg {...common}><path d="M12 1.4 21.2 6v12L12 22.6 2.8 18V6L12 1.4Zm0 3.1L5.7 7.7v8.6l6.3 3.2 6.3-3.2V7.7L12 4.5Zm3.2 5.2c-.8-.6-1.7-.9-2.8-.9-1 0-1.6.3-1.6.8 0 .4.4.6 1.8.8 2.2.3 3.3 1 3.3 2.7 0 1.8-1.5 2.9-3.7 2.9-1.5 0-2.8-.4-3.8-1.3l1.1-1.5c.8.7 1.7 1 2.7 1 1 0 1.6-.3 1.6-.8 0-.4-.4-.7-1.8-.9-2.1-.3-3.3-1-3.3-2.6 0-1.7 1.4-2.8 3.6-2.8 1.3 0 2.5.3 3.5 1l-.9 1.6Z"/></svg>;
    case "hashnode":
      return <svg {...common}><path d="M12 1.2 22.8 7v10L12 22.8 1.2 17V7L12 1.2Zm0 3.1L4.4 8.4v7.2l7.6 4.1 7.6-4.1V8.4L12 4.3Zm-4 4.1h2v3h4v-3h2v7.2h-2v-2.4h-4v2.4H8V8.4Z"/></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9"/><text x="12" y="16" textAnchor="middle" fontSize="11" fill="#071525">{label.slice(0,1).toUpperCase()}</text></svg>;
  }
}

function Thanks({ info, thanks, portrait, name, email, links, letter, signature, title, year, docLabel, onTop }: {
  info: SheetInfo; thanks: string; portrait: string; name: string; email: string; links: MgnLink[]; letter: string
  signature: string; title: string; year: string; docLabel: string; onTop: () => void
}) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = () => {
    const done = () => {
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1800)
    }
    const mail = () => {
      window.location.href = "mailto:" + email
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(email).then(done, mail)
    else mail()
  }
  const paras = letter.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
  return (
    <Sheet info={info}>
      <div className="mgn-thanks">
        <div>
          {portrait && (
            <div className="mgn-avatar" data-ink>
              <img src={photo(portrait, 320)} alt={name} loading="lazy" decoding="async" />
              <PenMark kind="oval" seed={80} padX={9} padY={9} />
            </div>
          )}
          <Heading text={thanks} seed={16} className="mgn-thanks-title" />
          {email && (
            <div className="mgn-touch">
              <b>Get in touch:</b>
              <button className="mgn-email" onClick={copy} aria-label={"Copy " + email}>
                {email}
                <PenMark kind="under" seed={81} padX={1} padY={7} />
                <span className="mgn-copied" data-on={copied} aria-live="polite">
                  {copied ? "copied!" : ""}
                </span>
              </button>
            </div>
          )}
          {links.length > 0 && (
            <div className="mgn-links">
              {links.map((l, i) => (
                <a
                  key={i}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={l.label}
                  title={l.label}
                  data-label={l.label}
                >
                  <SocialMark label={l.label} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="mgn-letter mgn-hand" data-ink>
          {paras.map((t, i) => (
            <p key={i} className="mgn-write-v">
              {t}
            </p>
          ))}
          {signature && (
            <span className="mgn-signature">
              <span className="mgn-write">{signature}</span>
              <PenMark kind="under" seed={82} padX={4} padY={9} />
            </span>
          )}
        </div>
      </div>
      <footer className="mgn-foot">
        <span>
          {title} {year}
        </span>
        <span>{docLabel}</span>
        <span className="mgn-foot-credit">Made with <span aria-label="love">❤️</span> by <a href="https://github.com/pulkitsinghdev" target="_blank" rel="noreferrer">Pulkit Singh</a></span>
        <button onClick={onTop}>
          back to top
          <svg viewBox="0 0 16 22" width="14" height="20" className="mgn-ink" aria-hidden="true">
            <path d="M8 20C6 14 10 8 8 3" />
            <path d="M3 8l5-5 5 5" />
          </svg>
        </button>
      </footer>
    </Sheet>
  )
}

function Chrome({ year, docLabel, name, items, secRef, onJump }: {
  year: string; docLabel: string; name: string; items: { id: string; label: string }[]
  secRef: React.MutableRefObject<HTMLButtonElement | null>; onJump: (id: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  React.useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])
  const groups = [
    { label: "PROFILE", ids: ["cover", "hello", "education"] },
    { label: "EXPERIENCE", ids: ["experience", "communities", "recognition"] },
    { label: "BUILD", ids: ["skills", "projects"] },
    { label: "PUBLIC", ids: ["talks", "writing"] },
    { label: "PERSONAL", ids: ["facts", "thanks"] },
  ].map((group) => ({ ...group, items: group.ids.map((id) => items.find((item) => item.id === id)).filter(Boolean) as { id: string; label: string }[] }))
    .filter((group) => group.items.length > 0)

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        secRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <div className="mgn-top" data-scrolled={scrolled}>
        <div className="mgn-bar">
          <span className="mgn-bar-year">{year}</span>
          <span className="mgn-bar-brand" aria-label={docLabel}>{docLabel}</span>
          <div className="mgn-bar-right">
            <span className="mgn-bar-name">{name}</span>
            <button
              className="mgn-bar-sec"
              ref={secRef}
              type="button"
              aria-expanded={open}
              aria-controls="mgn-field-index"
              aria-label={open ? "Close section navigation" : "Open section navigation"}
              onClick={() => setOpen((value) => !value)}
            >
              {items[0] ? items[0].label.toLowerCase() : "cover"}
            </button>
          </div>
          <span className="mgn-progress" />
        </div>
      </div>
      <div className="mgn-hold">
        <nav
          id="mgn-field-index"
          className="mgn-index"
          data-open={open}
          aria-hidden={!open}
          aria-label="Portfolio navigation"
          onClick={(event) => { if (event.target === event.currentTarget) setOpen(false) }}
        >
          <div className="mgn-index-inner">
            <div className="mgn-index-head">
              <span className="mgn-index-kicker">{docLabel} / SECTIONS</span>
              <button className="mgn-index-close" type="button" onClick={() => { setOpen(false); secRef.current?.focus() }} tabIndex={open ? 0 : -1}>
                close ×
              </button>
            </div>
            <div className="mgn-index-groups">
              {groups.map((group) => (
                <section className="mgn-index-group" key={group.label}>
                  <h2>{group.label}</h2>
                  <ol>
                    {group.items.map((item) => {
                      const index = items.findIndex((candidate) => candidate.id === item.id)
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            tabIndex={open ? 0 : -1}
                            onClick={() => {
                              setOpen(false)
                              onJump(item.id)
                            }}
                          >
                            <small>{pad2(index + 1)}</small>
                            <span className="mgn-index-link-label">{item.label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ol>
                </section>
              ))}
            </div>
            <div className="mgn-index-foot">{name} · {year} · {docLabel}</div>
          </div>
        </nav>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- portfolio */

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

export default function PulkitPortfolio(props: PulkitPortfolioProps) {
  const lenis = useLenis();
  const {
    name = DEFAULTS.name,
    role = DEFAULTS.role,
    year = DEFAULTS.year,
    location = DEFAULTS.location,
    title = DEFAULTS.title,
    docLabel = DEFAULTS.docLabel,
    portrait = DEFAULTS.portrait,
    portraitVideo,
    traits = DEFAULTS.traits,
    greeting = DEFAULTS.greeting,
    bio = DEFAULTS.bio,
    educationIntro = DEFAULTS.educationIntro,
    education = DEFAULTS.education,
    cvNote = DEFAULTS.cvNote,
    tools = DEFAULTS.tools,
    toolNote = DEFAULTS.toolNote,
    skillsIntro = DEFAULTS.skillsIntro,
    skills = DEFAULTS.skills,
    books = DEFAULTS.books,
    booksNote = DEFAULTS.booksNote,
    projectsNote = DEFAULTS.projectsNote,
    projects = DEFAULT_PROJECTS,
    experience = DEFAULTS.experience,
    communities = DEFAULT_COMMUNITIES,
    talks = DEFAULTS.talks,
    writing = DEFAULTS.writing,
    recognition = DEFAULTS.recognition,
    facts = DEFAULTS.facts,
    factsNote = DEFAULTS.factsNote,
    thanks = DEFAULTS.thanks,
    email = DEFAULTS.email,
    links = DEFAULTS.links,
    letter = DEFAULTS.letter,
    sections = DEFAULTS.sections,
    sectionTitles = {},
    inkTrail = true,
    height = "100svh",
    className,
  } = props
  const cvUrl = props.cvUrl === undefined ? DEFAULTS.cvUrl : props.cvUrl
  const signature = props.signature ?? name
  const colors = { paper: "#e8eef6", night: "#071525", ink: "#0a1a30", pen: "#f0183c", blue: "#1769aa", ...props.colors }
  const fonts = props.fonts || {}
  const fontHref = fonts.href === undefined ? DEFAULT_FONT : fonts.href
  const rootRef = React.useRef(null as HTMLDivElement | null)
  const secRef = React.useRef(null as HTMLButtonElement | null)

  // every sheet in order, with its tone; a night sheet only grows out of a card when it follows paper
  const sheets = [] as { info: SheetInfo; kind: MgnSection; i: number }[]
  let prev = ""
  const push = (kind: MgnSection, id: string, label: string, _requestedTone: "paper" | "night", i = 0) => {
    const tone: "night" = "night"
    sheets.push({ kind, i, info: { id, label, tone, morph: prev !== "night" } })
    prev = tone
  }
  for (const s of sections) {
    if (s === "cases") projects.forEach((p, i) => push("cases", "case-" + i, p.name.toLowerCase(), "night", i))
    else if (s === "projects" && projects.length) push(s, s, SECTION_LABEL[s], "night")
    else if (s === "experience" && experience.length) push(s, s, SECTION_LABEL[s], "night")
    else if (s === "communities" && communities.length) push(s, s, SECTION_LABEL[s], "night")
    else if (s === "talks" && talks.length) push(s, s, SECTION_LABEL[s], "night")
    else if (s === "writing" && writing.length) push(s, s, SECTION_LABEL[s], "night")
    else if (s === "recognition" && recognition.length) push(s, s, SECTION_LABEL[s], "night")
    else if (s === "facts" && facts.length) push(s, s, SECTION_LABEL[s], "night")
    else if (["education", "hello", "skills", "thanks", "cover"].includes(s)) push(s, s, SECTION_LABEL[s] || s, "night")
  }
  const animKey = sheets.map((s) => s.info.id + s.info.tone).join("|") + "|" + traits.length + "|" + facts.length + "|" + projects.length + "|" + experience.length + "|" + communities.length + "|" + talks.length + "|" + writing.length + "|" + recognition.length


  const jump = React.useCallback((id: string) => {
    const el = rootRef.current &&
      (rootRef.current.querySelector(
        '[data-sheet="' + id + '"]'
      ) as HTMLElement | null);

    if (!el) return;

    if (lenis) {
      lenis.scrollTo(el, {
        offset: -78,
        duration: 1.15,
        immediate: reducedMotion(),
      });
      return;
    }

    const y = el.getBoundingClientRect().top + window.scrollY - 78;

    if (reducedMotion()) {
      window.scrollTo(0, y);
    } else {
      gsap.to(window, {
        scrollTo: { y, autoKill: true },
        duration: 1.3,
        ease: "power3.inOut",
      });
    }
  }, [lenis]);



  const toTop = React.useCallback(() => {
    const root = rootRef.current;

    if (!root) return;

    if (lenis) {
      lenis.scrollTo(root, {
        duration: 1.6,
        immediate: reducedMotion(),
      });
      return;
    }

    const y = root.getBoundingClientRect().top + window.scrollY;

    if (reducedMotion()) {
      window.scrollTo(0, y);
    } else {
      gsap.to(window, {
        scrollTo: { y, autoKill: true },
        duration: 1.6,
        ease: "power3.inOut",
      });
    }
  }, [lenis]);


  useIso(() => {
    const root = rootRef.current
    if (!root) return
    const q = (s: string) => Array.from(root.querySelectorAll(s)) as HTMLElement[]
    // a staggered fromTo inside a timeline only pre-renders its first target, so
    // set every target's start state up front and tween from there
    const play = (tl: gsap.core.Timeline, els: ArrayLike<Element>, from: gsap.TweenVars, to: gsap.TweenVars, at?: gsap.Position) => {
      const list = Array.from(els)
      if (!list.length) return
      gsap.set(list, from)
      tl.to(list, to, at)
    }
    const W0 = "inset(-40% 100% -40% -6%)"
    const W1 = "inset(-40% -14% -40% -6%)"
    const mm = gsap.matchMedia()
    mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, (c) => {
      const motion = !!(c.conditions && c.conditions.motion)

      // Individual elements enter as they reach the viewport.
      // Nothing fades out when a visitor scrolls away; content stays crisp/readable.
      if (motion) {
        const enterFromSide = (selector: string, distance = 22) => {
          q(selector).forEach((el, i) => {
            const direction = i % 2 === 0 ? -1 : 1;
            gsap.fromTo(
              el,
              { autoAlpha: 0, y: 34, x: direction * distance },
              {
                autoAlpha: 1,
                y: 0,
                x: 0,
                duration: 0.88,
                delay: (i % 3) * 0.045,
                ease: "power3.out",
                clearProps: "opacity,visibility,transform",
                scrollTrigger: {
                  trigger: el,
                  start: "top 86%",
                  once: true,
                  invalidateOnRefresh: true,
                },
              },
            );
          });
        };

        // Split-screen chapters.
        enterFromSide(".mgn-traits", 26);
        enterFromSide(".mgn-case-copy", 24);
        enterFromSide(".mgn-project-visual-wrap", 24);
        enterFromSide(".mgn-thanks > *", 20);

        // Project tiles, timeline entries and personal-interest illustrations.
        enterFromSide(".mgn-project-tile", 28);
        enterFromSide(".mgn-tilted-project-tile", 28);
        enterFromSide(".mgn-record-card", 22);
        enterFromSide(".mgn-experience-wrap > .mgn-record-heading", 24);
        enterFromSide(".mgn-fact", 18);

        // Quiet parallax on project artwork only; text does not drift or blur.
        q(".mgn-project-visual").forEach((visual) => {
          gsap.fromTo(
            visual,
            { y: 18 },
            {
              y: -18,
              ease: "none",
              scrollTrigger: {
                trigger: visual,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.45,
                invalidateOnRefresh: true,
              },
            },
          );
        });
      }

      // where you are, and how far
      q("[data-sec]").forEach((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 40%",
          end: "bottom 40%",
          onToggle: (s) => {
            if (s.isActive && secRef.current) secRef.current.textContent = el.dataset.label || "cover"
          },
        }),
      )
      const bar = root.querySelector(".mgn-progress")
      if (bar) gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: true } })
      q(".mgn-count").forEach((el) => {
        el.textContent = formatCount(parseFloat(el.dataset.value || "0"), parseInt(el.dataset.decimals || "0", 10))
      })
      if (!motion) return

      // the cover: letters rise, the name writes itself, the pen marks follow
      const cover = root.querySelector(".mgn-cover")
      if (cover) {
        const intro = gsap.timeline({ delay: 0.15 })
        play(intro, cover.querySelectorAll(".mgn-li"), { yPercent: 118, rotate: 8 }, { yPercent: 0, rotate: 0, duration: 1.2, ease: "expo.out", stagger: 0.055 }, 0)
        play(intro, cover.querySelectorAll(".mgn-write"), { clipPath: W0 }, { clipPath: W1, duration: 1.2, ease: "power1.inOut" }, 0.6)
        play(intro, cover.querySelectorAll(".mgn-draw"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.12 }, 1)
        play(intro, cover.querySelectorAll(".mgn-pill"), { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.9, ease: "back.out(2.2)" }, 0.75)
        play(intro, cover.querySelectorAll(".mgn-cover-meta > *"), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", stagger: 0.08 }, 1.1)
        play(intro, cover.querySelectorAll(".mgn-star-s"), { scale: 0, rotate: -180, svgOrigin: "0 0" }, { scale: 1, rotate: 0, svgOrigin: "0 0", duration: 0.8, ease: "back.out(3)" }, 1.5)

        // …and drift apart as you leave
        const letters = cover.querySelectorAll(".mgn-l")
        const n = letters.length
        const out = gsap.timeline({ scrollTrigger: { trigger: cover, start: "top top", end: "bottom top", scrub: 0.6 } })
        letters.forEach((l, i) => {
          const R = rand(i + 3)
          out.to(l, { x: (i - (n - 1) / 2) * 26, y: -70 - R() * 170, rotation: (R() - 0.5) * 36, ease: "none" }, 0)
        })
        out.to(cover.querySelectorAll(".mgn-pill-wrap, .mgn-sig"), { y: -110, autoAlpha: 0, ease: "none" }, 0)
        out.to(cover.querySelectorAll(".mgn-cover-in"), { scale: 0.9, ease: "none" }, 0)
        // the star orbits its letter, dimming when it passes behind
        const star = cover.querySelector(".mgn-star-g") as SVGGElement | null
        if (star) {
          const ph = { t: 0.15 }
          const spin = gsap.to(ph, {
            t: 1.15,
            duration: 7,
            ease: "none",
            repeat: -1,
            onUpdate: () => {
              const o = orbitPoint(ph.t % 1, 92, 30, ORBIT_TILT)
              star.setAttribute("transform", "translate(" + o.x.toFixed(2) + " " + o.y.toFixed(2) + ")")
              star.style.opacity = o.front ? "1" : "0.3"
            },
          })
          ScrollTrigger.create({ trigger: cover, start: "top bottom", end: "bottom top", onToggle: (s) => (s.isActive ? spin.play() : spin.pause()) })
        }
      }

      // headings: characters rise, the underline goes from nervous to sure
      q(".mgn-hd").forEach((hd) => {
        play(
          gsap.timeline({ scrollTrigger: { trigger: hd, start: "top 88%", once: true } }),
          hd.querySelectorAll(".mgn-ci"),
          { yPercent: 118, rotate: 6 },
          { yPercent: 0, rotate: 0, duration: 1.05, ease: "expo.out", stagger: 0.035 },
        )
        const path = hd.querySelector(".mgn-morph") as SVGPathElement | null
        if (path && path.dataset.from && path.dataset.to) {
          gsap.set(path, { attr: { d: path.dataset.from } })
          gsap
            .timeline({ scrollTrigger: { trigger: hd, start: "top 90%", end: "top 30%", scrub: 0.8 } })
            .fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: "none" }, 0)
            .to(path, { morphSVG: path.dataset.to, duration: 1, ease: "none" }, 0)
        }
      })

      // the pen: every [data-ink] group writes, then draws, once
      q("[data-ink]").forEach((g) => {
        const own = (s: string) => Array.from(g.querySelectorAll(s)).filter((el) => el.closest("[data-ink]") === g)
        const writes = own(".mgn-write")
        const lines = own(".mgn-write-v")
        const strokes = own(".mgn-draw")
        const tl = gsap.timeline({ scrollTrigger: { trigger: g, start: "top 84%", once: true } })
        play(tl, lines, { clipPath: "inset(-10% -6% 100% -6%)" }, { clipPath: "inset(-10% -6% -10% -6%)", duration: 1.5, ease: "power1.inOut", stagger: 0.55 }, 0)
        play(tl, writes, { clipPath: W0 }, { clipPath: W1, duration: 0.95, ease: "power1.inOut", stagger: 0.16 }, lines.length ? ">-0.3" : 0)
        play(tl, strokes, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut", stagger: 0.1 }, lines.length ? ">-0.4" : 0.2)
      })

      // the numbers count up
      q(".mgn-count").forEach((el) => {
        const v = parseFloat(el.dataset.value || "0")
        const d = parseInt(el.dataset.decimals || "0", 10)
        const o = { v: 0 }
        el.textContent = formatCount(0, d)
        gsap.to(o, {
          v,
          duration: 1.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = formatCount(o.v, d)
          },
        })
      })

      // plain blocks rise
      const rise = q("[data-rise]")
      if (rise.length) {
        gsap.set(rise, { autoAlpha: 0, y: 36 })
        ScrollTrigger.batch(rise, {
          start: "top 92%",
          once: true,
          onEnter: (b) => gsap.to(b, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, overwrite: true }),
        })
      }

      // Shared page canvas replaces per-section card-to-full-bleed background morphs.

      // the projects: a shuffled pile deals itself into a row while the sheet holds still
      q(".mgn-deal").forEach((sec) => {
        const cards = Array.from(sec.querySelectorAll(".mgn-card")) as HTMLElement[]
        if (!cards.length) return
        const n = cards.length
        const toCentre = (el: HTMLElement, axis: "x" | "y") => {
          const row = el.parentElement as HTMLElement
          return axis === "x"
            ? row.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2)
            : row.clientHeight / 2 - (el.offsetTop + el.offsetHeight / 2)
        }
        const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "bottom bottom", scrub: 0.7, invalidateOnRefresh: true } })
        // the top card is dealt first; each tween is its own so every card starts in the pile
        cards.forEach((el, i) => {
          const o = pileOffset(i, n)
          tl.fromTo(
            el,
            { x: () => toCentre(el, "x") + o.x, y: () => toCentre(el, "y") + o.y, rotation: o.r, scale: 0.9 },
            { x: 0, y: 0, rotation: 0, scale: 1, duration: 1, ease: "power2.inOut" },
            0.25 + (n - 1 - i) * 0.14,
          )
        })
        play(tl, sec.querySelectorAll(".mgn-card-write"), { clipPath: W0 }, { clipPath: W1, duration: 0.5, stagger: 0.08, ease: "none" }, ">-0.3")
        play(tl, sec.querySelectorAll(".mgn-card-tag .mgn-draw"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.4, stagger: 0.04, ease: "none" }, "<0.1")
        tl.to({}, { duration: 0.4 })
      })

      // case studies: the side phones fan out from behind, the front one turns to face you, all parallax
      q(".mgn-case-wrap").forEach((sec) => {
        const scrub = { trigger: sec, start: "top 85%", end: "top 15%", scrub: 0.8 }
        sec.querySelectorAll(".mgn-trio-p").forEach((p) => {
          const d = parseFloat((p as HTMLElement).dataset.depth || "0.5")
          gsap.fromTo(p, { y: 80 * d }, { y: -80 * d, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.6 } })
        })
        const front = sec.querySelector('.mgn-trio-p[data-slot="1"]')
        if (front) gsap.fromTo(front, { rotationY: -40, rotationX: 12, scale: 0.86 }, { rotationY: 0, rotationX: 0, scale: 1, ease: "power2.out", scrollTrigger: scrub })
        const sides = sec.querySelectorAll('.mgn-trio-p:not([data-slot="1"])')
        sides.forEach((el, i) => gsap.fromTo(el, { xPercent: i ? -70 : 70 }, { xPercent: 0, ease: "power3.out", scrollTrigger: { ...scrub } }))
      })
    })

    let t = 0
    const refresh = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => ScrollTrigger.refresh(), 160)
    }
    const ro = new ResizeObserver(refresh)
    ro.observe(root)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh)
    window.addEventListener("load", refresh)
    return () => {
      window.clearTimeout(t)
      ro.disconnect()
      window.removeEventListener("load", refresh)
      mm.revert()
    }
  }, [animKey])

  const style = {
    "--mgn-paper": colors.paper,
    "--mgn-night": colors.night,
    "--mgn-ink": colors.ink,
    "--mgn-pen": colors.pen,
    "--mgn-blue": colors.blue,
    "--mgn-h": height,
    "--mgn-display": fonts.display || "'DM Serif Display', 'Bodoni 72', Didot, Georgia, serif",
    "--mgn-hand": fonts.hand || "Caveat, 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive",
    "--mgn-body": fonts.body || "Poppins, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  } as React.CSSProperties

  const items = sheets.filter((s) => s.kind !== "cases").map((s) => ({ id: s.info.id, label: cap(s.info.label) }))
  let caseN = 0

  return (
    <div ref={rootRef} className={"mgn-root" + (className ? " " + className : "")} style={style}>
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <style>{CSS}{REFINEMENT_CSS}{FINAL_POLISH_CSS}{SPIDER_VERSE_CSS}{REFERENCE_LED_CSS}</style>
      <Chrome year={year} docLabel={docLabel} name={name} items={items} secRef={secRef} onJump={jump} />
      {sheets.map(({ info, kind, i }) => {
        switch (kind) {
          case "cover":
            return <Cover key={info.id} info={info} title={title} name={name} role={role} year={year} location={location} docLabel={docLabel} inkTrail={inkTrail} />
          case "hello":
            return <Hello key={info.id} info={info} portrait={portrait} portraitVideo={portraitVideo} traits={traits} greeting={greeting} bio={bio} name={name} />
          case "education":
            return <Education key={info.id} info={info} intro={educationIntro} education={education} cvUrl={cvUrl} cvNote={cvNote} />
          case "experience":
            return <ExperienceCarousel key={info.id} info={info} heading={sectionTitles.experience || "The long arc."} intro="From your first community roles to technical leadership today, follow the journey one chapter at a time." records={experience} />
          case "communities":
            return <RecordsSection key={info.id} info={info} heading={sectionTitles.communities || "Communities are the multiplier."} intro="Developer groups, open-source ecosystems, hackathon programmes and the people-first work behind them." records={communities} />
          case "skills":
            return <Skills key={info.id} info={info} tools={tools} toolNote={toolNote} intro={skillsIntro} skills={skills} books={books} booksNote={booksNote} heading={sectionTitles.skills || "Skills"} />
          case "projects":
            return <Deal key={info.id} info={info} projects={projects} note={projectsNote} onOpen={(k) => jump("case-" + k)} heading={sectionTitles.projects || "Projects."} />
          case "cases":
            return <Case key={info.id} info={info} p={projects[i]} i={i} flip={caseN++ % 2 === 1} />
          case "talks":
            return <RecordsSection key={info.id} info={info} heading={sectionTitles.talks || "Talks, events & stages."} intro="Conference sessions, workshops, hackathon mentoring and community events." records={talks} />
          case "writing":
            return <WritingArchiveSection key={info.id} info={info} heading={sectionTitles.writing || "Writing & media."} intro="Technical articles, explainers and conversations from the developer ecosystem." records={writing} />
          case "recognition":
            return <RecordsSection key={info.id} info={info} heading={sectionTitles.recognition || "Recognition & milestones."} intro="Scholarships, hackathon results and community recognitions documented across my earlier work." records={recognition} />
          case "facts":
            return <Facts key={info.id} info={info} facts={facts} note={factsNote} heading={sectionTitles.facts || "Fun Facts"} />
          case "thanks":
            return (
              <Thanks key={info.id} info={info} thanks={thanks} portrait={portrait} name={name} email={email} links={links} letter={letter}
                signature={signature} title={title} year={year} docLabel={docLabel} onTop={toTop} />
            )
          default:
            return null
        }
      })}
    </div>
  )
}
