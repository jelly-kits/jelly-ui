import type { ComputedRef, InjectionKey, Ref } from 'vue'

/** 标签名 */
export type JeTabName = string | number

/** JeTab 下发给 JeTabItem 的上下文 */
export interface JeTabContext {
  /** 当前激活的标签名 */
  activeName: ComputedRef<JeTabName | undefined>
  /** 子项未声明 name 时，用它生成一个自增的兜底 name */
  genName: () => number
  /** 子项挂载时注册自己 */
  register: (name: JeTabName, disabled: () => boolean) => void
  /** 子项卸载时注销自己 */
  unregister: (name: JeTabName) => void
  /** 由 name 反查注册顺序下标 */
  getIndex: (name: JeTabName) => number
  /** 激活某个标签 */
  activate: (name: JeTabName, index: number) => void
  /** 是否为当前激活项 */
  isActive: (name: JeTabName) => boolean
  /** 头部标题容器，子项把标题按钮 Teleport 到这里 */
  navRef: Ref<HTMLElement | null>
  /** 激活态颜色 */
  activeColor: ComputedRef<string>
  /** 未激活态颜色 */
  inactiveColor: ComputedRef<string>
  /** 标题放不下时省略并平分宽度 */
  ellipsis: ComputedRef<boolean>
}

export const jeTabKey: InjectionKey<JeTabContext> = Symbol('jeTab')