<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JePicker, type JePickerColumn } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const buildOptions = (start: number, end: number, pad = false) =>
  Array.from({ length: end - start + 1 }, (_, index) => {
    const text = pad ? String(start + index).padStart(2, '0') : String(start + index)
    return { text, value: text }
  })

const area = ref<(string | number)[]>(['浙江', '杭州'])
const areaColumns: JePickerColumn[] = [
  {
    name: 'province',
    title: '省份',
    options: ['浙江', '江苏', '广东', '四川'].map((item) => ({ text: item, value: item })),
  },
  {
    name: 'city',
    title: '城市',
    options: ['杭州', '宁波', '温州', '绍兴'].map((item) => ({ text: item, value: item })),
  },
]

const date = ref<(string | number)[]>(['2026', '10', '02'])
const dateColumns: JePickerColumn[] = [
  { name: 'year', title: '年', options: buildOptions(2024, 2030) },
  { name: 'month', title: '月', options: buildOptions(1, 12, true) },
  { name: 'day', title: '日', options: buildOptions(1, 31, true) },
]

const status = ref<(string | number)[]>(['online'])
const statusColumns: JePickerColumn[] = [
  {
    name: 'status',
    title: '状态',
    options: [
      { text: '在线', value: 'online' },
      { text: '离线', value: 'offline', subText: '不可选择', disabled: true },
      { text: '忙碌', value: 'busy', subText: '免打扰' },
    ],
  },
]

const eventValue = ref<(string | number)[]>([])
const eventLog = ref('暂无')
const onConfirm = (values: (string | number)[]) => {
  eventLog.value = `确认：${values.join(' / ') || '（空）'}`
}
const onChange = (values: (string | number)[]) => {
  eventLog.value = `滚动中：${values.join(' / ')}`
}
</script>

<template>
  <DemoPage
    title="Picker 选择器"
    description="多列滚轮选择器，滚动带滞动吸附，停稳后自动对齐中间行；确认才写回 v-model，取消则丢弃改动。"
  >
    <DemoBlock title="基础用法" description="columns 的每一项是一列，modelValue 按顺序对应各列选中的值。">
      <je-picker v-model="area" :columns="areaColumns" title="选择地区" />
      <p class="hint">已选择：{{ area.join(' / ') || '（空）' }}</p>
    </DemoBlock>

    <DemoBlock title="三列日期" description="可见行数与行高都可以调整，建议可见行数用奇数才能正好居中。">
      <je-picker
        v-model="date"
        :columns="dateColumns"
        title="选择日期"
        :visible-item-count="5"
        :item-height="44"
      />
      <p class="hint">已选择：{{ date.join('-') || '（空）' }}</p>
    </DemoBlock>

    <DemoBlock title="禁用项与自定义按钮" description="列内选项可单独禁用，工具栏按钮文案也能替换。">
      <je-picker
        v-model="status"
        :columns="statusColumns"
        title="在线状态"
        confirm-text="保存"
        cancel-text="放弃"
      />
      <p class="hint">当前状态：{{ status[0] ?? '（空）' }}</p>
    </DemoBlock>

    <DemoBlock title="事件回显" description="滚动停稳触发 change，点确认触发 confirm。">
      <je-picker v-model="eventValue" :columns="dateColumns" title="监听事件" @change="onChange" @confirm="onConfirm" />
      <p class="hint">{{ eventLog }}</p>
    </DemoBlock>

    <DemoBlock title="禁用整个选择器">
      <je-picker v-model="area" :columns="areaColumns" title="选择地区" disabled />
      <div class="toolbar">
        <je-button size="small" variant="ghost" @click="area = ['广东', '深圳']">重置为深圳</je-button>
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.toolbar {
  margin-top: 16px;
}
</style>
