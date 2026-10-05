import { createApp, defineComponent, h, reactive, TransitionGroup, type App, type CSSProperties } from 'vue'
import { getJellyConfig, resolveTeleportElement } from '../../core/globalConfig'
import { nextZIndex } from '../../core/useZIndex'
import JeMessage from './JeMessage.vue'
import type {
  JeMessageApi,
  JeMessageInstance,
  JeMessageItem,
  JeMessageOptions,
} from './types'

/** 全局消息队列：命令式容器订阅它，push / splice 都会驱动堆叠视图更新 */
const queue = reactive<JeMessageItem[]>([])

let seed = 0
let app: App | null = null

/** 从队列移除一条消息，并在真正消失后触发用户回调 */
const remove = (id: number) => {
  const index = queue.findIndex((item) => item.id === id)
  if (index < 0) return
  const [removed] = queue.splice(index, 1)
  removed?.onClose?.()
}

/** 内部容器：顶部居中、纵向堆叠所有消息，只挂载一次 */
const MessageContainer = defineComponent({
  name: 'JeMessageContainer',
  setup() {
    const zIndex = nextZIndex()

    const containerStyle = (): CSSProperties => ({
      position: 'fixed',
      top: '0',
      left: '50%',
      zIndex,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      width: '380px',
      maxWidth: 'calc(100vw - 32px)',
      paddingTop: `calc(${queue[0]?.offset ?? 20}px + env(safe-area-inset-top))`,
      transform: 'translateX(-50%)',
      pointerEvents: 'none',
    })

    return () =>
      h(
        TransitionGroup,
        { name: 'je-msg', tag: 'div', style: containerStyle() },
        {
          default: () =>
            queue.map((item) =>
              h(JeMessage, {
                key: item.id,
                modelValue: true,
                teleport: false,
                type: item.type,
                message: item.message,
                duration: item.duration,
                showClose: item.showClose,
                onClose: () => remove(item.id),
              }),
            ),
        },
      )
  },
})

/** 首次调用命令式 API 时才创建宿主节点并挂载容器 */
const ensureApp = () => {
  if (app || typeof document === 'undefined') return
  const host = document.createElement('div')
  resolveTeleportElement(getJellyConfig().teleportTo).appendChild(host)
  app = createApp(MessageContainer)
  app.mount(host)
}

const createMessage = (options: JeMessageOptions): JeMessageInstance => {
  ensureApp()
  const item: JeMessageItem = {
    id: (seed += 1),
    type: options.type ?? 'info',
    message: options.message ?? '',
    duration: options.duration ?? 3000,
    showClose: options.showClose ?? false,
    offset: options.offset ?? 20,
    onClose: options.onClose,
  }
  queue.push(item)
  return { close: () => remove(item.id) }
}

const showMessage = createMessage as JeMessageApi

showMessage.success = (message, duration) => createMessage({ type: 'success', message, duration })
showMessage.info = (message, duration) => createMessage({ type: 'info', message, duration })
showMessage.warning = (message, duration) => createMessage({ type: 'warning', message, duration })
showMessage.error = (message, duration) => createMessage({ type: 'error', message, duration })

/** 顺手挂在组件上，`JeMessage.success(...)` 也能用 */
;(JeMessage as typeof JeMessage & { message: JeMessageApi }).message = showMessage

export { JeMessage, showMessage }

/**
 * @deprecated 旧名，请改用 showMessage。
 * 原来的 jeMessage 与 kebab 标签 `<je-message>` 解析出的小驼峰同名：同一个文件里既导入组件
 * 又导入命令式函数时，模板里写 kebab 标签会被解析成这个函数并被当成函数式组件调用。
 */
export { showMessage as jeMessage }

export type {
  JeMessageApi,
  JeMessageInstance,
  JeMessageItem,
  JeMessageOptions,
  JeMessageType,
} from './types'
