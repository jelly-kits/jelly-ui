/**
 * 从组件源码自动提取 API（属性 / 事件 / 插槽 / 可调用函数），生成 demo/api-data.ts。
 *
 * 用法：node scripts/gen-api.mjs
 *
 * 只依赖已有的 typescript（devDependency），不引入任何新依赖。
 * 组件统一的写法（defineProps<{}> / withDefaults / defineEmits<{}> / defineExpose）是提取的前提。
 * props 既支持内联类型字面量，也支持 defineProps<JeXxxProps>() 引用同目录 types.ts 里的接口。
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import ts from 'typescript'
import {
  describeAttribute,
  describeEvent,
  describeExpose,
  describeSlot,
} from './api-glossary.mjs'

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

/** 取 <script> 内容；本仓库每个组件只有一个 script 块 */
const scriptOf = (source) => {
  const match = /<script[^>]*>([\s\S]*)<\/script>/.exec(source)
  return match ? match[1] : ''
}

/** 取根 <template> 内容：模板里会嵌套 <template>，所以取最后一个闭合标签 */
const templateOf = (source) => {
  const start = source.indexOf('<template>')
  const end = source.lastIndexOf('</template>')
  return start === -1 || end === -1 ? '' : source.slice(start + '<template>'.length, end)
}

/** 往左跳过空白找紧邻的块注释，用作该成员的说明文案 */
const leadingComment = (text, pos) => {
  let index = pos - 1
  while (index >= 0 && /\s/.test(text[index])) index -= 1
  if (index < 1 || text[index] !== '/' || text[index - 1] !== '*') return ''
  const close = index + 1
  const open = text.lastIndexOf('/*', close)
  if (open === -1) return ''
  // close - 2 是为了把收尾的 * 一并切掉，只留注释正文
  return text
    .slice(open + 2, close - 2)
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trimEnd())
    .join('\n')
    .trim()
}

const propertyName = (node, sourceFile) => {
  const name = node.name
  if (!name) return ''
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text
  }
  return name.getText(sourceFile)
}

/**
 * 取紧邻 slot / 成员的那一段 HTML 注释。
 *
 * 这里不用 /<!--([\s\S]*?)-->\s*$/ 去匹配一个固定窗口：注释正文里出现的 `>`
 * （比如「列上写了 prop 时插槽名为 header-<prop>」）会让窗口里的第一个 `<!--`
 * 一路配到最后一个 `-->`，把中间的内容一起吞进说明里。改成先定位注释结尾，
 * 再向前找对应的 `<!--`，结果才是真正的那一段。
 */
const adjacentComment = (text, pos, skipWithSlot = false) => {
  let end = pos
  for (let guard = 0; guard < 20; guard += 1) {
    let cursor = end - 1
    while (cursor >= 0 && /\s/.test(text[cursor])) cursor -= 1
    if (cursor < 2 || text[cursor] !== '>' || text[cursor - 1] !== '-' || text[cursor - 2] !== '-') {
      return ''
    }
    const open = text.lastIndexOf('<!--', cursor)
    if (open === -1) return ''
    const body = text.slice(open + 4, cursor - 2)
    // 注释和当前 slot 之间还夹着别的 <slot>，说明这段注释是写给那个插槽的
    if (!skipWithSlot || !body.includes('<slot')) return body.trim()
    end = open
  }
  return ''
}

/**
 * 收集一个语法树里的 interface / type 字面量声明，供 defineProps<JeXxxProps>() 这种「引用外部接口」
 * 的写法跨文件解析。返回值带上成员所属的 sourceFile 与源文本，因为 JSDoc 与类型文本都得按
 * 各自所在文件来读。
 */
const collectTypeDecls = (sourceFile, text) => {
  const decls = new Map()
  const record = (name, members) => decls.set(name, { members, sourceFile, text })
  const visit = (node) => {
    if (ts.isInterfaceDeclaration(node)) {
      record(node.name.text, node.members)
    } else if (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)) {
      record(node.name.text, node.type.members)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return decls
}

/** 组件的 props 类型通常放在同目录的 types.ts，按脚本里的相对 import 把它读出来备用 */
const collectTypeSources = (script, dirPath) => {
  const sources = []
  for (const match of script.matchAll(/from\s+'(\.[^']*)'/g)) {
    const target = join(dirPath, `${match[1]}.ts`)
    if (existsSync(target)) sources.push(read(target))
  }
  return sources
}

/** 解析单个 .vue，返回 { attributes, events, slots, exposes } */
const extractApi = (source, typeSources = []) => {
  const script = scriptOf(source)
  const template = templateOf(source)
  const sourceFile = ts.createSourceFile(
    'component.ts',
    script,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )

  // 组件内联声明的接口优先，其次是 ./types 等相对依赖里的
  const typeDecls = collectTypeDecls(sourceFile, script)
  for (const text of typeSources) {
    const file = ts.createSourceFile('types.ts', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    for (const [name, decl] of collectTypeDecls(file, text)) {
      if (!typeDecls.has(name)) typeDecls.set(name, decl)
    }
  }

  const attributes = []
  const events = []
  const exposes = []
  const defaults = new Map()

  const collectProps = (call) => {
    const typeArg = call.typeArguments?.[0]
    if (!typeArg) return
    // 两种写法：内联字面量 defineProps<{ offset?: number }>()，或引用外部接口 defineProps<JeAffixProps>()
    const resolved = ts.isTypeLiteralNode(typeArg)
      ? { members: typeArg.members, sourceFile, text: script }
      : ts.isTypeReferenceNode(typeArg)
        ? typeDecls.get(typeArg.typeName.getText(sourceFile))
        : undefined
    if (!resolved) return
    for (const member of resolved.members) {
      if (!ts.isPropertySignature(member)) continue
      const name = propertyName(member, resolved.sourceFile)
      if (!name) continue
      attributes.push({
        name,
        description:
          leadingComment(resolved.text, member.getStart(resolved.sourceFile)) ||
          describeAttribute(name),
        type: member.type ? member.type.getText(resolved.sourceFile) : undefined,
      })
    }
  }

  const collectDefaults = (literal) => {
    for (const prop of literal.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const text = prop.initializer.getText(sourceFile)
        // `default: undefined` 与「不给默认值」语义等价 —— Vue 里写它只为关掉布尔转型
        // （见 AGENTS.md 陷阱 18），不是真的默认值。跳过它，让 API 表的默认值列留空，
        // 不要把 "undefined" 这个字面量当成默认值显示出去。
        if (text === 'undefined') continue
        defaults.set(propertyName(prop, sourceFile), text)
      } else if (ts.isShorthandPropertyAssignment(prop)) {
        defaults.set(prop.name.getText(sourceFile), prop.name.getText(sourceFile))
      }
    }
  }

  const collectEmits = (call) => {
    const typeArg = call.typeArguments?.[0]
    if (!typeArg || !ts.isTypeLiteralNode(typeArg)) return
    for (const member of typeArg.members) {
      // 主流写法：'update:modelValue': [value: string]
      if (ts.isPropertySignature(member)) {
        const name = propertyName(member, sourceFile)
        const params = []
        if (member.type && ts.isTupleTypeNode(member.type)) {
          member.type.elements.forEach((element, index) => {
            if (ts.isNamedTupleMember(element)) {
              params.push(`${element.name.getText(sourceFile)}: ${element.type.getText(sourceFile)}`)
            } else {
              params.push(`${index === 0 ? 'payload' : `arg${index}`}: ${element.getText(sourceFile)}`)
            }
          })
        }
        events.push({
          name,
          description: leadingComment(script, member.getStart(sourceFile)) || describeEvent(name),
          type: `(${params.join(', ')}) => void`,
        })
        continue
      }
      // 另一种写法：(e: 'change', value: string): void
      if (ts.isCallSignatureDeclaration(member)) {
        const first = member.parameters[0]
        const name =
          first?.type && ts.isLiteralTypeNode(first.type) && ts.isStringLiteral(first.type.literal)
            ? first.type.literal.text
            : ''
        if (!name) continue
        const params = member.parameters.slice(1).map((param) => {
          const label = param.name.getText(sourceFile)
          return `${label}: ${param.type ? param.type.getText(sourceFile) : 'any'}`
        })
        events.push({
          name,
          description: leadingComment(script, member.getStart(sourceFile)) || describeEvent(name),
          type: `(${params.join(', ')}) => void`,
        })
      }
    }
  }

  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const callee = node.expression.text
      if (callee === 'withDefaults') {
        const inner = node.arguments[0]
        if (inner && ts.isCallExpression(inner)) collectProps(inner)
        const fallback = node.arguments[1]
        if (fallback && ts.isObjectLiteralExpression(fallback)) collectDefaults(fallback)
      } else if (callee === 'defineProps') {
        if (!attributes.length) collectProps(node)
      } else if (callee === 'defineEmits') {
        collectEmits(node)
      } else if (callee === 'defineExpose') {
        const arg = node.arguments[0]
        if (arg && ts.isObjectLiteralExpression(arg)) {
          for (const prop of arg.properties) {
            if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) continue
            const name = propertyName(prop, sourceFile)
            if (!name) continue
            exposes.push({
              name,
              description:
                leadingComment(script, prop.getStart(sourceFile)) || describeExpose(name),
            })
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  // 插槽：既看 <slot name="x">，也看 $slots.x 这种条件渲染
  const slotNames = []
  const addSlot = (name) => {
    if (name && !slotNames.includes(name)) slotNames.push(name)
  }
  const slotProps = new Map()
  /** 插槽正上方的 HTML 注释作为该插槽的说明，例如 <!-- 前缀内容 --> <slot name="prefix" /> */
  const slotDescriptions = new Map()
  for (const match of template.matchAll(/<slot\b([^>]*)>/g)) {
    const attrs = match[1]
    const nameMatch = /(?:^|\s)name="([^"]*)"/.exec(attrs)
    const name = nameMatch ? nameMatch[1] : 'default'
    addSlot(name)
    const comment = adjacentComment(template, match.index, true)
    if (comment && !slotDescriptions.has(name)) slotDescriptions.set(name, comment)
    const bindings = []
    for (const bind of attrs.matchAll(/:([A-Za-z_$][\w$]*)\s*=/g)) {
      if (bind[1] !== 'name' && bind[1] !== 'key') bindings.push(bind[1])
    }
    if (bindings.length) slotProps.set(name, `{ ${bindings.join(', ')} }`)
  }
  for (const match of template.matchAll(/\$slots\.([A-Za-z_$][\w$]*)/g)) addSlot(match[1])
  if (slotNames.includes('default')) {
    slotNames.splice(slotNames.indexOf('default'), 1)
    slotNames.unshift('default')
  }

  for (const attribute of attributes) {
    const fallback = defaults.get(attribute.name)
    if (fallback !== undefined) attribute.default = fallback
  }

  return {
    attributes,
    events,
    slots: slotNames.map((name) => ({
      name,
      description: slotDescriptions.get(name) || describeSlot(name),
      type: slotProps.get(name),
    })),
    exposes,
  }
}

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
