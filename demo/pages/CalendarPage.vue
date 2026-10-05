<script setup lang="ts">
import { ref } from 'vue'
import { JeCalendar } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const date = ref<Date | undefined>(undefined)
const panel = ref<Date | null>(null)
const demoRange: [Date, Date] = [new Date(2026, 9, 6), new Date(2026, 9, 20)]

const show = (value: Date | undefined) => (value ? value.toLocaleDateString() : 'null')

const onPanelChange = (value: Date) => {
  panel.value = value
}
</script>

<template>
  <DemoPage
    title="Calendar 日历"
    description="内联的完整月历，支持今天按钮、月份切换与区间高亮，并可通过 date-cell 插槽自定义单元格内容。窄屏下每格不小于 44px，容器可横向滚动。"
  >
    <DemoBlock title="基础用法" description="点击日期即可选中，头部可翻月，也可一键回到今天。">
      <je-calendar v-model="date" @panel-change="onPanelChange" />
      <p class="state">
        选中：{{ show(date) }} · 当前面板：{{ panel ? show(panel) : '—' }}
      </p>
    </DemoBlock>

    <DemoBlock title="区间高亮" description="传入 range 后，起点、终点与中间区间会同时高亮。">
      <je-calendar v-model="date" :range="demoRange" />
    </DemoBlock>

    <DemoBlock title="自定义单元格" description="用 date-cell 插槽拿到 { date, data }，自由渲染单元格。">
      <je-calendar v-model="date">
        <template #date-cell="{ date: day, data }">
          <span class="custom-cell" :class="{ 'is-marked': data.isToday }">{{ day.getDate() }}</span>
        </template>
      </je-calendar>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}

.custom-cell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.custom-cell.is-marked::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  width: 4px;
  height: 4px;
  background: var(--je-primary);
  border-radius: 50%;
  transform: translateX(-50%);
}
</style>
