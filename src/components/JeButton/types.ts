import type { InjectionKey } from 'vue'

/** 按钮语义类型，与 JeText / JeToast 的语义色一一对应 */
export type JeButtonType = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

/** 按钮皮肤：比 type 多一个 ghost（半透明的次级按钮），是旧的 variant 写法的保留值域 */
export type JeButtonVariant = JeButtonType | 'ghost'

/** 按钮尺寸 */
export type JeButtonSize = 'large' | 'default' | 'small'

/** 按钮组下发给子按钮的默认配置 */
export interface JeButtonGroupContext {
  /** 组上声明的尺寸，子按钮未显式指定时沿用 */
  getSize: () => JeButtonSize | undefined
  /** 组上声明的语义类型，子按钮未显式指定时沿用 */
  getType: () => JeButtonType | undefined
}

/** 子按钮通过它拿到按钮组的默认尺寸与语义类型 */
export const jeButtonGroupKey: InjectionKey<JeButtonGroupContext> = Symbol('jeButtonGroup')
