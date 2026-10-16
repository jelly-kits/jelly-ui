import type { Editor } from '@tiptap/core'
import type { JeIconName } from '../JeIcon/icons'

/** 编辑器 v-model 的取值格式 */
export type JeEditorValueType = 'html' | 'json'

/**
 * 文档 JSON 的结构（Tiptap / ProseMirror 的 `getJSON()` 结果）。
 *
 * 这里只按结构声明，不引 @tiptap/core 的类型：编辑器是可选子入口，
 * 对外 API 的类型不该把 tiptap 的包带进消费端的类型解析里。
 */
export interface JeEditorJSON {
  type: string
  attrs?: Record<string, unknown>
  content?: JeEditorJSON[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

/** 编辑器取值：html 格式是字符串，json 格式是文档对象 */
export type JeEditorValue = string | JeEditorJSON

/**
 * 工具栏里的内置按钮。
 *
 * 只有这些 key 是组件认识的，其余一律按 JeEditorButton 处理 ——
 * 所以 toolbar 数组既能当「白名单」用，也能往里混自定义按钮。
 */
export type JeEditorToolKey =
  | 'heading1'
  | 'heading2'
  | 'paragraph'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'bulletList'
  | 'orderedList'
  | 'link'
  | 'image'
  | 'video'
  | 'undo'
  | 'redo'

/**
 * 自定义按钮的回调参数。
 *
 * 这里从 @tiptap/core 取 Editor 类型，是因为「自定义按钮」必然要拿编辑器实例去执行命令，
 * 不给类型等于把宿主推到 any（组件的 d.ts 因 defineExpose 里的 editor 本来就引了 tiptap）。
 * 取 core 的那份而不是 @tiptap/vue-3 的：vue-3 的 Editor 是它的子类，写 core 的两种都能收。
 */
export interface JeEditorButtonContext {
  /** Tiptap 编辑器实例（组件挂载完成前是 undefined） */
  editor: Editor | undefined
  /** 光标处是否处于某节点 / 标记状态，等价于 editor.isActive(name, attrs) */
  isActive: (name: string, attributes?: Record<string, unknown>) => boolean
}

/** 工具栏里的自定义按钮 */
export interface JeEditorButton {
  /** 唯一标识（同时用作 v-for 的 key），与内置 key 重名时以后者优先 */
  key: string
  /** 悬停提示与读屏文案 */
  title: string
  /** JeIcon 的图标名，与 text 二选一（都给时以 text 优先） */
  icon?: JeIconName
  /** 文字按钮的文案，与 icon 二选一 */
  text?: string
  /** 点击回调 */
  onClick: (context: JeEditorButtonContext) => void
  /** 是否显示选中态，编辑器每次状态变化都会重算 */
  isActive?: (context: JeEditorButtonContext) => boolean
  /** 是否禁用；不传时跟随组件的 disabled */
  disabled?: boolean | ((context: JeEditorButtonContext) => boolean)
}

/** 工具栏条目：内置按钮写 key、自定义按钮写对象、'divider' 画一条分组竖线 */
export type JeEditorToolbarItem = JeEditorToolKey | 'divider' | JeEditorButton

/** 上传回调的第二个参数 */
export interface JeEditorUploadOptions {
  /** 进度回调，入参是 0-100 的百分比 */
  onProgress: (percent: number) => void
}

/**
 * 上传回调：拿到文件返回可访问的资源地址，编辑器把它插到当前光标处。
 *
 * 上传过程自己实现（自带接口时最省事），编辑器只负责显示进度与插入结果：
 * ```ts
 * const upload: JeEditorUpload = async (file, { onProgress }) => {
 *   const form = new FormData()
 *   form.append('file', file)
 *   const { url } = await api.post('/upload', form, { onUploadProgress: (e) => onProgress(Math.round((e.loaded / e.total) * 100)) })
 *   return url
 * }
 * ```
 */
export type JeEditorUpload = (file: File, options: JeEditorUploadOptions) => Promise<string>

/** 批量上传回调的第二个参数 */
export interface JeEditorUploadFilesOptions {
  /** 单个文件的进度：index 是它在入参数组里的下标，percent 是 0-100 */
  onFileProgress: (index: number, percent: number) => void
  /**
   * 整体进度（0-100）。与 onFileProgress 是「谁后调谁生效」的关系：
   * 宿主能自己算整体进度就只调它，否则调 onFileProgress，组件会按「已完成文件数 + 当前文件百分比」推算。
   */
  onProgress: (percent: number) => void
}

/**
 * 批量上传回调：一次拿到多个文件，返回地址数组（顺序与入参一致）。
 *
 * 多图上传时传了它就走它 —— 并发多少、要不要合并成一个请求由宿主决定；
 * 不传则组件退化成「逐个调用 JeEditorUpload」（串行）。
 */
export type JeEditorUploadFiles = (
  files: File[],
  options: JeEditorUploadFilesOptions,
) => Promise<string[]>
