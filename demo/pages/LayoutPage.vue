<script setup lang="ts">
import { computed, ref } from 'vue'
import { JeCol, JeRow, JeSegmented } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/** 可选间距，切换后 Row 的 gutter 实时变化 */
const gutter = ref(16)
const gutterOptions = [
  { label: '16', value: 16 },
  { label: '24', value: 24 },
  { label: '32', value: 32 },
]

const onGutterChange = (value: string | number) => {
  gutter.value = Number(value)
}

/** [水平, 垂直] 间距，垂直方向固定 16 */
const gutterPair = computed<[number, number]>(() => [gutter.value, 16])
</script>

<template>
  <DemoPage
    title="Layout 布局"
    description="24 栅格系统：Row 负责主轴 / 交叉轴对齐与间距，Col 负责占位、偏移与响应式断点。页面级的容器骨架见 Container 布局容器。"
  >
    <DemoBlock
      title="基础栅格"
      description="每行 24 份，三栏各占 8 份即三等分。"
    >
      <je-row :gutter="16">
        <je-col :span="8"><div class="cell">span 8</div></je-col>
        <je-col :span="8"><div class="cell">span 8</div></je-col>
        <je-col :span="8"><div class="cell">span 8</div></je-col>
      </je-row>
    </DemoBlock>

    <DemoBlock title="间距与对齐" description="gutter 支持 [水平, 垂直]；justify / align 控制主轴与交叉轴。">
      <je-segmented
        :model-value="gutter"
        :options="gutterOptions"
        @update:model-value="onGutterChange"
      />
      <je-row
        class="row-gap"
        :gutter="gutterPair"
        justify="space-between"
        align="middle"
      >
        <je-col :span="6"><div class="cell">span 6</div></je-col>
        <je-col :span="6"><div class="cell cell--tall">span 6</div></je-col>
        <je-col :span="6"><div class="cell">span 6</div></je-col>
        <je-col :span="6"><div class="cell">span 6</div></je-col>
      </je-row>
    </DemoBlock>

    <DemoBlock
      title="偏移与响应式"
      description="offset 会真实占用栅格列（和 span 一起算进 24 列），push / pull 只做视觉位移、不占列，所以三者相加必须 ≤ 24；xs、md 等断点可传入数字或 { span, offset }。"
    >
      <!--
        offset 6 + span 6 = 12，再加两个 span 6 正好 24 列，一行放得下。
        之前写成 offset 8 + span 8 + 6 + 6 = 28 列，最后一项被迫换行；
        而换行后 pull 的 right 百分比仍按整行宽度计算，整块就被甩到容器外了。
      -->
      <je-row :gutter="16">
        <je-col :span="6" :offset="6"><div class="cell">span 6 + offset 6</div></je-col>
        <je-col :span="6" :push="6"><div class="cell">push 6 →</div></je-col>
        <je-col :span="6" :pull="6"><div class="cell">← pull 6</div></je-col>
      </je-row>

      <je-row class="row-gap" :gutter="16">
        <je-col :xs="24" :md="{ span: 12, offset: 6 }">
          <div class="cell">窄屏整行，≥992px 时 span 12 + offset 6</div>
        </je-col>
        <je-col :xs="12" :md="6"><div class="cell">xs 12 / md 6</div></je-col>
      </je-row>
    </DemoBlock>

    <DemoBlock title="移动端说明">
      <p class="tip">
        窄屏（≤768px）建议为 Col 指定 xs，把多栏降为整行；Row 默认 wrap 会自动换行，间距不会溢出容器。
      </p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 10px;
  font-size: 13px;
  color: var(--je-text-muted);
  text-align: center;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius-sm);
}

.cell--tall {
  min-height: 76px;
}

.row-gap {
  margin-top: 16px;
}

.tip {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--je-text-faint);
}

@media (max-width: 768px) {
  .cell {
    min-height: 44px;
    font-size: 12px;
  }
}
</style>
