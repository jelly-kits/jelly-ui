import { mergeAttributes, Node } from '@tiptap/core'

export interface JeVideoOptions {
  /** 追加到最外层包裹元素上的属性 */
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    jeVideo: {
      /** 在当前光标处插入一个视频 */
      setVideo: (options: { src: string; poster?: string }) => ReturnType
    }
  }
}

/**
 * 视频节点：块级原子节点，渲染成一个带原生控制条的 `<video>`。
 *
 * 名字带 `je` 前缀，避免与社区里的 video 扩展重名（同名会让 schema 直接冲突）。
 * 只存 src / poster，不做对齐与文字环绕 —— 简单版的取舍。
 */
export const JeVideo = Node.create<JeVideoOptions>({
  name: 'jeVideo',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return { HTMLAttributes: {} }
  },

  addAttributes() {
    return {
      src: { default: null },
      // poster 缺省是 null，直接渲染会写出 poster="null"，所以只在有值时才落到 DOM 上
      poster: {
        default: null,
        renderHTML: (attributes) => (attributes.poster ? { poster: attributes.poster } : {}),
      },
    }
  },

  parseHTML() {
    // 认自家渲染出来的结构，也认从别处粘进来的裸 <video src>
    return [{ tag: 'video[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, { 'data-je-video': '' }),
      ['video', mergeAttributes(HTMLAttributes, { controls: 'true', playsinline: 'true' })],
    ]
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    }
  },
})
