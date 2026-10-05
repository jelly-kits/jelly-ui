import { createApp, defineComponent, h, ref, type App } from 'vue'
import { getJellyConfig, resolveTeleportElement } from '../../core/globalConfig'
import JeDialog from './JeDialog.vue'
import type {
  JeDialogAction,
  JeDialogApi,
  JeDialogHandler,
  JeDialogImperativeExpose,
  JeDialogOptions,
} from './types'

/**
 * 命令式对话框：每次调用创建独立实例（自己的宿主节点 + 自己的 app），
 * 关闭动画跑完后再统一卸载并移除宿主节点，所以既不会共享状态、也不会残留 DOM。
 *
 * 关于返回值：这里故意与 Vant 不同 —— 一律 resolve 成 'confirm' | 'cancel' | 'close'，从不 reject。
 * Vant 在取消时 reject，调用方稍不注意就会产生没人接的 unhandled rejection；
 * 而动作字符串既能避免这个坑，又比「成功 / 失败」多带了「是不是被遮罩 / Esc 关掉的」这层信息。
 * 代价是写法上要自己判字符串，不能直接 await 成功分支：
 *
 *   const action = await showDialog.confirm({ message: '确定删除？' })
 *   if (action === 'confirm') { ... }
 *
 * 三者的判定：'confirm' / 'cancel' 来自内置页脚那两个按钮，点遮罩、按 Esc、或调 handler.close()
 * 都是 'close'。Promise 在「面板确实收起」时才兑现（也就是组件的 closed 事件），
 * 所以 beforeClose 拦下这次关闭时 Promise 会继续保持 pending —— 面板还开着，就不该先说结果。
 */
export function showDialog(options: JeDialogOptions): Promise<JeDialogAction> & JeDialogHandler {
  const {
    title,
    message,
    confirmButtonText,
    cancelButtonText,
    showCancelButton,
    beforeClose,
    ...rest
  } = options

  // 宿主节点：挂在配置的浮层容器上（缺省 body），卸载 app 之后再 remove，避免留下空 div
  const host = document.createElement('div')
  resolveTeleportElement(getJellyConfig().teleportTo).appendChild(host)

  let app: App | null = null
  let settled = false
  let resolveAction: (action: JeDialogAction) => void = () => {}
  /** 被点下的动作：面板真正收起时再据此 resolve，见下面 onClosed 的说明 */
  let action: JeDialogAction | undefined

  const dialogRef = ref<JeDialogImperativeExpose | null>(null)

  /**
   * 命令式实例必须自己持有可见性。
   *
   * JeDialog 是受控组件：它关闭时只 emit 一个 update:modelValue(false)，
   * 真正收起与否取决于父级有没有把新值接回去。早先这里把 modelValue 写死成 true、
   * 也没接 update:modelValue，于是「点确认 → 组件请求关闭 → 没人理 → 面板永远开着」，
   * 连带 closed 不触发、Promise 不兑现、宿主节点也不释放。
   */
  const visible = ref(true)

  const promise = new Promise<JeDialogAction>((resolve) => {
    resolveAction = resolve
  })

  /** 卸载 app 并移除宿主节点；先置空 app 让重复调用变成空操作 */
  const release = () => {
    if (!app) return
    app.unmount()
    app = null
    dialogRef.value = null
    host.remove()
  }

  /** 收尾：每个实例只兑现一次，兑现前先把实例卸干净，保证不泄漏 */
  const settle = (next: JeDialogAction) => {
    if (settled) return
    settled = true
    release()
    resolveAction(next)
  }

  const Dialog = defineComponent({
    name: 'JeDialogImperative',
    setup() {
      return () =>
        h(
          JeDialog,
          {
            ...rest,
            modelValue: visible.value,
            // 接住组件的关闭请求，否则面板关不掉（见上面 visible 的说明）
            'onUpdate:modelValue': (next: boolean) => {
              visible.value = next
            },
            title,
            beforeClose,
            confirmButtonText,
            cancelButtonText,
            showCancelButton,
            // 函数 ref：挂载后拿到实例，取消 / 手动关闭都要复用它内部的收尾逻辑
            ref: (instance: unknown) => {
              dialogRef.value = (instance as JeDialogImperativeExpose | null) ?? null
            },
            /*
             * 事件只是「记下用户点了什么」，真正的 resolve 放在 closed 那一刻：
             * 组件的 confirm / cancel 事件在 beforeClose 之前就发了，若在这里就 resolve，
             * 会出现「Promise 已经给了 confirm、面板却被 beforeClose 拦下还开着」的矛盾状态。
             * 于是：面板收起时按记下的动作 resolve；没有任何动作（点遮罩 / Esc / handler.close()）
             * 就 resolve 'close'；alert 的确认按钮点了就等于确认，不因随后的收起而变成 'close'。
             */
            onConfirm: () => {
              action = 'confirm'
            },
            onCancel: () => {
              action = 'cancel'
            },
            onClosed: () => {
              settle(!action || action === 'close' ? 'close' : action)
            },
          },
          message === undefined
            ? undefined
            : { default: () => (typeof message === 'function' ? message() : message) },
        )
    },
  })

  app = createApp(Dialog)
  app.mount(host)

  return Object.assign(promise, {
    close: () => {
      // 等价于点遮罩 / 按 Esc：走组件的 handleClose（含 beforeClose），动画结束后由 closed 收尾
      action = 'close'
      dialogRef.value?.handleClose()
    },
  })
}

/** 双键对话框：确认 / 取消都在，关闭动作与组件式写法完全一致 */
showDialog.confirm = (options: JeDialogOptions): Promise<JeDialogAction> =>
  showDialog({
    showCancelButton: true,
    ...options,
    confirmButtonText: options.confirmButtonText ?? '确定',
    cancelButtonText: options.cancelButtonText ?? '取消',
  })

/** 单键对话框：只有确认按钮，点确认 resolve 'confirm'，遮罩 / Esc 关掉 resolve 'close' */
showDialog.alert = (options: JeDialogOptions): Promise<JeDialogAction> =>
  showDialog({
    ...options,
    showCancelButton: false,
    cancelButtonText: undefined,
    confirmButtonText: options.confirmButtonText ?? '知道了',
  })

/** 顺手挂在组件上，`JeDialog.confirm(...)` 也能用（与 JeMessage.message 的既有做法一致） */
;(JeDialog as typeof JeDialog & { dialog: JeDialogApi }).dialog = showDialog

/**
 * @deprecated 旧名，请改用 showDialog。
 * 原来的 jeDialog 与 kebab 标签 `<je-dialog>` 解析出的小驼峰同名：同一个文件里既导入组件
 * 又导入命令式函数时，模板里写 kebab 标签会被解析成这个函数并被当成函数式组件调用。
 */
export { showDialog as jeDialog }

export { showDialog as default }

