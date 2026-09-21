<template>
  <div class="chart-panel fault-panel">
    <div class="panel-head">
      <h4>🥧 故障分布概览</h4>
      <div class="group-switch">
        <button v-for="g in groupOptions" :key="g.value"
                class="seg" :class="{on: store.faultGroupBy === g.value}"
                @click="switchGroup(g.value)">{{ g.label }}</button>
      </div>
    </div>
    <div class="chart-wrap">
      <div ref="chart" class="chart"></div>
      <div v-if="nonEmpty.length" class="center-total">
        <span class="t-num">{{ total }}</span>
        <span class="t-label">故障总数</span>
      </div>
      <div v-if="!nonEmpty.length" class="empty-mask">当前各分组暂无故障数据</div>
    </div>
    <!-- 图例：随分组维度变化，可点击联动 -->
    <div class="legend">
      <button v-for="row in rows" :key="row.name"
              class="legend-item" :class="{active: selected === row.name, dim: row.value === 0}"
              :style="chipStyle(row)" @click="toggleGroup(row.name)">
        <i class="dot"></i>
        <span class="lg-name">{{ row.name }}</span>
        <span class="lg-val">{{ row.value }} 次 · {{ row.percent }}%</span>
        <span v-if="row.value === 0" class="lg-empty">无数据</span>
      </button>
    </div>
    <div class="hints">
      <div v-if="emptyGroups.length" class="hint warn">
        ⓘ {{ emptyGroups.map(g => g).join('、') }} 暂无数据，未绘制空扇区
      </div>
      <div v-if="overlapGroups.length" class="hint warn">
        ⓠ {{ overlapGroups.join('、') }} 占比过小且相互重叠，已隐藏扇区标签避免遮挡，详见图例
      </div>
      <div v-if="mismatch" class="hint err">
        ⚠ 各段合计({{ segSum }})与设备故障总数({{ total }})不一致，请检查数据源
      </div>
      <div v-if="selected" class="hint info">
        已选中「{{ selected }}」，下方告警清单同步高亮并列出该组触发规则
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useFactoryStore } from '../store/factory'
import {
  FAULT_GROUPS, GROUP_LABEL, groupColor,
  type FaultGroupBy
} from '../types'

const store = useFactoryStore()
const chart = ref<HTMLDivElement>()
let inst: echarts.ECharts | null = null

const groupOptions = (Object.keys(GROUP_LABEL) as FaultGroupBy[])
  .map(v => ({ value: v, label: GROUP_LABEL[v] }))

const selected = computed(() => store.selectedFaultGroup)

// 设备故障总数：权威合计（fault_count 是故障事件的唯一自增入口）
const total = computed(() =>
  store.data?.devices.reduce((s, d) => s + d.fault_count, 0) ?? 0)

// 当前维度下各分组的计数：优先使用后端 fault_stats；
// 类型/区域维度在 stats 缺失时可用设备明细兜底（班次为实时属性，只能来自后端）
const rows = computed(() => {
  const gb = store.faultGroupBy
  const stats = store.data?.fault_stats?.[gb]
  const counts: Record<string, number> = {}
  if (stats) {
    Object.assign(counts, stats)
  } else if (store.data && gb !== 'shift') {
    store.data.devices.forEach(d => {
      const k = gb === 'type' ? d.type : d.area
      counts[k] = (counts[k] || 0) + d.fault_count
    })
  }
  const names = [...FAULT_GROUPS[gb]]
  Object.keys(counts).forEach(k => { if (!names.includes(k)) names.push(k) })
  return names.map(name => {
    const value = counts[name] || 0
    const percent = total.value ? Math.round(value / total.value * 1000) / 10 : 0
    return { name, value, percent }
  })
})

const nonEmpty = computed(() => rows.value.filter(r => r.value > 0))
const emptyGroups = computed(() => rows.value.filter(r => r.value === 0).map(r => r.name))
const segSum = computed(() => rows.value.reduce((s, r) => s + r.value, 0))
const mismatch = computed(() => total.value > 0 && segSum.value !== total.value)

// 检测占比过小、角度相邻的扇区（含首尾环绕），这些扇区的标签会重叠
const overlapGroups = computed(() => {
  const items = nonEmpty.value
  if (items.length < 2 || total.value === 0) return []
  const angles = items.map(r => (r.value / total.value) * 360)
  const mids: number[] = []
  let acc = -90
  items.forEach((_, i) => { mids.push(acc + angles[i] / 2); acc += angles[i] })
  const flagged = new Set<string>()
  const near = (a: number, b: number) => {
    let d = Math.abs(a - b) % 360
    d = d > 180 ? 360 - d : d
    return d < 20
  }
  for (let i = 0; i < items.length; i++) {
    const j = (i + 1) % items.length
    if (near(mids[i], mids[j])) { flagged.add(items[i].name); flagged.add(items[j].name) }
  }
  return [...flagged]
})

function chipStyle(row: { name: string; value: number }) {
  const c = groupColor(store.faultGroupBy, row.name)
  const active = store.selectedFaultGroup === row.name
  return {
    '--c': c,
    boxShadow: active ? `0 0 8px ${c}88` : 'none',
    borderColor: active ? c : '#1e3a5f'
  } as Record<string, string>
}

function toggleGroup(name: string) {
  store.selectedFaultGroup = store.selectedFaultGroup === name ? null : name
}

function switchGroup(g: FaultGroupBy) {
  if (store.faultGroupBy === g) return
  store.faultGroupBy = g
  store.selectedFaultGroup = null // 切换维度后旧分组失效
}

function render() {
  if (!inst) return
  const gb = store.faultGroupBy
  const overlap = new Set(overlapGroups.value)
  const data = nonEmpty.value.map(r => ({
    name: r.name,
    value: r.value,
    itemStyle: { color: groupColor(gb, r.name), borderColor: '#0d1b2a', borderWidth: 2 },
    selected: store.selectedFaultGroup === r.name,
    label: { show: !overlap.has(r.name) }
  }))
  inst.setOption({
    backgroundColor: 'transparent',
    series: [{
      type: 'pie',
      data,
      radius: ['45%', '75%'],
      center: ['50%', '55%'],
      selectedMode: 'single',
      selectedOffset: 10,
      avoidLabelOverlap: true,
      label: { color: '#94a3b8', fontSize: 10, formatter: '{b}: {c}次' },
      labelLine: { lineStyle: { color: '#334155' } },
      emphasis: { scale: true, scaleSize: 4 },
      animation: false
    }],
    tooltip: {
      trigger: 'item',
      backgroundColor: '#112233',
      borderColor: '#1e3a5f',
      textStyle: { color: '#e0e6ed', fontSize: 11 },
      formatter: (p: any) => `${p.name}<br/>故障 ${p.value} 次 (${p.percent}%)`
    }
  }, { notMerge: true, replaceMerge: ['series'] })
}

function update() { if (store.data) render() }

onMounted(() => {
  if (!chart.value) return
  inst = echarts.init(chart.value)
  inst.on('click', (p: any) => { if (p && p.name) toggleGroup(p.name) })
  update()
})
watch(() => store.data, update, { deep: false })
watch(() => [store.faultGroupBy, store.selectedFaultGroup, rows, overlapGroups], render, { deep: true })
onUnmounted(() => inst?.dispose())
</script>

<style scoped>
.fault-panel{display:flex;flex-direction:column}
.panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:6px;flex-wrap:wrap}
.chart-panel{background:#0d1b2a;border-radius:8px;padding:12px;border:1px solid #1e3a5f}
.chart-panel h4{color:#64b5f6;font-size:13px}
.group-switch{display:flex;background:#0a1628;border:1px solid #1e3a5f;border-radius:5px;overflow:hidden}
.seg{background:transparent;border:none;color:#94a3b8;font-size:10px;padding:3px 8px;cursor:pointer}
.seg.on{background:#1e3a5f;color:#64b5f6;font-weight:600}
.chart-wrap{position:relative}
.chart{width:100%;height:180px}
.center-total{position:absolute;left:50%;top:55%;transform:translate(-50%,-50%);
  display:flex;flex-direction:column;align-items:center;pointer-events:none}
.t-num{font-size:22px;font-weight:700;color:#e0e6ed;line-height:1.1}
.t-label{font-size:10px;color:#64748b}
.empty-mask{position:absolute;left:50%;top:55%;transform:translate(-50%,-50%);
  color:#64748b;font-size:11px;white-space:nowrap;pointer-events:none}
.legend{display:flex;flex-wrap:wrap;gap:5px;margin-top:2px}
.legend-item{display:flex;align-items:center;gap:4px;background:#112233;border:1px solid #1e3a5f;
  border-radius:4px;padding:2px 7px;cursor:pointer;font-size:10px;color:#cbd5e1}
.legend-item.active{background:#16263c}
.legend-item.dim{opacity:.55}
.dot{width:8px;height:8px;border-radius:2px;background:var(--c);display:inline-block}
.lg-name{font-weight:600}
.lg-val{color:#94a3b8}
.lg-empty{color:#fbbf24}
.hints{margin-top:5px;display:flex;flex-direction:column;gap:2px}
.hint{font-size:10px;line-height:1.35;border-radius:3px;padding:2px 6px}
.hint.warn{color:#fbbf24;background:#fbbf2414;border:1px solid #fbbf2433}
.hint.err{color:#f87171;background:#7f1d1d22;border:1px solid #7f1d1d55}
.hint.info{color:#64b5f6;background:#1e3a5f33;border:1px solid #1e3a5f88}
</style>
