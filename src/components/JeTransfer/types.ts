export interface JeTransferItem {
  key: string | number
  label: string
  disabled?: boolean
}

/** 穿梭方向：right 表示移到右侧列表，left 表示移到左侧列表 */
export type JeTransferDirection = 'left' | 'right'

/** 穿梭框尺寸档位：小 / 默认 / 大 */
export type JeTransferSize = 'small' | 'default' | 'large'
