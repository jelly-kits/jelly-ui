import type { InjectionKey } from 'vue'

/** 父级下拉菜单通过 provide 暴露给子项的能力 */
export interface JeDropdownContext {
  /** 选中某项 */
  handleSelect: (command: string | number) => void
  /** 收起菜单 */
  close: () => void
}

/** 子项用这个 key 注入父级上下文 */
export const jeDropdownKey: InjectionKey<JeDropdownContext> = Symbol('je-dropdown')
