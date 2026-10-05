import type { InjectionKey } from 'vue'

/** 节点状态 */
export type JeStepStatus = 'wait' | 'process' | 'finish' | 'error' | 'success'
/** 排列方向 */
export type JeStepsDirection = 'horizontal' | 'vertical'

/** 父级下发给子项的上下文 */
export interface JeStepsContext {
  /** 读取当前激活下标 */
  getActive: () => number
  /** 读取「已完成」节点使用的状态 */
  getFinishStatus: () => JeStepStatus
  /** 读取「进行中」节点使用的状态 */
  getProcessStatus: () => JeStepStatus
  /** 注册子项，父级据此分配下标 */
  registerStep: (uid: string) => void
  /** 注销子项 */
  unregisterStep: (uid: string) => void
  /** 子项在父级中的下标 */
  indexOf: (uid: string) => number
  /** 子项总数 */
  count: () => number
}

/** 子项通过它拿到父级 active 与自身下标 */
export const jeStepsKey: InjectionKey<JeStepsContext> = Symbol('jeSteps')
