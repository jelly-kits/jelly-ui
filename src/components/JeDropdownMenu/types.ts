import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { JeIconName } from '../JeIcon/icons'

/** 下拉项的值 */
export type JeDropdownValue = string | number

/** 单个选项 */
export interface JeDropdownOption {
  /** 选项文案 */
  text: string
  /** 选项值，必填且唯一 */
  value: JeDropdownValue
  /** 选中后回填到标题栏的文字，未提供时沿用标题栏自身文案 */
  title?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 选项前的图标 */
  icon?: JeIconName
  /** 选项右侧的灰色补充说明 */
  tip?: string
}

/** JeDropdownMenu 下发给子项的上下文 */
export interface JeDropdownMenuContext {
  /** 当前展开项下标，-1 表示全部收起 */
  activeIndex: Ref<number>
  /** 切换第 index 项 */
  toggle: (index: number) => void
  /** 收起全部 */
  close: () => void
  /** 面板展开方向 */
  direction: ComputedRef<'down' | 'up'>
  /** 选中 / 展开态文字颜色 */
  activeColor: ComputedRef<string>
  /** 未选中态文字颜色 */
  inactiveColor: ComputedRef<string>
  /** 展开 / 收起过渡时长（毫秒） */
  duration: ComputedRef<number>
  /** 点击选项后是否自动收起 */
  closeOnClickOption: ComputedRef<boolean>
  /** 展开时重新取一次浮层层级 */
  refreshZIndex: () => number
  /** 子项注册自己，返回当前下标 */
  register: (key: symbol) => number
  /** 注销子项 */
  unregister: (key: symbol) => void
  /** 由 key 反查当前下标 */
  indexOf: (key: symbol) => number
}

export const jeDropdownMenuKey: InjectionKey<JeDropdownMenuContext> = Symbol('jeDropdownMenu')