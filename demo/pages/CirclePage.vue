<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeCircle, JeSpace } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const value = ref(30)
const step = (delta: number) => {
  value.value = Math.min(100, Math.max(0, value.value + delta))
}

const positions = ['top', 'right', 'bottom', 'left'] as const
type Position = (typeof positions)[number]

const position = ref<Position>('top')
const clockwise = ref(true)

/** 按当前值取色：超过 60 用成功色，否则用警告色 */
const dynamicColor = (current: number) => (current > 60 ? 'var(--je-success)' : 'var(--je-warning)')
</script>

<template>
  <DemoPage
    title="Circle 环形进度"
    description="内联 SVG 绘制的环形进度，支持渐变填充、自定义起始位置与绘制方向，数值变化由 requestAnimationFrame 补间。"
  >
    <DemoBlock
      title="基础用法"
      description="size 控制直径，speed 用来反推动画时长（置为 2 时走满一圈约 0.5s），用加减按钮改变当前值。"
    >
      <div class="row">
        <je-circle :model-value="value" :size="120" :speed="2">
          <span class="percent">{{ value }}%</span>
        </je-circle>
        <je-space>
          <je-button variant="ghost" @click="step(-10)">-10</je-button>
          <je-button @click="step(10)">+10</je-button>
        </je-space>
      </div>
      <p class="hint">当前值：{{ value }} / 100</p>
    </DemoBlock>

    <DemoBlock title="rate 与 color" description="rate 决定总量；color 可传单色、色数组或按当前值取色的函数。">
      <div class="row">
        <je-circle :model-value="3" :rate="10">
          <span class="percent">3/10</span>
        </je-circle>
        <je-circle :model-value="72" color="#38bdf8" />
        <je-circle :model-value="72" :color="dynamicColor" />
      </div>
    </DemoBlock>

    <DemoBlock
      title="渐变填充"
      description="fill 为 gradient 时用 linearGradient 填充，取色顺序为 linearGradient 或 color 数组的前两色；solid 取第一个色。"
    >
      <div class="row">
        <je-circle :model-value="68" fill="gradient" :stroke-width="24">
          <span class="percent">68%</span>
        </je-circle>
        <je-circle
          :model-value="68"
          fill="gradient"
          :stroke-width="24"
          :linear-gradient="['#f59e0b', '#ef4444']"
        >
          <span class="percent">68%</span>
        </je-circle>
        <je-circle :model-value="68" fill="solid" color="#22c55e" />
      </div>
    </DemoBlock>

    <DemoBlock
      title="起始位置与方向"
      description="startPosition 决定弧形起点，clockwise 为 false 时逆时针绘制（起点取左右互换后的角度）。"
    >
      <div class="row">
        <je-circle :model-value="65" :start-position="position" :clockwise="clockwise">
          <span class="percent">{{ position }}</span>
        </je-circle>
        <je-space wrap>
          <je-button
            v-for="item in positions"
            :key="item"
            :variant="item === position ? 'primary' : 'ghost'"
            size="small"
            @click="position = item"
          >
            {{ item }}
          </je-button>
        </je-space>
      </div>
      <div class="toolbar">
        <je-button variant="ghost" size="small" @click="clockwise = !clockwise">
          {{ clockwise ? '当前：顺时针' : '当前：逆时针' }}
        </je-button>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.percent {
  font-size: 18px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--je-text);
}

.hint {
  margin: 14px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.toolbar {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .row {
    gap: 14px;
  }

  .percent {
    font-size: 15px;
  }
}
</style>