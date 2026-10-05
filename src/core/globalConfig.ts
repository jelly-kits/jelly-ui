import { shallowRef } from 'vue'
import type { JeConfigSize } from '../components/JeConfigProvider/types'
import type { JeLocaleInput } from '../components/JeLocale/types'
import { setConfiguredColorMode, setConfiguredThemeTokens, type JeColorMode } from './theme'
import { setZIndexBase } from './useZIndex'

/** 浮层挂载点：CSS 选择器或元素 */
export type JeTeleportTarget = string | HTMLElement

/**
 * 应用级全局配置。
 *
 * 与 JeConfigProvider 的分工：ConfigProvider 管**子树**覆盖，这里管**整站**兜底。
 * 之所以需要它，是因为命令式 API（showMessage / showDialog …）完全在组件树之外 ——
 * 它们各自 createApp 挂到宿主节点，拿不到 provide 链，只能读这份单例。
 */
export interface JeGlobalConfig {
  /** 全局默认组件尺寸；组件自身 size、祖先 ConfigProvider 优先级更高 */
  size?: JeConfigSize
  /** 全局语言包；传语言名 'zh-CN' | 'en-US'，或部分覆盖对象 */
  locale?: JeLocaleInput
  /** 库内浮层 DOM 的根容器（选择器或元素）；缺省挂 body */
  teleportTo?: JeTeleportTarget
  /** 浮层起始层级；缺省 2000 */
  zIndexBase?: number
  /** 全局明暗模式；缺省 'auto' 跟随系统。写入即落到 <html data-theme> */
  colorMode?: JeColorMode
  /** 全局主题色 token 覆盖（键可带 / 不带 --je- 前缀）；写入即落到 <html> */
  tokens?: Record<string, string>
}

/**
 * 配置单例。
 *
 * 必须是 shallowRef：locale / size 要能被**已经渲染**的组件响应式读到，
 * 而浅合并改的是同一个对象、不会触发依赖收集；所以每次整体替换 value。
 */
const config = shallowRef<JeGlobalConfig>({})

/**
 * 配置 Jelly UI 的应用级默认值。浅合并，可多次调用，同名覆盖、未传保留。
 *
 * 查找顺序：组件自身 prop → 祖先 JeConfigProvider → 这里 → 内置缺省。
 * 建议在 app.mount() 之前（或首次交互之前）调用一次。
 *
 * colorMode / tokens 是「文档级」的例外：它们不属于组件树，写入即落到 <html>，
 * 此后用户手动切换（useColorMode / setThemeTokens）会写 localStorage 并**优先于**这里。
 *
 * 传 undefined 等于「该项回到缺省」，因为合并语义就是对象展开：
 *
 *   configureJelly({ locale: 'en-US', zIndexBase: 3000, teleportTo: '#app-shell' })
 */
export function configureJelly(options: JeGlobalConfig): void {
  const next: JeGlobalConfig = { ...config.value, ...options }

  // zIndexBase 只升不降：低于当前游标时本次调用不生效，配置里也不留这个假值
  if (options.zIndexBase !== undefined && !setZIndexBase(options.zIndexBase)) {
    next.zIndexBase = config.value.zIndexBase
  }

  config.value = next

  /*
   * 用 `in` 而不是 `!== undefined` 判断：显式传 undefined 表示「回到缺省」，
   * 这时也要真的把 <html> 上的旧值清掉，不能因为值为 undefined 就跳过。
   */
  if ('colorMode' in options) setConfiguredColorMode(next.colorMode ?? 'auto')
  if ('tokens' in options) setConfiguredThemeTokens(next.tokens ?? {})
}

/** 读取当前应用级配置（只读快照，配置变化会触发依赖更新） */
export function getJellyConfig(): Readonly<JeGlobalConfig> {
  return config.value
}

/**
 * 把挂载点解析成元素，供命令式 API 的宿主节点使用。
 *
 * 选择器解析不到时回退 body —— 配置写错不该让整次调用直接抛异常。
 */
export function resolveTeleportElement(target?: JeTeleportTarget): Element {
  if (!target) return document.body
  if (typeof target === 'string') return document.querySelector(target) ?? document.body
  return target
}
