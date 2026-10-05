import { computed, ref, type ComputedRef } from 'vue'
import { enUS } from './en-US'

/**
 * 文档站的语言。
 *
 * 口径是「**中文原文即 key**」：模板里直接写中文，交给 t() 过一遍 ——
 * 英文表（en-US.ts）收录了就用英文，没收录就回落中文原文。
 * 好处是**可以渐进翻译**：翻一半、漏几条都不会出现空白或 key 泄漏。
 *
 * 语言的**唯一真相是 URL 的语言段**（`#/zh-CN/button`，口径参考 vant 文档站）。
 * localStorage 只记「上次看的是哪种语言」，用于给没带语言段的地址（旧书签、根路径）补默认值 ——
 * 它不参与渲染：切语言一律走 router.replace 换语言段，路由守卫再把语言段同步进下面的 ref。
 */
export type DemoLocale = 'zh-CN' | 'en-US'

export interface DemoI18nReturn {
  /** 当前语言（响应式；在模板里会被自动解包） */
  locale: ComputedRef<DemoLocale>
  /** 取文案：中文原文即 key，英文表未收录时回落原文 */
  t: (source: string) => string
  /** 顶栏切换控件的选项 */
  options: { label: string; value: DemoLocale }[]
}

/** 上次看过的语言，与库的 je-color-mode / je-theme-tokens 同款机制 */
const STORAGE_KEY = 'je-demo-locale'

/** 没带语言段的地址该补哪种语言（供路由守卫用） */
export const getPreferredLocale = (): DemoLocale =>
  localStorage.getItem(STORAGE_KEY) === 'en-US' ? 'en-US' : 'zh-CN'

/** 从 hash 里读语言段：形如 #/zh-CN/button、#/en-US */
const readUrlLocale = (): DemoLocale | null => {
  const matched = /^#\/(zh-CN|en-US)(?:\/|$)/.exec(location.hash)
  return (matched?.[1] as DemoLocale | undefined) ?? null
}

const current = ref<DemoLocale>(readUrlLocale() ?? getPreferredLocale())

/** 语言标识同步到 <html lang>（库的 JeLocale 只在显式配置时才写，两边不冲突） */
const applyLangAttribute = (value: DemoLocale): void => {
  if (typeof document !== 'undefined') document.documentElement.lang = value
}

applyLangAttribute(current.value)

/**
 * 由路由守卫在每个带语言段的导航上调用：把 URL 的语言段落进状态，并记住它。
 * 唯一改语言状态的地方 —— 其它地方一律改 URL（router.replace 换语言段）。
 */
export function setDemoLocale(value: string | number): void {
  const next: DemoLocale = value === 'en-US' ? 'en-US' : 'zh-CN'
  localStorage.setItem(STORAGE_KEY, next)
  if (next === current.value) return
  current.value = next
  applyLangAttribute(next)
}

const locale = computed(() => current.value)

/*
 * t() 内部读 current.value，所以调用它的 computed / 渲染函数会自动收集依赖 ——
 * 切语言时所有用过 t() 的地方一起重渲染，不需要额外接线。
 */
const t = (source: string): string => (current.value === 'zh-CN' ? source : enUS[source] ?? source)

const options: { label: string; value: DemoLocale }[] = [
  { label: '中', value: 'zh-CN' },
  { label: 'EN', value: 'en-US' },
]

export function useDemoI18n(): DemoI18nReturn {
  return { locale, t, options }
}
