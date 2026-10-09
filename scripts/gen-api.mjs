/**
 * 从组件源码自动提取 API（属性 / 事件 / 插槽 / 可调用函数），生成 demo/api-data.ts。
 *
 * 用法：node scripts/gen-api.mjs
 *
 * 提取逻辑本身在 scripts/api-extract.mjs，与 uni 版生成脚本共用；
 * 本文件只负责「扫目录 → 把路由与组件对上 → 写文件」。
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { collectTypeSources, extractApi, scriptOf } from './api-extract.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const COMPONENTS_DIR = join(ROOT, 'src', 'components')
const DEMO_DIR = join(ROOT, 'demo')
const OUT_FILE = join(DEMO_DIR, 'api-data.ts')

/** 少数页面名与组件名对不上，或一个页面覆盖多个目录的组件时，单独兜底 */
const PAGE_OVERRIDES = {
  Layout: ['JeRow', 'JeCol'],
  Container: ['JeContainer', 'JeHeader', 'JeAside', 'JeMain', 'JeFooter'],
  Button: ['JeButton', 'JeButtonGroup'],
}

const read = (path) => readFileSync(path, 'utf8')

/** 扫描 src/components/<Dir>/<Name>.vue，拿到组件清单与各自的 API */
const collectComponents = () => {
  const list = []
  // 目录枚举顺序与平台 / 文件系统有关（Windows 恰好是字典序，Linux 是 hash 序），
  // 不显式排序的话，同一份源码在 CI 上重跑会生成键顺序不同的 demo/api-data.ts，
  // git diff 同步校验会误报「与组件源码不同步」。
  for (const dir of readdirSync(COMPONENTS_DIR).sort()) {
    const dirPath = join(COMPONENTS_DIR, dir)
    if (!statSync(dirPath).isDirectory()) continue
    for (const file of readdirSync(dirPath).sort()) {
      if (!file.endsWith('.vue')) continue
      const source = read(join(dirPath, file))
      const nameMatch = /defineOptions\(\{\s*name:\s*'([^']+)'/.exec(source)
      list.push({
        name: nameMatch ? nameMatch[1] : file.replace(/\.vue$/, ''),
        dir,
        api: extractApi(source, collectTypeSources(scriptOf(source), dirPath)),
      })
    }
  }
  return list
}

/** 解析 demo/router.ts，拿到 路由 path → 页面文件名 */
const collectRoutes = () => {
  const routerSource = read(join(DEMO_DIR, 'router.ts'))
  const importMap = {}
  for (const match of routerSource.matchAll(/import\s+(\w+)\s+from\s+'\.\/pages\/([\w.-]+)'/g)) {
    importMap[match[1]] = match[2]
  }
  const routes = []
  // 路由对象可能是单行（component: X }），也可能跨行（component: X, 换行 }），
  // 所以 `component` 与闭合花括号之间要允许一个可选逗号
  for (const match of routerSource.matchAll(
    /\{\s*path:\s*'([^']+)'[^}]*component:\s*(\w+)\s*,?\s*\}/g,
  )) {
    routes.push({ path: match[1], file: importMap[match[2]] })
  }
  return routes
}

const components = collectComponents()
const componentByName = new Map(components.map((item) => [item.name, item]))
const allNames = components.map((item) => item.name)

/** je-auto-complete → JeAutoComplete；已是 PascalCase 的原样返回 */
const pascalTag = (tag) =>
  tag.includes('-')
    ? tag
        .split('-')
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
        .join('')
    : tag

/** 页面名 → 主组件名：先精确匹配 Je<页面名>，再退化到前缀匹配 */
const mainComponentOf = (base) => {
  if (allNames.includes(`Je${base}`)) return `Je${base}`
  return (
    allNames
      .filter((name) => name.startsWith(`Je${base}`))
      .sort((a, b) => a.length - b.length)[0] ?? ''
  )
}

const pageApi = {}
const pageSource = {}
for (const route of collectRoutes()) {
  if (!route.file) continue
  pageSource[route.path] = route.file

  const base = route.file.replace(/Page\.vue$/, '')
  const pageText = read(join(DEMO_DIR, 'pages', route.file))
  // 页面上写的是 kebab 标签（je-tab-pane），换算成组件名（JeTabPane）才能和 defineOptions 对上
  const used = new Set(
    [...pageText.matchAll(/<([a-zA-Z][\w-]*)/g)]
      .map((match) => pascalTag(match[1]))
      .filter((name) => name.startsWith('Je')),
  )

  let names = PAGE_OVERRIDES[base]
  if (!names) {
    const main = mainComponentOf(base)
    if (!main) {
      pageApi[route.path] = []
      continue
    }
    // 同一目录下的子组件（如 JeTabs / JeTabPane）在页面上用到才一并展示
    const dir = componentByName.get(main).dir
    const siblings = components
      .filter((item) => item.dir === dir && item.name !== main && used.has(item.name))
      .map((item) => item.name)
    names = [main, ...siblings]
  }

  pageApi[route.path] = names.filter((name) => componentByName.has(name))
}

const referenced = new Set(Object.values(pageApi).flat())
const componentApi = {}
for (const name of allNames) {
  if (referenced.has(name)) componentApi[name] = componentByName.get(name).api
}

const output = `/**
 * 本文件由 scripts/gen-api.mjs 自动生成，请勿手动修改。
 * 重新生成：npm run gen:api
 */

/** 一行 API 记录，四个分组共用 */
export interface ApiRow {
  name: string
  /** 说明：组件源码里的 JSDoc 优先，没写时取 scripts/api-glossary.mjs 的通用说明 */
  description?: string
  /** 类型签名 */
  type?: string
  /** 默认值，仅属性有 */
  default?: string
}

export interface ComponentApi {
  attributes: ApiRow[]
  events: ApiRow[]
  slots: ApiRow[]
  exposes: ApiRow[]
}

/** 组件名 → API */
export const componentApi: Record<string, ComponentApi> = ${JSON.stringify(componentApi, null, 2)}

/** 路由 path → 该页要展示 API 的组件名（顺序即展示顺序） */
export const pageApi: Record<string, string[]> = ${JSON.stringify(pageApi, null, 2)}

/** 路由 path → 页面源文件名，示例代码框据此读取源码 */
export const pageSource: Record<string, string> = ${JSON.stringify(pageSource, null, 2)}
`

writeFileSync(OUT_FILE, output, 'utf8')
const rowCount = Object.values(componentApi).reduce(
  (total, api) =>
    total + api.attributes.length + api.events.length + api.slots.length + api.exposes.length,
  0,
)
console.log(
  `已生成 demo/api-data.ts：${Object.keys(componentApi).length} 个组件、${rowCount} 条 API、${Object.keys(pageApi).length} 条路由映射`,
)
