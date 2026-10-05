<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, useId } from 'vue'
import { JE_CAROUSEL_KEY } from './types'

defineOptions({ name: 'JeCarouselItem' })

const props = defineProps<{ name?: string | number }>()

const uid = useId()
/** 单独使用时注入不到父级，这里要允许为空 */
const carousel = inject(JE_CAROUSEL_KEY, null)

onMounted(() => carousel?.register({ uid, name: props.name }))
onBeforeUnmount(() => carousel?.unregister(uid))
</script>

<template>
  <div
    class="je-carousel__item"
    role="group"
    aria-roledescription="slide"
    :aria-label="name === undefined ? undefined : String(name)"
  >
    <slot />
  </div>
</template>

<style scoped>
.je-carousel__item {
  flex: 0 0 100%;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
