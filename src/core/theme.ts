import { computed, shallowRef, type ComputedRef } from 'vue'

/**
 * 全局明暗 / 主题色的「文档级」实现。
 *
 * 为什么是文档级而不是组件树级：这两样都是 CSS 变量，
 * 必须落在 <html>（documentElement）上才能被 Teleport 到 body 的浮层继承到
 * （写在某个内容容器上时，浮层会一路回落到 :root 的默认值，见 AGENTS.md 陷阱 17）。
 * 所以它们不归 JeConfigProvider（那是子树覆盖），而是走这个模块 + configureJelly()。
 *
 * 取值优先级（用户偏好 > 应用声明的缺省 > 内置缺省）：
 *   localStorage → configureJelly() → 'auto' / {}
 */

/** 明暗模式。auto 表示跟随系统偏好 */
export type JeColorMode = 'light' | 'dark' | 'auto'

/** 明暗模式在 localStorage 里的键；themeInitScript 与 useColorMode 必须同源 */
export const JE_COLOR_MODE_KEY = 'je-color-mode'

/** 主题色板在 localStorage 里的键；同上 */
export const JE_THEME_TOKENS_KEY = 'je-theme-tokens'

/** 键名兼容 `primary` 与 `--je-primary` 两种写法，与 JeConfigProvider.theme 同口径 */
const toCssVar = (key: string): string => (key.startsWith('--') ? key : `--je-${key}`)

const canUseDOM = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined'

/* ---------- 状态：configureJelly（应用级缺省）与 localStorage（用户偏好）两层 ---------- */

/** configureJelly() 声明的应用级缺省 */
const configuredMode = shallowRef<JeColorMode | undefined>(undefined)
const configuredTokens = shallowRef<Record<string, string>>({})

/** localStorage 里的用户偏好，优先级高于应用级缺省 */
const storedMode = shallowRef<JeColorMode | null>(null)
const storedTokens = shallowRef<Record<string, string>>({})

/**
 * 系统是否偏好深色。只参与 isDark 计算 ——
 * 真正的样式切换交给 variables.css 的媒体查询（auto 模式下 <html> 上不写 data-theme）。
 */
const systemDark = shallowRef(false)

/** 读取 / 监听只做一次；多个组件各自调用 useColorMode() 不会重复注册 */
let initialized = false

const resolveMode = (): JeColorMode => storedMode.value ?? configuredMode.value ?? 'auto'

/** 应用级色板打底，用户改过的键逐键覆盖 */
const resolveTokens = (): Record<string, string> => ({
  ...configuredTokens.value,
  ...storedTokens.value,
})

/* ---------- 落 <html> ---------- */

/** 已经写到 <html> 上的变量名，用于「整体替换」时清掉这一轮不再出现的键 */
let appliedVars: string[] = []

function applyMode(mode: JeColorMode): void {
  if (!canUseDOM()) return
  // auto 不写属性：让 variables.css 的媒体查询接管，系统偏好变了还能实时跟着变
  if (mode === 'auto') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = mode
}

function applyTokens(tokens: Record<string, string>): void {
  if (!canUseDOM()) return
  const style = document.documentElement.style
  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries(tokens)) next[toCssVar(key)] = value

  // setProperty 只会覆盖同名键，不会自动清掉上一轮写过的 —— 不手动移除就会残留旧色
  for (const cssVar of appliedVars) {
    if (!(cssVar in next)) style.removeProperty(cssVar)
  }
  for (const [cssVar, value] of Object.entries(next)) style.setProperty(cssVar, value)
  appliedVars = Object.keys(next)
}

/** 把当前解析结果整体同步到 <html> */
function sync(): void {
  applyMode(resolveMode())
  applyTokens(resolveTokens())
}

/* ---------- localStorage ---------- */

function normalizeMode(value: string | null): JeColorMode | null {
  return value === 'light' || value === 'dark' || value === 'auto' ? value : null
}

function readStoredMode(): JeColorMode | null {
  if (!canUseDOM()) return null
  try {
    return normalizeMode(localStorage.getItem(JE_COLOR_MODE_KEY))
  } catch {
    return null
  }
}

function parseTokens(raw: string | null): Record<string, string> {
  if (!raw) return {}
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return {}
    const result: Record<string, string> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (typeof val === 'string') result[key] = val
    }
    return result
  } catch {
    return {}
  }
}

function readStoredTokens(): Record<string, string> {
  if (!canUseDOM()) return {}
  try {
    return parseTokens(localStorage.getItem(JE_THEME_TOKENS_KEY))
  } catch {
    return {}
  }
}

function persist(key: string, value: string | null): void {
  if (!canUseDOM()) return
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* 存储被禁用（隐私模式等）时只保留内存态 */
  }
}

/* ---------- 初始化 ---------- */

function ensureInit(): void {
  if (initialized || !canUseDOM()) return
  initialized = true

  storedMode.value = readStoredMode()
  storedTokens.value = readStoredTokens()

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = media.matches
  media.addEventListener('change', (event) => {
    systemDark.value = event.matches
  })

  /*
   * storage 事件只在「同源的其他文档」里触发 —— 移动端预览 iframe 是独立文档，
   * 正是靠它跟上父页面的明暗与配色，不需要父页面 postMessage。
   */
  window.addEventListener('storage', (event) => {
    if (event.key === JE_COLOR_MODE_KEY) {
      storedMode.value = normalizeMode(event.newValue)
      sync()
    } else if (event.key === JE_THEME_TOKENS_KEY) {
      storedTokens.value = parseTokens(event.newValue)
      sync()
    }
  })

  sync()
}

/* ---------- 明暗 ---------- */

export interface UseColorModeReturn {
  /** 当前明暗模式，'auto' 表示跟随系统 */
  mode: ComputedRef<JeColorMode>
  /** 当前实际是不是深色（'auto' 时看系统偏好），用来切换图标 / 文案 */
  isDark: ComputedRef<boolean>
  /** 设置明暗模式并持久化（'auto' 也会存下来） */
  setColorMode: (mode: JeColorMode) => void
  /** 在浅色 / 深色之间切换（会覆盖掉 'auto'） */
  toggleColorMode: () => void
}

const mode = computed<JeColorMode>(() => resolveMode())

const isDark = computed<boolean>(() => {
  const current = mode.value
  return current === 'auto' ? systemDark.value : current === 'dark'
})

export function setColorMode(value: JeColorMode): void {
  ensureInit()
  storedMode.value = value
  persist(JE_COLOR_MODE_KEY, value)
  sync()
}

export function toggleColorMode(): void {
  ensureInit()
  setColorMode(isDark.value ? 'light' : 'dark')
}

/** 读取 / 切换全局明暗；用户手动切换会写 localStorage，此后优先于 configureJelly() */
export function useColorMode(): UseColorModeReturn {
  ensureInit()
  return { mode, isDark, setColorMode, toggleColorMode }
}

/* ---------- 主题色板 ---------- */

export interface UseThemeTokensReturn {
  /** 当前生效的色板覆盖（应用级缺省 + 用户偏好合并后的结果），键为 CSS 变量名 */
  tokens: ComputedRef<Record<string, string>>
  /** 覆盖色板（整体替换用户偏好那一层）并持久化 */
  setThemeTokens: (tokens: Record<string, string>) => void
  /** 清空用户偏好那一层，回落到 configureJelly() 配的缺省 */
  resetThemeTokens: () => void
}

const tokens = computed<Record<string, string>>(() => resolveTokens())

export function setThemeTokens(value: Record<string, string>): void {
  ensureInit()
  storedTokens.value = { ...value }
  persist(JE_THEME_TOKENS_KEY, JSON.stringify(storedTokens.value))
  sync()
}

export function resetThemeTokens(): void {
  ensureInit()
  storedTokens.value = {}
  persist(JE_THEME_TOKENS_KEY, null)
  sync()
}

/** 读取 / 覆盖全局主题色；写入会持久化，此后优先于 configureJelly() 配的缺省 */
export function useThemeTokens(): UseThemeTokensReturn {
  ensureInit()
  return { tokens, setThemeTokens, resetThemeTokens }
}

/* ---------- 供 configureJelly() 调用的应用级缺省入口 ---------- */

/** 设置「应用声明的缺省」明暗模式并立即落 DOM（不是用户偏好，不写 localStorage） */
export function setConfiguredColorMode(value: JeColorMode): void {
  configuredMode.value = value
  sync()
}

/** 设置「应用声明的缺省」色板并立即落 DOM（不是用户偏好，不写 localStorage） */
export function setConfiguredThemeTokens(value: Record<string, string>): void {
  configuredTokens.value = { ...value }
  sync()
}

/* ---------- 首帧防闪白 ---------- */

/**
 * 首帧防闪白脚本（纯 JS，可求值）。
 * 与 useColorMode / useThemeTokens 读同一组 key、同一套解析口径 —— 改一处要改另一处。
 */
export const themeInitScript = [
  ';(function () {',
  '  try {',
  `    var mode = localStorage.getItem('${JE_COLOR_MODE_KEY}')`,
  "    if (mode === 'light' || mode === 'dark') document.documentElement.dataset.theme = mode",
  `    var raw = localStorage.getItem('${JE_THEME_TOKENS_KEY}')`,
  '    if (raw) {',
  '      var tokens = JSON.parse(raw)',
  '      var style = document.documentElement.style',
  '      for (var key in tokens) {',
  '        if (Object.prototype.hasOwnProperty.call(tokens, key)) {',
  "          style.setProperty(key.indexOf('--') === 0 ? key : '--je-' + key, tokens[key])",
  '        }',
  '      }',
  '    }',
  '  } catch (error) {',
  '    /* 存储被禁用 / 内容损坏时，交给 CSS 的媒体查询兜底 */',
  '  }',
  '})()',
].join('\n')

/**
 * 可直接粘贴进 index.html <head> 的完整片段。
 *
 * 应用样式（JS 注入）之前必须先定好明暗，否则深色偏好下会先闪一下浅色；
 * 另外记得给 <html> 铺一层内联兜底底色，观感才连续。
 */
export const themeInitSnippet = ['<script>', themeInitScript, '</script>'].join('\n')
