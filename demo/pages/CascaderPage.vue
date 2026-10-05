<script setup lang="ts">
import { ref } from 'vue'
import { JeCascader, JeField } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

interface CascaderOption {
  value: string
  label: string
  children?: CascaderOption[]
  disabled?: boolean
}

const regionOptions: CascaderOption[] = [
  {
    value: 'beijing',
    label: '北京',
    children: [
      {
        value: 'chaoyang',
        label: '朝阳区',
        children: [
          { value: 'sanlitun', label: '三里屯' },
          { value: 'guomao', label: '国贸' },
          { value: 'wangjing', label: '望京' },
        ],
      },
      {
        value: 'haidian',
        label: '海淀区',
        children: [
          { value: 'zhongguancun', label: '中关村' },
          { value: 'wudaokou', label: '五道口' },
        ],
      },
    ],
  },
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      {
        value: 'hangzhou',
        label: '杭州',
        children: [
          { value: 'xihu', label: '西湖区' },
          { value: 'binjiang', label: '滨江区' },
        ],
      },
      {
        value: 'ningbo',
        label: '宁波',
        disabled: true,
        children: [{ value: 'haishu', label: '海曙区' }],
      },
    ],
  },
]

const value = ref<(string | number)[]>([])
const fixed = ref<(string | number)[]>(['beijing', 'chaoyang', 'sanlitun'])
</script>

<template>
  <DemoPage
    title="Cascader 级联选择"
    description="多列联动，选中路径以「北京 / 朝阳区 / 三里屯」的形式回显。桌面端为锚点浮层，窄屏（≤768px）切换为底部弹出层并逐级选择，一屏一列、带返回上一级，选项热区不小于 44px。"
  >
    <DemoBlock title="基础用法" description="点击非叶子项会在右侧展开下一列，选到叶子即提交。">
      <je-field label="所在地区">
        <je-cascader v-model="value" :options="regionOptions" />
      </je-field>
      <p class="state">当前值：{{ value.length ? value.join(' / ') : 'null' }}</p>
    </DemoBlock>

    <DemoBlock title="默认值与禁用项" description="禁用项无法展开或提交；清空按钮可重置选择。">
      <je-field label="已选地区">
        <je-cascader v-model="fixed" :options="regionOptions" />
      </je-field>
      <p class="state">当前值：{{ fixed.length ? fixed.join(' / ') : 'null' }}</p>
    </DemoBlock>

    <DemoBlock title="禁用态">
      <je-field label="不可选择">
        <je-cascader :options="regionOptions" disabled placeholder="请选择地区" />
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
</style>
