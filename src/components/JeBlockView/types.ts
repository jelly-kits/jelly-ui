import type { JeBlock, JeBlockDocument } from '../JeBlockEditor/types'

/** 渲染组件收的值：完整文档（带 version）或只给块数组都行 */
export type JeBlockViewValue = JeBlockDocument | JeBlock[]
