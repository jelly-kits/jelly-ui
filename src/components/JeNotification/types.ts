export type JeNotificationType = 'success' | 'info' | 'warning' | 'error'

export type JeNotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

/** 命令式调用参数 */
export interface JeNotificationOptions {
  title?: string
  message?: string
  type?: JeNotificationType
  /** 自动关闭延迟（毫秒），0 表示不自动关闭 */
  duration?: number
  position?: JeNotificationPosition
  showClose?: boolean
  /** 通知关闭后回调 */
  onClose?: () => void
}

/** 队列里的一条通知 */
export interface JeNotificationItem extends JeNotificationOptions {
  id: number
}

/** 命令式调用返回的实例句柄 */
export interface JeNotificationInstance {
  close: () => void
}

/** jeNotify 函数的完整签名（含快捷方法） */
export interface JeNotifyApi {
  (options: JeNotificationOptions): JeNotificationInstance
  success(options: JeNotificationOptions): JeNotificationInstance
  info(options: JeNotificationOptions): JeNotificationInstance
  warning(options: JeNotificationOptions): JeNotificationInstance
  error(options: JeNotificationOptions): JeNotificationInstance
}
