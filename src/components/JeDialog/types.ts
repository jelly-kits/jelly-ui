import type { Component, VNodeChild } from 'vue'
import type { JeTeleportTarget } from '../../core/globalConfig'
import type { JeIconName } from '../JeIcon/icons'

/** before-close 的收尾函数：调用它才真正关闭；传 true 表示这次是「取消」 */
export type JeDialogDone = (cancel?: boolean) => void

/**
 * before-close 钩子。
 * 适用于提交前校验、二次确认这类「可能拦住关闭」的场景：不调用 done 面板就保持打开。
 */
export type JeDialogBeforeClose = (done: JeDialogDone) => void

/**
 * 内置页脚的布局。
 * inline 横排右对齐；stacked 竖排、按钮铺满并带一条分隔线；auto 由窄屏判定在两者间自动切换。
 */
export type JeDialogFooterLayout = 'inline' | 'stacked' | 'auto'

/** JeDialog 的属性。单独成文件一是让源码保持可读，二是 scripts/gen-api.mjs 会顺着相对 import 跨文件读 JSDoc */
export interface JeDialogProps {
  /** 控制显隐（v-model） */
  modelValue?: boolean
  /** 标题文案；用 header 插槽时它仍作为无障碍名称 */
  title?: string
  /** 数字按 px 处理；窄屏会自动占满可用宽度 */
  width?: string | number
  /** 是否显示右上角关闭按钮 */
  showClose?: boolean
  /** 自定义关闭图标：传图标名走内置 JeIcon，传组件则原样渲染 */
  closeIcon?: JeIconName | Component
  /** 点击遮罩关闭 */
  closeOnClickModal?: boolean
  /** 按 Esc 关闭 */
  closeOnPressEscape?: boolean
  /** closeOnEscape 的同义项（closeOnPressEscape 优先），保留是为了不破坏老代码 */
  closeOnEscape?: boolean
  /**
   * 关闭前的钩子：拿到 done 后自己决定何时放行。
   * 「点关闭按钮 / 点遮罩 / 按 Esc」以及「点内置页脚的确认 / 取消按钮」都会走它；
   * 页脚用 #footer 插槽自绘按钮时不经过这里，请在按钮自己的事件里处理
   */
  beforeClose?: JeDialogBeforeClose
  /** 确认按钮文案；传入即渲染内置页脚（默认不传，页脚仍由 #footer 插槽负责） */
  confirmButtonText?: string
  /** 取消按钮文案；传入即在内置页脚里显示取消按钮 */
  cancelButtonText?: string
  /** 显示内置页脚的取消按钮（未传 cancelButtonText 时用默认文案「取消」；二者满足其一即显示） */
  showCancelButton?: boolean
  /** 内置页脚的布局，默认 auto（窄屏竖排、宽屏横排）；使用 #footer 插槽时该属性不生效 */
  footerLayout?: JeDialogFooterLayout
  /** 关闭后销毁默认插槽内容（配合 v-if 的惰性渲染，减少关闭态下的 DOM 开销） */
  destroyOnClose?: boolean
  /** 允许拖拽标题栏移动面板 */
  draggable?: boolean
  /** 占满整个视口，忽略 width / top / draggable */
  fullscreen?: boolean
  /** 内容整体居中（面板水平垂直居中，同时页头页脚文字居中） */
  alignCenter?: boolean
  /** 仅页头文字与页脚按钮水平居中，面板位置不变 */
  center?: boolean
  /** 面板与视口顶部的距离（如 15vh），传入即改为顶部对齐排版 */
  top?: string
  /**
   * 窄屏（≤768px）改成贴底弹出层（移动端 action sheet 形态）。
   * 默认 false：移动端与 Element Plus / Vant 的对话框一致，仍是一张垂直居中的卡片。
   * 贴底适合「一屏放不下、要露出后面内容」的场景，但会失去垂直居中，按需开启。
   */
  bottomSheet?: boolean
  /** 浮层挂载的节点选择器或元素；嵌套对话框时用于脱离父级层叠上下文（旧写法，请优先用 teleportTo） */
  appendTo?: string | HTMLElement
  /** 强制挂到 body 上，优先级高于 appendTo（旧写法，请优先用 teleportTo） */
  appendToBody?: boolean
  /** 浮层挂载点：选择器或元素；false 表示就地渲染不传送。缺省时按 ConfigProvider → configureJelly → body 回退 */
  teleportTo?: JeTeleportTarget | false
  /** 打开时锁定页面滚动 */
  lockScroll?: boolean
  /** 把 Tab 焦点圈在面板内 */
  trapFocus?: boolean
  /** 面板层级，不传则按打开顺序自动递增 */
  zIndex?: number
}

/** JeDialog 的事件。事件本身写在 SFC 里（生成器只认内联 defineEmits），这里只留类型说明 */
export interface JeDialogEmits {
  /** v-model 的 modelValue 更新时触发 */
  'update:modelValue': [value: boolean]
  /** 开始打开（面板尚未完成入场动画） */
  open: []
  /** 打开动画结束后触发，首次需要摸 DOM 时用它 */
  opened: []
  /** 面板实际开始收起时触发，被 beforeClose 拦下则不会触发 */
  close: []
  /** 收起动画结束、面板不可见后触发 */
  closed: []
  /** 内置页脚的确认按钮走完流程后触发（beforeClose 拦下时不触发） */
  confirm: []
  /** 内置页脚的取消按钮走完流程后触发（beforeClose 拦下时不触发） */
  cancel: []
}

/** 面板上的公开方法。定义同样写在 SFC 的 defineExpose 里，这里只作类型参考 */
export interface JeDialogExpose {
  /** 走一遍完整的关闭流程（含 beforeClose），供外部按钮复用 */
  handleClose: () => void
  /** 把拖拽产生的位移清零，回到初始位置 */
  resetPosition: () => void
  /** 从「取消」这一侧收尾：走 beforeClose，放行后触发 cancel 事件；命令式 API 用它拿到 'cancel' 动作 */
  handleCancel: () => void
}

/** 命令式实例额外用到的方法，配合 JeDialogExpose 描述组件实例的完整暴露面 */
export interface JeDialogImperativeExpose extends JeDialogExpose {
  /** 从「确认」这一侧收尾：走 beforeClose，放行后触发 confirm 事件 */
  handleConfirm: () => void
}

/** 对话框的最终去向：确认 / 取消 / 被外部关掉（点遮罩、按 Esc、或调 handler.close()） */
export type JeDialogAction = 'confirm' | 'cancel' | 'close'

/** showDialog() 返回的句柄 */
export interface JeDialogHandler {
  /** 手动关闭，等价于点遮罩 / 按 Esc；会走一遍关闭动画再销毁 */
  close: () => void
}

/** 命令式调用参数：复用组件 props（modelValue 由 API 自己掌管），再补上正文与页脚开关 */
export interface JeDialogOptions extends Omit<JeDialogProps, 'modelValue' | 'beforeClose'> {
  /**
   * 正文内容：字符串直接当文本渲染，也可以传一个返回 VNode 的函数（如 () => h(JeInput, ...)）。
   * 需要更复杂的结构时请直接用组件式写法配默认插槽。
   */
  message?: string | (() => VNodeChild)
  /** 确认按钮文案，默认「确定」 */
  confirmButtonText?: string
  /** 取消按钮文案，默认「取消」；alert 不显示取消按钮 */
  cancelButtonText?: string
  /** 关闭前钩子；内置确认 / 取消按钮同样会经过它，用法与组件 props 一致 */
  beforeClose?: JeDialogBeforeClose
}

/** showDialog 的完整签名（含 confirm / alert 快捷方法） */
export interface JeDialogApi {
  (options: JeDialogOptions): Promise<JeDialogAction> & JeDialogHandler
  confirm(options: JeDialogOptions): Promise<JeDialogAction>
  /** 只有确认按钮的单键对话框 */
  alert(options: JeDialogOptions): Promise<JeDialogAction>
}
