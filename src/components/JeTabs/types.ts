import type { InjectionKey, VNodeChild } from 'vue'

/** tab 标识 */
export type JeTabName = string | number
/** 外观类型 */
export type JeTabsType = 'line' | 'card' | 'border-card'
/** tab 条位置 */
export type JeTabsPosition = 'top' | 'bottom' | 'left' | 'right'

/** 子项注册给父级的面板信息 */
export interface JeTabPaneState {
  /** 唯一 id，用于生成 tab / panel 的 DOM id */
  uid: string
  name: JeTabName
  label: string
  disabled: boolean
  closable: boolean
  /** 自定义 label 插槽，父级渲染标题时调用 */
  labelRender?: () => VNodeChild
}

/** 父级下发给子项的上下文 */
export interface JeTabsContext {
  /** 注册面板（父级据此维护 pane 顺序） */
  registerPane: (uid: string, getState: () => JeTabPaneState) => void
  /** 注销面板 */
  unregisterPane: (uid: string) => void
  /** 该 name 是否为当前激活项 */
  isActive: (name: JeTabName) => boolean
}

/** 子项通过它拿到父级的激活状态与操作方法 */
export const jeTabsKey: InjectionKey<JeTabsContext> = Symbol('jeTabs')
