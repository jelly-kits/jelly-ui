/** 文件状态：ready 待上传 / uploading 上传中 / success 成功 / fail 失败 */
export type JeUploadStatus = 'ready' | 'uploading' | 'success' | 'fail'

/** 列表展现形式：text 文本 / picture 图文 / picture-card 照片墙 */
export type JeUploadListType = 'text' | 'picture' | 'picture-card'

/** 单次请求要携带的表单字段；值支持 Blob 与 [值, 文件名] 元组，便于一次提交多份内容 */
export type JeUploadData = Record<string, string | Blob | [string | Blob, string] | string[]>

/** 上传进度事件：原生 ProgressEvent 上补一个百分比，省得使用方自己算 */
export interface JeUploadProgressEvent extends ProgressEvent {
  percent: number
}

/**
 * 自定义上传时收到的请求参数。
 * 三个回调各自只负责「把结果告诉组件」，组件据此推进文件状态并抛出事件，
 * 因此 httpRequest 里不需要、也不应该自己去改 fileList。
 */
export interface JeUploadRequestOptions {
  /** 请求地址，即 action */
  action: string
  /** 请求方法，即 method */
  method: string
  /** 文件字段名，即 name */
  name: string
  /** 原始 File 对象 */
  file: File
  /** 文件名（含扩展名） */
  filename: string
  /** 请求头 */
  headers: Record<string, string>
  /** 表单附加字段 */
  data: JeUploadData
  /** 是否携带 Cookie */
  withCredentials: boolean
  /** 通知组件上传成功，response 会写入 file.response */
  onSuccess: (response: unknown) => void
  /** 通知组件上传失败 */
  onError: (error: Error) => void
  /** 上报进度，组件会据此更新百分比并抛出 progress */
  onProgress: (event: JeUploadProgressEvent) => void
}

/**
 * 自定义上传函数。除了返回 XHR（由组件调用 abort 取消），
 * 也允许只返回 Promise；这种情况下若要支持取消，请把 abort 挂在 Promise 上——
 * 组件的 abort() 会优先找它，找不到就只能让请求自然结束（不引第三方依赖的前提下的折中）。
 */
export type JeUploadRequestHandler = (
  options: JeUploadRequestOptions,
) => XMLHttpRequest | (Promise<unknown> & { abort?: () => void })

/** 允许异步：beforeUpload 可以返回 Promise */
export type JeUploadAwaitable<T> = T | Promise<T>

/** 返回 false / 被 reject 的 Promise 会中止该文件的上传，返回 File / Blob 则替换掉原始文件 */
export type JeUploadBeforeUpload = (
  rawFile: File,
) => JeUploadAwaitable<void | undefined | null | boolean | File | Blob>

/** 返回 false / 被 reject 的 Promise 会阻止移除 */
export type JeUploadBeforeRemove = (
  file: JeUploadFile,
  files: JeUploadFile[],
) => JeUploadAwaitable<boolean>

/** 表单附加字段：静态对象、Promise，或按文件动态计算的函数 */
export type JeUploadFormData = JeUploadData | (() => JeUploadAwaitable<JeUploadData>)

export interface JeUploadFile {
  name: string
  url?: string
  size?: number
  status?: JeUploadStatus
  /** 上传进度百分比（0~100），上传中才更新 */
  percentage?: number
  /** 服务端响应体，仅在 httpRequest / onSuccess 里能拿到 */
  response?: unknown
  raw?: File
}

/**
 * 列表项回调。写成类型别名而不是内联联合，是为了让自动生成的 API 表里
 * 「类型」一列保持简短可读（脚本只取源码里的类型文本，不会展开别名）。
 */
export type JeUploadOnChange = (file: JeUploadFile, files: JeUploadFile[]) => void
export type JeUploadOnRemove = (file: JeUploadFile, files: JeUploadFile[]) => void
export type JeUploadOnPreview = (file: JeUploadFile) => void
export type JeUploadOnProgress = (
  event: JeUploadProgressEvent,
  file: JeUploadFile,
  files: JeUploadFile[],
) => void
export type JeUploadOnSuccess = (
  response: unknown,
  file: JeUploadFile,
  files: JeUploadFile[],
) => void
export type JeUploadOnError = (error: Error, file: JeUploadFile, files: JeUploadFile[]) => void
export type JeUploadOnExceed = (incoming: File[], files: JeUploadFile[]) => void
