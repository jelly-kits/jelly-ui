#!/usr/bin/env node
/**
 * 文档站翻译覆盖审计。
 *
 * 口径：文档站的文案是「**中文原文即 key**」（见 demo/i18n/index.ts）——
 * 从 demo/pages/*.vue 里抽出 <DemoPage> / <DemoBlock> 的 title / description，
 * 与 demo/i18n/en-US.ts 收录的 key 比对，报告还没翻译的条目。
 *
 * 用法：
 *   node scripts/audit-i18n.mjs                  # 覆盖报告（未收进 en-US.ts 的条目逐条列出）
 *   node scripts/audit-i18n.mjs --files a.vue,b.vue   # 只查指定页面
 *   node scripts/audit-i18n.mjs --json           # 只输出抽取结果（JSON），供批量翻译用
 *   node scripts/audit-i18n.mjs --api            # 改扫 API 表说明（来自 demo/api-data.ts），按组件汇总
 *   node scripts/audit-i18n.mjs --api --json     # 输出 API 待翻清单（JSON），供批量翻译用
 *
 * 说明：未翻译的条目在页面上会**回落中文原文**，所以缺失不影响运行，
 * 这个脚本只用来量「翻了多少」。翻译全部完成后缺失应为 0。
 * API 表的说明文字由 gen-api.mjs 从组件 JSDoc 生成，渲染在 demo 侧、同样走 t() 覆盖层，
 * 所以这一模式量的是「API 说明翻了多少」，**不需要改组件源码**。
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const PAGES_DIR = 'demo/pages'
const LOCALE_FILE = 'demo/i18n/en-US.ts'
const API_FILE = 'demo/api-data.ts'

const argv = process.argv.slice(2)
const asJson = argv.includes('--json')
const asApi = argv.includes('--api')
const filesFlag = argv.indexOf('--files')
const only = filesFlag >= 0 ? argv[filesFlag + 1].split(',').map((s) => s.trim()) : null

/** 扫出 <DemoPage>/<DemoBlock> 的开始标签（按引号感知找 `>`，防止属性值里出现 `>` 被截断） */
function openingTags(source) {
  const out = []
  const re = /<(DemoPage|DemoBlock)\b/g
  let m
  while ((m = re.exec(source))) {
    let i = re.lastIndex
    let quote = null
    for (; i < source.length; i += 1) {
      const ch = source[i]
      if (quote) {
        if (ch === quote) quote = null
        continue
      }
      if (ch === '"' || ch === "'") {
        quote = ch
        continue
      }
      if (ch === '>') break
    }
    out.push({ tag: m[1], attrs: source.slice(re.lastIndex, i) })
    re.lastIndex = i + 1
  }
  return out
}

const ATTR = (key) => new RegExp(`(?:^|\\s)${key}="([^"]*)"`)

/**
 * 解码属性值里的 HTML 实体。
 * `@vue/compiler-sfc` 会在编译期把 `&quot;` 还原成真双引号，所以运行时 t() 收到的
 * key 是解码后的文本；抽取时必须做同一层解码，否则审计通过而运行时回落中文原文。
 */
function decodeEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function extract(source) {
  const found = []
  for (const { tag, attrs } of openingTags(source)) {
    for (const key of ['title', 'description']) {
      const hit = ATTR(key).exec(attrs)
      const text = hit?.[1] && decodeEntities(hit[1]).trim()
      if (text) found.push({ tag, key, text })
    }
  }
  return found
}

/** 还原 JS 字符串字面量里的转义（\' \\ \n …），让读回的 key 与运行时一致 */
function unescapeJs(text) {
  return text.replace(/\\(.)/g, (_, ch) => (ch === 'n' ? '\n' : ch === 't' ? '\t' : ch))
}

/** 从 en-US.ts 里读回已收录的 key（扁平对象，逐行取 `key:`） */
function collectKeys(source) {
  const keys = new Set()
  for (const line of source.split('\n')) {
    const text = line.trim()
    if (!text || text.startsWith('//') || text.startsWith('*') || text.startsWith('/*')) continue
    const quoted = /^'((?:[^'\\]|\\.)*)'\s*:/.exec(text)
    const bare = /^([^\s:'"{}][^:'"]*?)\s*:\s*['"]/.exec(text)
    const key = quoted?.[1] !== undefined ? unescapeJs(quoted[1]) : bare?.[1]
    if (key) keys.add(key)
  }
  return keys
}

const API_GROUPS = ['attributes', 'events', 'slots', 'exposes']

/**
 * 从生成物 demo/api-data.ts 里取出 componentApi 对象字面量并 JSON.parse。
 * 生成器用 JSON.stringify 输出（双引号 + 无尾逗号），所以按大括号配对切片后可直接 parse；
 * 不能整文件求值 —— 后面还跟着 pageApi / pageSource 两个 `export const`，会变成语法错误。
 */
function loadComponentApi() {
  const source = readFileSync(API_FILE, 'utf8')
  const anchor = source.indexOf('export const componentApi')
  if (anchor < 0) throw new Error(`在 ${API_FILE} 里找不到 componentApi`)
  const start = source.indexOf('{', anchor)
  let depth = 0
  let quote = null
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i]
    if (quote) {
      if (ch === '\\') i += 1
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return JSON.parse(source.slice(start, i + 1))
    }
  }
  throw new Error(`在 ${API_FILE} 里没找到 componentApi 的结束括号`)
}

/** 拍平成「组件 / 分组 / 条目名 / 说明文字」四元组，只留有说明的条目 */
function collectApiRows(api) {
  const rows = []
  for (const [component, groups] of Object.entries(api)) {
    for (const group of API_GROUPS) {
      for (const row of groups[group] ?? []) {
        const text = (row.description ?? '').trim()
        if (text) rows.push({ component, group, name: row.name, text })
      }
    }
  }
  return rows
}

if (asApi) {
  const rows = collectApiRows(loadComponentApi())
  const keys = collectKeys(readFileSync(LOCALE_FILE, 'utf8'))
  const unique = new Set(rows.map((row) => row.text))
  const missingRows = rows.filter((row) => !keys.has(row.text))
  const missingUnique = [...new Set(missingRows.map((row) => row.text))]

  if (asJson) {
    // 按组件 / 分组组织待翻清单；同一句说明只出现一次（key 就是这句原文，重复会写出重复 key）
    const byComponent = {}
    const seen = new Set()
    for (const row of missingRows) {
      if (seen.has(row.text)) continue
      seen.add(row.text)
      if (!byComponent[row.component]) byComponent[row.component] = {}
      const entry = byComponent[row.component]
      if (!entry[row.group]) entry[row.group] = []
      entry[row.group].push(row.text)
    }
    process.stdout.write(
      JSON.stringify(
        {
          total: rows.length,
          unique: unique.size,
          covered: unique.size - missingUnique.length,
          missing: missingUnique.length,
          byComponent,
        },
        null,
        2,
      ),
    )
    process.exit(0)
  }

  console.log(`扫描 ${new Set(rows.map((row) => row.component)).size} 个组件的 API，共 ${rows.length} 条说明（去重后 ${unique.size} 条）`)
  console.log(`已收录 ${unique.size - missingUnique.length} 条，缺失 ${missingUnique.length} 条`)

  const perComponent = new Map()
  for (const row of rows) {
    if (!perComponent.has(row.component)) perComponent.set(row.component, { total: 0, missing: 0 })
    const stat = perComponent.get(row.component)
    stat.total += 1
    if (!keys.has(row.text)) stat.missing += 1
  }
  const pending = [...perComponent.entries()]
    .filter(([, stat]) => stat.missing > 0)
    .sort((a, b) => b[1].missing - a[1].missing)
  if (pending.length) {
    console.log('\n按组件（缺失 / 总行数）：')
    for (const [component, stat] of pending) console.log(`  ${component.padEnd(24)} ${stat.missing} / ${stat.total}`)
    console.log('\n逐条待翻清单：node scripts/audit-i18n.mjs --api --json')
  }
  // 有缺失即视为失败，供 CI 当闸门；--json 模式（上面）保持 exit 0，便于管道消费
  process.exit(missingUnique.length ? 1 : 0)
}

const pages = readdirSync(PAGES_DIR)
  .filter((name) => name.endsWith('.vue'))
  .filter((name) => !only || only.includes(`${PAGES_DIR}/${name}`) || only.includes(name))

const byFile = {}
for (const name of pages) {
  const path = join(PAGES_DIR, name)
  const found = extract(readFileSync(path, 'utf8'))
  if (found.length) byFile[path] = found
}

if (asJson) {
  const plain = {}
  for (const [path, found] of Object.entries(byFile)) plain[path] = found.map((item) => item.text)
  process.stdout.write(JSON.stringify(plain, null, 2))
  process.exit(0)
}

const keys = collectKeys(readFileSync(LOCALE_FILE, 'utf8'))
const missing = []
let total = 0
for (const [path, found] of Object.entries(byFile)) {
  const gap = found.filter((item) => !keys.has(item.text))
  total += found.length
  if (gap.length) missing.push({ path, gap })
}

const missingCount = missing.reduce((sum, item) => sum + item.gap.length, 0)
console.log(`扫描 ${Object.keys(byFile).length} 个页面，共 ${total} 条文案`)
console.log(`已收录 ${total - missingCount} 条，缺失 ${missingCount} 条`)
for (const { path, gap } of missing) {
  console.log(`\n${path}（缺 ${gap.length}）`)
  for (const item of gap) console.log(`  ${item.tag}.${item.key}: ${item.text}`)
}

// 有缺失即非零退出，供 CI 当闸门（本地手动跑只是多一个提示）
if (missingCount) process.exitCode = 1
