/** 列表条目：任意对象，组件用 itemKey 指定的字段当唯一键 */
export type JeDragSortItem = Record<string, any>

/**
 * 外部拖拽容器：CSS 选择器、元素本身、返回元素的函数，或 ref 对象。
 * 传了它之后组件不再渲染内置列表，而是直接给这个元素接入拖拽。
 */
export type JeDragSortTarget =
  | string
  | HTMLElement
  | { value: HTMLElement | null }
  | (() => HTMLElement | null)

/** sortablejs 回传的拖拽事件，只用到这两个字段 */
export interface JeDragSortEvent {
  /** 正在被拖拽的条目元素 */
  item?: HTMLElement
  /** 浏览器原生事件，用来取指针初始坐标 */
  originalEvent?: { clientX: number; clientY: number }
}
