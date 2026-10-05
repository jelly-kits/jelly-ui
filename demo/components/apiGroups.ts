import type { ComponentApi } from '../api-data'

/**
 * 组件名去掉 Je 前缀后的展示名。
 * 文档正文与右侧目录共用同一口径：文档站读起来应该是「Button 支持…」而不是「JeButton 支持…」。
 */
export const componentLabel = (name: string) => (name.startsWith('Je') ? name.slice(2) : name)

export interface ApiGroup {
  key: keyof ComponentApi
  /** 正文里的分组小标题 */
  title: string
  /** 右侧目录用的短标签：目录列窄，放不下「属性 Attributes」这种全称 */
  short: string
  rows: ComponentApi[keyof ComponentApi]
  /** 只有属性有默认值列 */
  withDefault: boolean
}

const GROUP_DEFS: Omit<ApiGroup, 'rows'>[] = [
  { key: 'attributes', title: '属性 Attributes', short: '属性', withDefault: true },
  { key: 'events', title: '事件 Events', short: '事件', withDefault: false },
  { key: 'slots', title: '插槽 Slots', short: '插槽', withDefault: false },
  { key: 'exposes', title: '可调用函数 Exposes', short: '方法', withDefault: false },
]

/** 没有内容的整组直接不渲染；正文小标题与右侧目录都按这份过滤结果走 */
export const visibleApiGroups = (api: ComponentApi): ApiGroup[] =>
  GROUP_DEFS.map((def) => ({ ...def, rows: api[def.key] })).filter((group) => group.rows.length > 0)

/** API 小节内各层级的锚点 id —— 正文与右侧目录必须用同一套，否则点不过去 */
export const apiSectionId = (name: string) => `demo-api-${componentLabel(name)}`

export const apiGroupId = (name: string, key: keyof ComponentApi) => `${apiSectionId(name)}-${key}`
