import { createApp, h } from 'vue'
import { getJellyConfig, resolveTeleportElement } from '../../core/globalConfig'
import JeLoadingComponent from './JeLoading.vue'
import type { JeLoadingInstance, JeLoadingOptions } from './types'

export { default as JeLoading } from './JeLoading.vue'
export type { JeLoadingInstance, JeLoadingOptions } from './types'

/**
 * 命令式调用：创建全屏加载遮罩，宿主挂在配置的浮层容器上（缺省 body），
 * 返回 close 用于手动关闭。配合路由跳转、表单提交等「非模板驱动」的场景使用。
 */
export function showLoading(options: JeLoadingOptions = {}): JeLoadingInstance {
  const container = document.createElement('div')
  resolveTeleportElement(getJellyConfig().teleportTo).appendChild(container)

  const app = createApp({
    render: () =>
      h(JeLoadingComponent, {
        loading: true,
        text: options.text ?? '',
        fullscreen: options.fullscreen ?? true,
        background: options.background ?? '',
      }),
  })
  app.mount(container)

  let closed = false
  const close = () => {
    if (closed) return
    closed = true
    app.unmount()
    container.remove()
  }

  return { close }
}

/**
 * @deprecated 旧名，请改用 showLoading。
 * 原来的 jeLoading 与 kebab 标签 `<je-loading>` 解析出的小驼峰同名：同一个文件里既导入组件
 * 又导入命令式函数时，模板里写 kebab 标签会被解析成这个函数并被当成函数式组件调用。
 */
export { showLoading as jeLoading }

