import { createApp, defineComponent, h, reactive, TransitionGroup, type App, type CSSProperties } from 'vue'
import { getJellyConfig, resolveTeleportElement } from '../../core/globalConfig'
import { useIsMobile } from '../../core/useMediaQuery'
import { nextZIndex } from '../../core/useZIndex'
import JeNotification from './JeNotification.vue'
import type {
  JeNotificationItem,
  JeNotificationOptions,
  JeNotificationPosition,
  JeNotifyApi,
} from './types'

/** 全局通知队列：命令式容器订阅它，按 position 分四角堆叠 */
const queue = reactive<JeNotificationItem[]>([])

const positions: JeNotificationPosition[] = [
  'top-right',
  'top-left',
  'bottom-right',
  'bottom-left',
]

let seed = 0
let app: App | null = null

/** 从队列移除一条通知，并在真正消失后触发用户回调 */
const remove = (id: number) => {
  const index = queue.findIndex((item) => item.id === id)
  if (index < 0) return
  const [removed] = queue.splice(index, 1)
  removed?.onClose?.()
}

/** 内部容器：为四个角各放一个堆叠组；窄屏统一收敛到顶部通栏 */
const NotificationContainer = defineComponent({
  name: 'JeNotificationContainer',
  setup() {
    const zIndex = nextZIndex()
    const isMobile = useIsMobile()

    const groupStyle = (position: JeNotificationPosition): CSSProperties => {
      const top = 'calc(16px + env(safe-area-inset-top))'
      const bottom = 'calc(16px + env(safe-area-inset-bottom))'

      if (isMobile.value) {
        return {
          position: 'absolute',
          top,
          left: '12px',
          right: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'none',
        }
      }

      const isTop = position === 'top-right' || position === 'top-left'
      const isRight = position === 'top-right' || position === 'bottom-right'
      const style: CSSProperties = {
        position: 'absolute',
        display: 'flex',
        flexDirection: isTop ? 'column' : 'column-reverse',
        gap: '12px',
        width: '360px',
        maxWidth: 'calc(100vw - 24px)',
        pointerEvents: 'none',
      }
      if (isTop) style.top = top
      else style.bottom = bottom
      if (isRight) style.right = '20px'
      else style.left = '20px'

      return style
    }

    return () => {
      // 窄屏所有位置统一收敛到顶部，只保留一个合并的堆叠组，避免四角叠加
      const keys: JeNotificationPosition[] = isMobile.value ? ['top-right'] : positions

      return h(
        'div',
        { style: { position: 'fixed', inset: '0', zIndex, pointerEvents: 'none' } as CSSProperties },
        keys.map((position) =>
          h(
            TransitionGroup,
            { key: position, name: 'je-notify', tag: 'div', style: groupStyle(position) },
            {
              default: () =>
                queue
                  .filter(
                    (item) =>
                      isMobile.value || (item.position ?? 'top-right') === position,
                  )
                  .map((item) =>
                    h(JeNotification, {
                      key: item.id,
                      modelValue: true,
                      teleport: false,
                      position,
                      type: item.type,
                      title: item.title,
                      message: item.message,
                      duration: item.duration,
                      showClose: item.showClose,
                      onClose: () => remove(item.id),
                    }),
                  ),
            },
          ),
        ),
      )
    }
  },
})

/** 首次调用命令式 API 时才创建宿主节点并挂载容器 */
const ensureApp = () => {
  if (app || typeof document === 'undefined') return
  const host = document.createElement('div')
  resolveTeleportElement(getJellyConfig().teleportTo).appendChild(host)
  app = createApp(NotificationContainer)
  app.mount(host)
}

const createNotify = (options: JeNotificationOptions) => {
  ensureApp()
  const item: JeNotificationItem = {
    id: (seed += 1),
    type: options.type ?? 'info',
    title: options.title ?? '',
    message: options.message ?? '',
    duration: options.duration ?? 4500,
    position: options.position ?? 'top-right',
    showClose: options.showClose ?? true,
    onClose: options.onClose,
  }
  queue.push(item)
  return { close: () => remove(item.id) }
}

const jeNotify = createNotify as JeNotifyApi

jeNotify.success = (options) => createNotify({ ...options, type: 'success' })
jeNotify.info = (options) => createNotify({ ...options, type: 'info' })
jeNotify.warning = (options) => createNotify({ ...options, type: 'warning' })
jeNotify.error = (options) => createNotify({ ...options, type: 'error' })

/** 顺手挂在组件上，`JeNotification.success(...)` 也能用 */
;(JeNotification as typeof JeNotification & { notify: JeNotifyApi }).notify = jeNotify

export { JeNotification, jeNotify }
export type {
  JeNotificationInstance,
  JeNotificationItem,
  JeNotificationOptions,
  JeNotificationPosition,
  JeNotificationType,
  JeNotifyApi,
} from './types'
