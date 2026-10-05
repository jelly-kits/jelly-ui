import type { InjectionKey } from 'vue'

/** 宫格下发给子项的布局约定 */
export interface JeGridContext {
  /** 单元格是否强制正方形 */
  getSquare: () => boolean
}

/** 宫格子项通过它拿到父级的布局约定 */
export const jeGridKey: InjectionKey<JeGridContext> = Symbol('jeGrid')
