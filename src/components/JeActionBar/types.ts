import type { ComputedRef, InjectionKey } from 'vue'

/** 操作栏及其子项的尺寸 */
export type JeActionBarSize = 'small' | 'default' | 'large'

/** 操作栏按钮的语义类型 */
export type JeActionBarButtonType =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'default'

/** 操作栏向下提供的上下文 */
export interface JeActionBarContext {
  /** 当前尺寸，子项据此调整字号与图标大小 */
  size: ComputedRef<JeActionBarSize>
}

export const jeActionBarKey: InjectionKey<JeActionBarContext> = Symbol('jeActionBar')
