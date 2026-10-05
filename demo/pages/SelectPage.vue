<script setup lang="ts">
import { ref } from 'vue'
import { JeField, JeSelect, type JeSelectOption } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const cities: JeSelectOption[] = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '深圳', value: 'shenzhen' },
  { label: '杭州', value: 'hangzhou' },
  { label: '成都', value: 'chengdu' },
]

const city = ref<string | number | null>(null)
const fixed = ref<string | number | null>('shanghai')

const levels: JeSelectOption[] = [
  { label: '低优先级', value: 'low' },
  { label: '中优先级', value: 'mid' },
  { label: '高优先级', value: 'high' },
]
const levelColors: Record<string, string> = {
  low: '#22c55e',
  mid: '#f59e0b',
  high: '#ef4444',
}
const level = ref<string | number | null>('mid')

const colorOf = (value: string | number | null) =>
  levelColors[String(value)] ?? 'var(--je-text-faint)'
</script>

<template>
  <DemoPage
    title="Select 选择器"
    description="支持键盘上下键与回车选择，并提供 option / label / prefix 三个插槽定制选项与选中内容。窄屏下自动切换为底部弹出层：可下拉关闭、锁定页面滚动、预留安全区。"
  >
    <DemoBlock title="基础用法" description="把视口宽度缩到 768px 以下即可看到底部弹出层形态。">
      <je-field label="城市">
        <je-select v-model="city" :options="cities" />
      </je-field>
      <p class="state">当前值：{{ city ?? 'null' }}</p>
    </DemoBlock>

    <DemoBlock title="禁用与已有值">
      <je-field label="已选城市">
        <je-select v-model="fixed" :options="cities" />
      </je-field>
      <je-field label="禁用">
        <je-select :options="cities" disabled placeholder="不可选择" />
      </je-field>
    </DemoBlock>

    <DemoBlock
      title="自定义选项与选中内容"
      description="option 插槽定制每个选项（作用域 { item, index }），label 插槽定制触发器里的选中内容（作用域 { index, label, value }），prefix 插槽固定放在选中内容前面。"
    >
      <je-field label="优先级（option + label）">
        <je-select v-model="level" :options="levels">
          <template #label="{ label }">
            <span class="with-dot">
              <span class="dot" :style="{ background: colorOf(level) }" />
              {{ label }}
            </span>
          </template>
          <template #option="{ item }">
            <span class="with-dot">
              <span class="dot" :style="{ background: colorOf(item.value) }" />
              {{ item.label }}
            </span>
          </template>
        </je-select>
      </je-field>

      <je-field label="带前缀（prefix）">
        <je-select v-model="city" :options="cities">
          <template #prefix>
            <span class="prefix">城市</span>
          </template>
        </je-select>
      </je-field>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}

.with-dot {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.prefix {
  margin-right: 8px;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--je-text-faint);
  border: var(--je-border);
  border-radius: 999px;
}
</style>