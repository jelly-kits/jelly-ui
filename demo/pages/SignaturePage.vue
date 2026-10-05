<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeInput, JeInputNumber, JeSignature } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** 基础签名：跟踪画布空状态 */
const isEmpty = ref(true)

/** 自定义画笔 */
const penColor = ref('#5ac8fa')
const lineWidth = ref<number | null>(4)

/** 外部按钮驱动的签名实例 */
const sigRef = ref<InstanceType<typeof JeSignature> | null>(null)
const disabled = ref(false)

/** toDataURL 结果预览 */
const resultRef = ref<InstanceType<typeof JeSignature> | null>(null)
const dataUrl = ref('')

const readResult = () => {
  const result = resultRef.value?.getResult()
  dataUrl.value = result?.dataUrl ?? ''
}
</script>

<template>
  <DemoPage
    title="Signature 手写签名"
    description="基于 Canvas 的手写签名板，支持 DPR 高清绘制、笔画撤销、清空与 dataURL 导出。"
  >
    <DemoBlock title="基础用法" description="在浅色画布上书写，工具栏提供撤销 / 清空 / 导出 PNG。">
      <je-signature :height="180" @change="isEmpty = $event" />
      <p class="hint">当前 isEmpty：{{ isEmpty }}</p>
    </DemoBlock>

    <DemoBlock
      title="自定义笔色与线宽"
      description="penColor / lineWidth 实时生效，重绘时按当前参数描出历史笔画。"
    >
      <div class="fields">
        <label class="field">
          <span class="field__label">penColor</span>
          <je-input v-model="penColor" placeholder="#ffffff" />
        </label>
        <label class="field">
          <span class="field__label">lineWidth</span>
          <je-input-number v-model="lineWidth" :min="1" :max="20" :step="1" />
        </label>
      </div>
      <je-signature :pen-color="penColor" :line-width="lineWidth ?? 2" :height="180" />
    </DemoBlock>

    <DemoBlock
      title="禁用态与外部控制"
      description="disabled 时不接收绘制；showToolbar 关掉内置工具栏，改用 ref 上的 undo / clear 驱动。"
    >
      <je-signature
        ref="sigRef"
        :disabled="disabled"
        :show-toolbar="false"
        :height="160"
      />
      <div class="toolbar">
        <je-button size="small" variant="ghost" @click="sigRef?.undo()">撤销</je-button>
        <je-button size="small" variant="ghost" @click="sigRef?.clear()">清空</je-button>
        <je-button
          size="small"
          :type="disabled ? 'success' : 'danger'"
          @click="disabled = !disabled"
        >
          {{ disabled ? '解除禁用' : '禁用' }}
        </je-button>
      </div>
    </DemoBlock>

    <DemoBlock
      title="toDataURL 结果预览"
      description="调用 ref 上的 getResult() 拿到 dataUrl，直接绑到 img 上预览。"
    >
      <je-signature ref="resultRef" :height="160" />
      <div class="toolbar">
        <je-button size="small" @click="readResult">读取导出结果</je-button>
      </div>
      <div v-if="dataUrl" class="preview">
        <span class="preview__label">导出结果预览</span>
        <img class="preview__img" :src="dataUrl" alt="签名导出结果">
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

.fields {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.field {
  display: flex;
  flex: 1 1 160px;
  flex-direction: column;
  gap: 6px;
}

.field__label {
  font-size: 13px;
  color: var(--je-text-muted);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.preview__label {
  font-size: 13px;
  color: var(--je-text-faint);
}

.preview__img {
  max-width: 100%;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
}
</style>