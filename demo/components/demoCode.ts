import type { ComputedRef, InjectionKey } from 'vue'

/** 右侧「本页目录」里的一项 */
export interface DemoAnchor {
  /** 目标元素 id（不含 #） */
  id: string
  /** 目录上显示的文字 */
  title: string
  /** 排序权重：页面标题 -1、演示块用自增序号、API 小节及其子项用 1e6 起的基数 */
  order: number
  /** 层级：1 顶级（页面标题 / 演示块 / API）、2 组件、3 组件内的 API 分组；目录按它缩进 */
  level?: number
}

/** DemoPage 向下提供的上下文，供 DemoBlock 取到自己那块示例的源码、并登记目录锚点 */
export interface DemoPageContext {
  /** 当前页面源码（?raw 读到的原文） */
  source: ComputedRef<string | null>
  /** 按渲染顺序给每个演示块编号，返回当前块的序号 */
  nextIndex: () => number
  /** 演示块挂载时登记锚点 */
  registerAnchor: (anchor: DemoAnchor) => void
  /** 演示块卸载时注销锚点 */
  unregisterAnchor: (id: string) => void
}

export const DEMO_PAGE_KEY: InjectionKey<DemoPageContext> = Symbol('je-demo-page')

/* -------------------- 源码切分 -------------------- */

/** 找到开标签的结束位置；引号内的 > 不算 */
const findTagEnd = (text: string, from: number): number => {
  let quote = ''
  for (let index = from; index < text.length; index += 1) {
    const char = text[index]
    if (quote) {
      if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '>') return index
  }
  return -1
}

/** 去掉公共缩进与首尾空行，得到可直接展示的代码片段 */
const dedent = (text: string): string => {
  const lines = text.replace(/\t/g, '  ').split('\n')
  while (lines.length && !lines[0]?.trim()) lines.shift()
  while (lines.length && !lines[lines.length - 1]?.trim()) lines.pop()
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.length - line.trimStart().length)
  const min = indents.length ? Math.min(...indents) : 0
  return lines.map((line) => line.slice(min)).join('\n')
}

/** 页面 <script> 的内容 */
const scriptOf = (source: string): string => {
  const match = /<script[^>]*>([\s\S]*)<\/script>/.exec(source)
  return match ? match[1] ?? '' : ''
}

/** 页面根 <template> 的内容（含内部嵌套的 <template #slot>） */
const templateOf = (source: string): string => {
  const open = source.indexOf('<template')
  if (open === -1) return ''
  const openEnd = findTagEnd(source, open)
  if (openEnd === -1) return ''
  const close = source.lastIndexOf('</template>')
  if (close <= openEnd) return ''
  return source.slice(openEnd + 1, close)
}

interface BlockRange {
  inner: string
  start: number
  end: number
}

/**
 * 模板里所有 <DemoBlock> 的内容与位置。
 * 自闭合的演示块记为空内容，这样序号和 DemoBlock 的渲染顺序始终对齐。
 */
const collectBlocks = (template: string): BlockRange[] => {
  const blocks: BlockRange[] = []
  let from = 0
  for (;;) {
    const open = template.indexOf('<DemoBlock', from)
    if (open === -1) break
    const openEnd = findTagEnd(template, open)
    if (openEnd === -1) break
    if (template[openEnd - 1] === '/') {
      blocks.push({ inner: '', start: open, end: openEnd + 1 })
      from = openEnd + 1
      continue
    }
    const close = template.indexOf('</DemoBlock>', openEnd)
    if (close === -1) break
    blocks.push({ inner: template.slice(openEnd + 1, close), start: open, end: close + 12 })
    from = close + 1
  }
  return blocks
}

/** 把一段模板按顶层节点切开 */
const splitNodes = (text: string): string[] => {
  const nodes: string[] = []
  let index = 0
  while (index < text.length) {
    const open = text.indexOf('<', index)
    if (open === -1) break
    if (text.startsWith('<!--', open)) {
      const end = text.indexOf('-->', open)
      if (end === -1) break
      index = end + 3
      continue
    }
    const name = /^<([A-Za-z][\w-]*)/.exec(text.slice(open, open + 40))?.[1]
    if (!name) {
      index = open + 1
      continue
    }
    const begin = text.lastIndexOf('\n', open) + 1
    const openEnd = findTagEnd(text, open)
    if (openEnd === -1) break
    if (text[openEnd - 1] === '/') {
      nodes.push(text.slice(begin, openEnd + 1))
      index = openEnd + 1
      continue
    }
    const close = text.indexOf(`</${name}>`, openEnd)
    if (close === -1) {
      nodes.push(text.slice(begin, openEnd + 1))
      index = openEnd + 1
      continue
    }
    nodes.push(text.slice(begin, close + name.length + 3))
    index = close + name.length + 3
  }
  return nodes.filter((node) => node.trim())
}

/**
 * 页面里不属于任何演示块的散落节点。
 * 有的页面（Toast / Drawer / Tour）把弹层写在 <DemoPage> 的直接子级，
 * 演示块里只有触发按钮，这些节点要跟着示例一起给出，否则用户抄走的是半截代码。
 */
const pageNodes = (template: string, blocks: BlockRange[]): string[] => {
  const open = template.indexOf('<DemoPage')
  if (open === -1) return []
  const openEnd = findTagEnd(template, open)
  const close = template.lastIndexOf('</DemoPage>')
  if (openEnd === -1 || close <= openEnd) return []
  let rest = template.slice(openEnd + 1, close)
  for (const block of [...blocks].reverse()) {
    const from = block.start - openEnd - 1
    rest = rest.slice(0, from) + rest.slice(block.end - openEnd - 1)
  }
  return splitNodes(rest)
}

/* -------------------- 标识符 -------------------- */

/**
 * 去掉字符串与注释，但保留模板串 ${} 里的表达式。
 * 这样「'online'」这类字面量不会被误当成变量名，而 `a${b}c` 里的 b 仍能被识别。
 */
const stripStrings = (text: string): string => {
  let out = ''
  let index = 0
  while (index < text.length) {
    const char = text[index]
    if (char === '/' && text[index + 1] === '/') {
      const end = text.indexOf('\n', index)
      index = end === -1 ? text.length : end
      continue
    }
    if (char === '/' && text[index + 1] === '*') {
      const end = text.indexOf('*/', index + 2)
      index = end === -1 ? text.length : end + 2
      out += ' '
      continue
    }
    if (char === "'" || char === '"') {
      index += 1
      while (index < text.length) {
        if (text[index] === '\\') {
          index += 2
          continue
        }
        if (text[index] === char) {
          index += 1
          break
        }
        index += 1
      }
      out += ' '
      continue
    }
    if (char === '`') {
      index += 1
      while (index < text.length) {
        if (text[index] === '\\') {
          index += 2
          continue
        }
        if (text[index] === '`') {
          index += 1
          break
        }
        if (text[index] === '$' && text[index + 1] === '{') {
          let depth = 1
          index += 2
          const start = index
          while (index < text.length && depth > 0) {
            if (text[index] === '{') depth += 1
            else if (text[index] === '}') depth -= 1
            index += 1
          }
          out += ` ${text.slice(start, index - 1)} `
          continue
        }
        index += 1
      }
      out += ' '
      continue
    }
    out += char
    index += 1
  }
  return out
}

/** 一段代码里出现的标识符（去重） */
const idsIn = (text: string): string[] => {
  const found = stripStrings(text).match(/[A-Za-z_$][\w$]*/g)
  return found ? [...new Set(found)] : []
}

/** je-auto-complete → JeAutoComplete，才能和脚本里的组件标识符对上；已是 PascalCase 的原样返回 */
const pascalTag = (tag: string): string =>
  tag.includes('-')
    ? tag
        .split('-')
        .map((part) => (part ? (part[0] ?? '').toUpperCase() + part.slice(1) : ''))
        .join('')
    : tag

/** 模板片段用到的标识符：组件标签名、绑定表达式、插值 */
const templateIds = (fragment: string): string[] => {
  const ids: string[] = []
  for (const match of fragment.matchAll(/<\/?([A-Za-z][\w-]*)/g)) ids.push(pascalTag(match[1] ?? ''))
  for (const match of fragment.matchAll(/(?:^|\s)(?:v-[\w:.-]*|[:@#][\w:.-]*)\s*=\s*"([^"]*)"/g)) {
    ids.push(...idsIn(match[1] ?? ''))
  }
  for (const match of fragment.matchAll(/\{\{([\s\S]*?)\}\}/g)) ids.push(...idsIn(match[1] ?? ''))
  return [...new Set(ids.filter(Boolean))]
}

/* -------------------- 脚本分块 -------------------- */

/** 去掉块首的注释与空行，便于识别声明语句 */
const stripLeading = (text: string): string => {
  let body = text.trimStart()
  for (;;) {
    if (body.startsWith('/*')) {
      const end = body.indexOf('*/')
      if (end === -1) return ''
      body = body.slice(end + 2).trimStart()
      continue
    }
    if (body.startsWith('//')) {
      const end = body.indexOf('\n')
      if (end === -1) return ''
      body = body.slice(end + 1).trimStart()
      continue
    }
    return body
  }
}

/** 按顶层逗号切分（忽略字符串与括号内的逗号） */
const splitTopLevel = (text: string): string[] => {
  const parts: string[] = []
  let depth = 0
  let quote = ''
  let start = 0
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quote) {
      if (char === '\\') {
        index += 1
        continue
      }
      if (char === quote) quote = ''
      continue
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char
      continue
    }
    if (char === '{' || char === '(' || char === '[') depth += 1
    else if (char === '}' || char === ')' || char === ']') depth -= 1
    else if (char === ',' && depth === 0) {
      parts.push(text.slice(start, index))
      start = index + 1
    }
  }
  parts.push(text.slice(start))
  return parts
}

interface ImportSpec {
  imported: string
  local: string
  typeOnly: boolean
}

interface ImportInfo {
  source: string
  typeOnly: boolean
  defaultName: string | null
  specs: ImportSpec[]
}

interface ScriptChunk {
  text: string
  /** 该块声明的顶层名字 */
  names: string[]
  /** 是 import 语句时额外记录，便于按需重建 */
  imp: ImportInfo | null
}

const parseImport = (text: string): ImportInfo | null => {
  const body = stripLeading(text).trim()
  const match = /^import\s+(type\s+)?([\s\S]+?)\s+from\s+['"]([^'"]+)['"]$/.exec(body)
  if (!match) return null
  const clause = match[2] ?? ''
  const braceStart = clause.indexOf('{')
  const braceEnd = clause.lastIndexOf('}')
  const head = (braceStart === -1 ? clause : clause.slice(0, braceStart)).replace(/,\s*$/, '').trim()
  const specs: ImportSpec[] = []
  if (braceStart !== -1 && braceEnd > braceStart) {
    for (const part of splitTopLevel(clause.slice(braceStart + 1, braceEnd))) {
      const spec = /^(type\s+)?([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/.exec(part.trim())
      if (!spec) continue
      specs.push({
        typeOnly: Boolean(spec[1]),
        imported: spec[2] ?? '',
        local: spec[3] ?? spec[2] ?? '',
      })
    }
  }
  return {
    source: match[3] ?? '',
    typeOnly: Boolean(match[1]),
    defaultName: /^[A-Za-z_$][\w$]*$/.test(head) ? head : null,
    specs,
  }
}

/** 一条语句声明的顶层名字 */
const declaredNames = (text: string): string[] => {
  const body = stripLeading(text)
  const declaration = /^(?:export\s+)?(?:const|let|var)\s+([\s\S]*)$/.exec(body)
  if (declaration) {
    return splitTopLevel(declaration[1] ?? '')
      .map((part) => /^([A-Za-z_$][\w$]*)/.exec(part.trim())?.[1] ?? '')
      .filter(Boolean)
  }
  const fn = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/.exec(body)
  if (fn) return [fn[1] ?? '']
  const named = /^(?:export\s+)?(?:declare\s+)?(?:type|interface|enum|class)\s+([A-Za-z_$][\w$]*)/.exec(body)
  if (named) return [named[1] ?? '']
  return []
}

/** 一行代码结束时还开着几层括号（忽略字符串与注释） */
const depthDelta = (line: string): number => {
  let delta = 0
  let quote = ''
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (quote) {
      if (char === '\\') {
        index += 1
        continue
      }
      if (char === quote) quote = ''
      continue
    }
    if (char === '/' && line[index + 1] === '/') break
    if (char === '/' && line[index + 1] === '*') {
      const end = line.indexOf('*/', index + 2)
      if (end === -1) break
      index = end + 1
      continue
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char
      continue
    }
    if (char === '{' || char === '(' || char === '[') delta += 1
    else if (char === '}' || char === ')' || char === ']') delta -= 1
  }
  return delta
}

/** 把 <script setup> 切成一条条顶层语句，注释与空行归到下一条 */
const parseChunks = (script: string): ScriptChunk[] => {
  const chunks: ScriptChunk[] = []
  let buffer: string[] = []
  let pending: string[] = []
  let depth = 0
  const flush = () => {
    const text = [...pending, ...buffer].join('\n')
    const imp = parseImport(text)
    chunks.push({
      text: text.trim(),
      names: imp
        ? [...imp.specs.map((spec) => spec.local), ...(imp.defaultName ? [imp.defaultName] : [])]
        : declaredNames(text),
      imp,
    })
    pending = []
    buffer = []
  }
  for (const line of script.split('\n')) {
    const trimmed = line.trim()
    if (!buffer.length && (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))) {
      pending.push(line)
      continue
    }
    buffer.push(line)
    depth += depthDelta(line)
    if (depth <= 0) {
      depth = 0
      flush()
    }
  }
  if (buffer.length) flush()
  return chunks
}

/** 只保留用到的导入项，并按需折行 */
const renderImport = (info: ImportInfo, needed: Set<string>): string => {
  const specs = info.specs
    .filter((spec) => needed.has(spec.local))
    .map((spec) => {
      const name = spec.typeOnly ? `type ${spec.imported}` : spec.imported
      return spec.imported === spec.local ? name : `${name} as ${spec.local}`
    })
  const defaultName = info.defaultName && needed.has(info.defaultName) ? info.defaultName : ''
  const prefix = info.typeOnly ? 'type ' : ''
  if (!defaultName && !specs.length) return ''
  if (!specs.length) return `import ${prefix}${defaultName} from '${info.source}'`
  const inline = `import ${prefix}${defaultName ? `${defaultName}, ` : ''}{ ${specs.join(', ')} } from '${info.source}'`
  if (inline.length <= 88) return inline
  const head = `import ${prefix}${defaultName ? `${defaultName}, ` : ''}{\n`
  return `${head}${specs.map((spec) => `  ${spec},`).join('\n')}\n} from '${info.source}'`
}

/* -------------------- 对外入口 -------------------- */

/** 组装出可直接复制运行的 <script setup> + <template> 示例 */
export const buildDemoCode = (source: string, index: number): string => {
  const template = templateOf(source)
  const blocks = collectBlocks(template)
  const block = blocks[index]
  if (!block || !block.inner.trim()) return ''

  const fragment = dedent(block.inner)
  const chunks = parseChunks(scriptOf(source))
  const extras = pageNodes(template, blocks)

  // 从片段里用到的名字出发，把页面脚本中真正相关的语句挑出来（含传递依赖）
  const needed = new Set(templateIds(fragment))
  /** 只由片段与脚本块扩展：附加节点用它判断相关性，避免节点之间互相牵连 */
  const own = new Set(needed)
  const used = new Set<ScriptChunk>()
  const attached: string[] = []
  for (;;) {
    let changed = false
    for (const chunk of chunks) {
      if (used.has(chunk) || !chunk.names.some((name) => needed.has(name))) continue
      used.add(chunk)
      changed = true
      if (!chunk.imp) {
        const ownNames = new Set(chunk.names)
        for (const id of idsIn(chunk.text)) {
          // 语句自己声明的名字不算依赖，否则「用到了同一个函数」的兄弟节点会被连带匹配进来
          if (ownNames.has(id)) continue
          needed.add(id)
          own.add(id)
        }
      }
    }
    for (const node of extras) {
      if (attached.includes(node)) continue
      const ids = templateIds(node)
      // 只用「变量名」判断相关性：组件标签名在同页每个块里都会被用到，拿它匹配会把无关的兄弟节点也带进来
      if (!ids.some((id) => !/^[A-Z]/.test(id) && own.has(id))) continue
      attached.push(node)
      changed = true
      for (const id of ids) needed.add(id)
    }
    if (!changed) break
  }

  const ordered = chunks.filter((chunk) => used.has(chunk))
  const imports = ordered
    .filter((chunk) => chunk.imp)
    .map((chunk) => renderImport(chunk.imp as ImportInfo, needed))
    .filter(Boolean)
  const body = ordered
    .filter((chunk) => !chunk.imp)
    .map((chunk) => chunk.text)
    .join('\n')

  const parts: string[] = []
  const script = [imports.join('\n'), body].filter(Boolean).join('\n\n')
  if (script) parts.push(`<script setup lang="ts">\n${script}\n</script>`)

  const lines = [fragment, ...attached.map((node) => dedent(node))]
    .filter(Boolean)
    .join('\n')
    .split('\n')
  parts.push(`<template>\n${lines.map((line) => (line.trim() ? `  ${line}` : line)).join('\n')}\n</template>`)
  return parts.join('\n\n')
}
