<script setup lang="ts">
import { ref } from 'vue'
import { JeArea, type JeAreaOption } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const areaList: JeAreaOption[] = [
  {
    text: '浙江省',
    value: 'zj',
    children: [
      {
        text: '杭州市',
        value: 'hz',
        children: [
          { text: '西湖区', value: 'xh' },
          { text: '余杭区', value: 'yh' },
          { text: '滨江区', value: 'bj' },
        ],
      },
      {
        text: '宁波市',
        value: 'nb',
        children: [
          { text: '海曙区', value: 'hs' },
          { text: '鄞州区', value: 'yz' },
        ],
      },
    ],
  },
  {
    text: '江苏省',
    value: 'js',
    children: [
      {
        text: '南京市',
        value: 'nj',
        children: [
          { text: '玄武区', value: 'xw' },
          { text: '鼓楼区', value: 'gl' },
        ],
      },
      {
        text: '苏州市',
        value: 'sz',
        children: [
          { text: '姑苏区', value: 'gs' },
          { text: '工业园区', value: 'gy' },
        ],
      },
    ],
  },
  {
    text: '广东省',
    value: 'gd',
    children: [
      {
        text: '深圳市',
        value: 'sz-gd',
        children: [
          { text: '南山区', value: 'ns' },
          { text: '福田区', value: 'ft' },
        ],
      },
    ],
  },
]

const area = ref<(string | number)[]>(['zj', 'hz', 'xh'])
const emptyArea = ref<(string | number)[]>([])
const log = ref('暂无')

const onConfirm = (values: (string | number)[]) => {
  log.value = `确认：${values.join(' / ') || '（空）'}`
}

const onChange = (values: (string | number)[]) => {
  log.value = `切换：${values.join(' / ')}`
}
</script>

<template>
  <DemoPage
    title="Area 省市区选择"
    description="基于滚轮的省市区三级联动，顶部标签页切换层级，改上层后下层自动重置到新分支的首项。"
  >
    <DemoBlock title="基础用法" description="areaList 是树形数据，modelValue 按「省 / 市 / 区」顺序传值。">
      <je-area v-model="area" :area-list="areaList" />
      <p class="hint">已选择：{{ area.join(' / ') || '（空）' }}</p>
    </DemoBlock>

    <DemoBlock title="事件回显" description="滚动停下触发 change，点确认触发 confirm，点取消或遮罩触发 cancel。">
      <je-area
        v-model="emptyArea"
        :area-list="areaList"
        placeholder="请选择收货地区"
        @change="onChange"
        @confirm="onConfirm"
        @cancel="log = '已取消'"
      />
      <p class="hint">{{ log }}</p>
    </DemoBlock>

    <DemoBlock title="调整级数与可见行数" description="columnsNum 控制联动级数，visibleItemCount 建议使用奇数才能正好居中。">
      <je-area v-model="area" :area-list="areaList" :columns-num="2" :visible-item-count="7" title="选择省市" />
    </DemoBlock>

    <DemoBlock title="禁用">
      <je-area v-model="area" :area-list="areaList" disabled />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.je-area + .je-area {
  margin-top: 16px;
}
</style>
