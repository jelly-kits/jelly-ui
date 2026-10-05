<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  JeButton,
  JeCheckboxGroup,
  JeForm,
  JeFormItem,
  JeInput,
  JeInputNumber,
  JeRadioGroup,
  JeSegmented,
  JeSelect,
  JeSpace,
  JeSwitch,
  JeText,
  type JeCheckboxOption,
  type JeFormLabelPosition,
  type JeFormRules,
  type JeRadioOption,
  type JeSegmentedOption,
  type JeSelectOption,
  type JeSwitchValue,
} from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** 只声明用到的方法，避免依赖组件实例的类型推导 */
const formRef = ref<{ validate: () => Promise<boolean>; resetFields: () => void } | null>(null)

const cities: JeSelectOption[] = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '深圳', value: 'shenzhen' },
]

const modes: JeRadioOption[] = [
  { label: '线上', value: 'online' },
  { label: '线下', value: 'offline' },
]

const topics: JeCheckboxOption[] = [
  { label: 'UI 设计', value: 'design' },
  { label: '前端开发', value: 'frontend' },
  { label: '动效交互', value: 'animation' },
]

const labelPositions: JeSegmentedOption[] = [
  { label: '标签在左', value: 'left' },
  { label: '标签在右', value: 'right' },
  { label: '标签置顶', value: 'top' },
]

const model = reactive({
  name: '',
  age: 18,
  city: null as string | number | null,
  mode: 'online' as string | number | null,
  topics: [] as (string | number)[],
  subscribe: true as JeSwitchValue,
})

const rules: JeFormRules = {
  name: [
    { required: true, message: '请输入姓名' },
    { min: 2, max: 8, message: '姓名长度需为 2 ~ 8 个字符' },
  ],
  age: [
    { required: true, message: '请输入年龄' },
    { validator: (value) => (Number(value) < 18 ? '年龄需满 18 岁' : undefined) },
  ],
  city: [{ required: true, message: '请选择城市' }],
  topics: [{ required: true, message: '请至少选择一个主题' }],
}

/** Segmented 的 v-model 是宽类型，这里收窄成表单需要的标签位置 */
const labelPositionValue = ref<string | number>('top')
const labelPosition = computed(() => labelPositionValue.value as JeFormLabelPosition)
const message = ref('')

const submit = async () => {
  const ok = await formRef.value?.validate()
  message.value = ok ? '校验通过，可以提交' : '存在未通过的字段，请检查'
}

const reset = () => {
  formRef.value?.resetFields()
  message.value = ''
}
</script>

<template>
  <DemoPage
    title="Form 表单"
    description="内置数据收集与规则校验：支持必填、长度、数值范围、正则与自定义校验器，失焦 / 值变化时自动触发。窄屏下标签一律堆叠到控件上方。"
  >
    <DemoBlock title="完整示例">
      <je-form
        ref="formRef"
        :model="model"
        :rules="rules"
        :label-position="labelPosition"
        :label-width="96"
      >
        <je-form-item label="姓名" prop="name">
          <je-input v-model="model.name" placeholder="2 ~ 8 个字符" />
        </je-form-item>

        <je-form-item label="年龄" prop="age">
          <je-input-number v-model="model.age" :min="0" :max="120" />
        </je-form-item>

        <je-form-item label="城市" prop="city">
          <je-select v-model="model.city" :options="cities" />
        </je-form-item>

        <je-form-item label="参与方式" prop="mode">
          <je-radio-group v-model="model.mode" :options="modes" />
        </je-form-item>

        <je-form-item label="感兴趣的主题" prop="topics">
          <je-checkbox-group v-model="model.topics" :options="topics" />
        </je-form-item>

        <je-form-item label="接收通知">
          <je-switch v-model="model.subscribe" active-text="开" inactive-text="关" />
        </je-form-item>

        <je-form-item>
          <je-space>
            <je-button @click="submit">提交校验</je-button>
            <je-button variant="ghost" @click="reset">重置</je-button>
          </je-space>
        </je-form-item>
      </je-form>

      <p v-if="message" class="state">{{ message }}</p>
    </DemoBlock>

    <DemoBlock title="标签位置" description="窄屏下无论怎么选都会堆叠到上方。">
      <je-segmented v-model="labelPositionValue" :options="labelPositions" block />
      <je-text size="small">{{ model.name || '（姓名为空）' }}</je-text>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-muted);
}
</style>