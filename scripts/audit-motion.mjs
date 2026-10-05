/*
 * 减弱动效审计：找出「@media (prefers-reduced-motion: reduce) 块里的 transition: none
 * 会被更高特异性的状态规则反压」的组件（AGENTS 陷阱 5）。
 *
 * 判据不是「有没有写状态类」这种启发式，而是实际的层叠比较：
 * 对每条声明了 transition 的规则 T，若 reduced 块里存在**同一元素**（终端复合选择器相同）
 * 的选择器 R，且 T 的特异性高于 R 中该元素的最高特异性，则在减弱动效下 T 仍会生效 → 报缺陷。
 *
 * 用法（在项目根目录）：node scripts/audit-motion.mjs
 * 退出码：有缺陷为 1，否则 0（可用于 CI）。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = 'src/components'

const walk = (dir) => {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (full.endsWith('.vue')) out.push(full)
  }
  return out
}

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const parseBlock = (text, media, rules) => {
  let i = 0
  let prelude = ''
  while (i < text.length) {
    const ch = text[i]
    if (ch === '{') {
      let depth = 1
      let j = i + 1
      while (j < text.length && depth > 0) {
        if (text[j] === '{') depth++
        else if (text[j] === '}') depth--
        j++
      }
      const inner = text.slice(i + 1, j - 1)
      const sel = prelude.trim()
      if (sel.startsWith('@media')) parseBlock(inner, sel.slice(6).trim(), rules)
      else if (!sel.startsWith('@')) rules.push({ selector: sel, body: inner, media })
      prelude = ''
      i = j
    } else if (ch === '}') {
      prelude = ''
      i++
    } else {
      prelude += ch
      i++
    }
  }
  return rules
}

const spec = (sel) => {
  const ids = (sel.match(/#[\w-]+/g) || []).length
  const classes =
    (sel.match(/\.[\w-]+/g) || []).length +
    (sel.match(/\[[^\]]+\]/g) || []).length +
    (sel.match(/:(?!:)[\w-]+/g) || []).length
  const els = (sel.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length
  return [ids, classes, els]
}
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

// 取「终端复合选择器」作为元素标识：去掉伪类/属性后剩下的类名与标签
const keyOf = (sel) => {
  const parts = sel.split(/\s*[>+~]\s*|\s+/).filter(Boolean)
  const last = parts[parts.length - 1] || ''
  return last.replace(/:{1,2}[\w-]+(\([^)]*\))?/g, '').replace(/\[[^\]]*\]/g, '').trim()
}

const splitSelectors = (sel) =>
  sel
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const files = walk(root)
const findings = []
const infos = []

for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const styleMatches = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
  if (!styleMatches.length) continue
  const rules = []
  styleMatches.forEach((m) => parseBlock(stripComments(m[1]), '', rules))

  const reduced = rules.filter((r) => r.media.includes('prefers-reduced-motion'))
  if (!reduced.length) continue

  const reducedSel = reduced.flatMap((r) => splitSelectors(r.selector)).map((s) => ({ sel: s, spec: spec(s), key: keyOf(s) }))
  const reducedKeys = new Set(reducedSel.map((r) => r.key))

  // 所有「真的在做过渡」的规则
  const animated = rules
    .filter((r) => !r.media.includes('prefers-reduced-motion'))
    .flatMap((r) => splitSelectors(r.selector).map((s) => ({ sel: s, body: r.body })))
    .filter((r) => /transition\s*:/.test(r.body) && !/transition\s*:\s*none/.test(r.body))
    .map((r) => ({ ...r, spec: spec(r.sel), key: keyOf(r.sel) }))

  // 元素被 reduced 块点名了，但 reduced 块里该元素的最高特异性仍低于这条过渡规则 → transition: none 会被反压
  const maxReducedSpec = (key) =>
    reducedSel.filter((r) => r.key === key).reduce((best, r) => (cmp(r.spec, best) > 0 ? r.spec : best), [-1, -1, -1])
  const beaten = animated.filter((a) => reducedKeys.has(a.key) && cmp(a.spec, maxReducedSpec(a.key)) > 0)
  if (beaten.length) {
    findings.push({ file, beaten: [...new Set(beaten.map((b) => b.sel))] })
    continue
  }

  // 仅提示：有过渡但压根没被 reduced 块提到的元素
  const unmentioned = animated.filter((a) => !reducedKeys.has(a.key)).map((a) => a.sel)
  if (unmentioned.length) infos.push({ file, unmentioned: [...new Set(unmentioned)] })
}

console.log('=== 缺陷：reduced-motion 块被更高特异性的状态规则反压 ===')
if (!findings.length) console.log('（无）')
for (const f of findings) {
  console.log(`\n${f.file}`)
  for (const s of f.beaten) console.log(`   ${s}`)
}
console.log('\n=== 提示：有过渡但未被 reduced-motion 块提及的元素（多为 hover/active 反馈，通常无需处理） ===')
for (const i of infos) {
  console.log(`\n${i.file}`)
  for (const s of i.unmentioned) console.log(`   ${s}`)
}
console.log(`\n共扫描 ${files.length} 个组件文件；缺陷 ${findings.length} 个，提示 ${infos.length} 个。`)
if (findings.length) process.exitCode = 1
