/**
 * 从组件源码里提取 API（属性 / 事件 / 插槽 / 可调用函数）。
 *
 * 主库（src/components）与 uni 版（uni/src/components）的组件写法一致，
 * 两边的生成脚本共用这一份实现：
 *   - defineProps<{}>() / withDefaults / defineEmits<{}>() / defineExpose
 *   - props 既支持内联类型字面量，也支持 defineProps<JeXxxProps>() 引用同目录 types.ts
 *   - 插槽看 <slot name="x">，也看 $slots.x
 *
 * 说明文案一律优先取源码里的 JSDoc / HTML 注释，没写时回落到 api-glossary.mjs 的通用说明。
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import {
  describeAttribute,
  describeEvent,
  describeExpose,
  describeSlot,
} from './api-glossary.mjs'

const read = (path) => readFileSync(path, 'utf8')

/** 取 <script> 内容；本仓库每个组件只有一个 script 块 */
export const scriptOf = (source) => {
  const match = /<script[^>]*>([\s\S]*)<\/script>/.exec(source)
  return match ? match[1] : ''
}

/** 取根 <template> 内容：模板里会嵌套 <template>，所以取最后一个闭合标签 */
export const templateOf = (source) => {
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
export const collectTypeSources = (script, dirPath) => {
  const sources = []
  for (const match of script.matchAll(/from\s+'(\.[^']*)'/g)) {
    const target = join(dirPath, `${match[1]}.ts`)
    if (existsSync(target)) sources.push(read(target))
  }
  return sources
}

/** 解析单个 .vue，返回 { attributes, events, slots, exposes } */
export const extractApi = (source, typeSources = []) => {
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
              description: leadingComment(script, prop.getStart(sourceFile)) || describeExpose(name),
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
