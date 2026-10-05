import type { Component, StyleValue } from 'vue'
import type { JeIconName } from '../JeIcon/icons'

/** 输入框尺寸 */
export type JeInputSize = 'small' | 'default' | 'large'

/**
 * 输入框类型：与原生 input 的 type 对齐，额外支持 textarea。
 * 非 textarea 时渲染 `<input>`，textarea 时渲染 `<textarea>`。
 */
export type JeInputType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'password'
  | 'email'
  | 'search'
  | 'tel'
  | 'url'

/** 文本域自适应高度：`true`，或指定最小 / 最大行数 */
export type JeInputAutosize = boolean | { minRows?: number; maxRows?: number }

/** 文本域右下角拖拽改变尺寸的方向 */
export type JeInputResize = 'none' | 'both' | 'horizontal' | 'vertical'

/** 字数统计的位置：框内（右侧）或框外（下方右对齐） */
export type JeInputWordLimitPosition = 'inside' | 'outside'

/** 图标：内置图标名，或任意组件（与 Element Plus 的 string | Component 一致） */
export type JeInputIcon = JeIconName | Component

/**
 * 文本域自适应高度时组件算出来的行内样式，通过实例的 `textareaStyle` 暴露。
 * 刻意只声明实际会用到的两个属性——直接用 vue 的 CSSProperties 会让生成的
 * d.ts 把 csstype 里三千多条属性全部内联进来。
 */
export interface JeInputTextareaStyle {
  height?: string
  overflowY?: 'hidden' | 'auto'
}

/** 原生 inputmode，用来在移动端唤起指定类型的软键盘 */
export type JeInputMode =
  | 'none'
  | 'text'
  | 'tel'
  | 'url'
  | 'email'
  | 'numeric'
  | 'decimal'
  | 'search'

/** JeInput 的属性 */
export interface JeInputProps {
  /** 绑定值 */
  modelValue?: string | number
  /** 输入框类型，默认 text */
  type?: JeInputType
  /** 占位提示 */
  placeholder?: string
  /** 原生 maxlength，字数上限 */
  maxlength?: string | number
  /** 原生 minlength，字数下限 */
  minlength?: string | number
  /** 是否显示字数统计，仅在 text / textarea 下生效 */
  showWordLimit?: boolean
  /** 字数统计的位置，showWordLimit 为 true 时生效 */
  wordLimitPosition?: JeInputWordLimitPosition
  /** 是否可一键清空 */
  clearable?: boolean
  /** 自定义清空图标 */
  clearIcon?: JeInputIcon
  /**
   * 显示值的格式化函数，通常与 parser 成对使用。
   * 组件只把它作用在「显示」上，v-model 里始终是 parser 解析后的值。
   */
  formatter?: (value: string | number) => string
  /** 把格式化后的字符串还原成真实值的函数 */
  parser?: (value: string) => string
  /** 是否显示「切换密码可见性」按钮，type 为 password 时生效 */
  showPassword?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 尺寸，不传时取 JeConfigProvider 的全局尺寸 */
  size?: JeInputSize
  /** 前置图标 */
  prefixIcon?: JeInputIcon
  /** 后置图标 */
  suffixIcon?: JeInputIcon
  /** 文本域行数，type 为 textarea 时生效 */
  rows?: number
  /** 文本域是否自适应高度 */
  autosize?: JeInputAutosize
  /** 原生 autocomplete */
  autocomplete?: string
  /** 原生 name */
  name?: string
  /** 原生 max，type 为 number 时生效 */
  max?: string | number
  /** 原生 min，type 为 number 时生效 */
  min?: string | number
  /** 原生 step，type 为 number 时生效 */
  step?: string | number
  /** 文本域右下角的拖拽方向 */
  resize?: JeInputResize
  /** 挂载后自动聚焦 */
  autofocus?: boolean
  /** 原生 form 属性，用于关联到表单外的 <form> */
  form?: string
  /** 原生 tabindex */
  tabindex?: string | number
  /** 是否触发表单校验，false 时不把 change / focusout 冒泡给 JeFormItem */
  validateEvent?: boolean
  /** 直接作用在内部 input / textarea 上的样式 */
  inputStyle?: StyleValue
  /** 原生 inputmode，移动端唤起指定键盘 */
  inputmode?: JeInputMode
  /** 无可见标签时提供给读屏软件的说明 */
  ariaLabel?: string
  /**
   * 自定义「字数」计数函数（例如按字形簇统计 emoji）。
   * 传入后原生 maxlength / minlength 不再生效，改由组件按字形簇截断。
   */
  countGraphemes?: (value: string) => number
}
