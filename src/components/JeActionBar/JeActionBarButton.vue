<script setup lang="ts">
import { computed } from 'vue'
import JeButton from '../JeButton/JeButton.vue'
import { useJeConfig } from '../JeConfigProvider/types'
import type { JeButtonSize, JeButtonType } from '../JeButton/types'

defineOptions({ name: 'JeActionBarButton' })

const props = withDefaults(
  defineProps<{
    /** 按钮文字，默认插槽可覆盖 */
    text?: string
    /** 语义类型 */
    type?: JeButtonType
    /** 尺寸，不传时取全局配置 */
    size?: JeButtonSize
    /** 加载中 */
    loading?: boolean
    /** 禁用 */
    disabled?: boolean
  }>(),
  {
    text: '',
    type: 'primary',
    size: undefined,
    loading: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  /** 点击按钮 */
  click: []
}>()

const config = useJeConfig()

/** default 等同于不传，避免 JeButton 多出无意义的尺寸值 */
const buttonSize = computed<JeButtonSize | undefined>(() => {
  const size = props.size ?? config.size.value
  return size === 'default' ? undefined : size
})
</script>

<template>
  <div class="je-action-bar-button">
    <JeButton
      :type="type"
      :size="buttonSize"
      :loading="loading"
      :disabled="disabled"
      block
      round
      @click="emit('click')"
    >
      <slot>{{ text }}</slot>
    </JeButton>
  </div>
</template>

<style scoped>
.je-action-bar-button {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  min-width: 0;
}
</style>