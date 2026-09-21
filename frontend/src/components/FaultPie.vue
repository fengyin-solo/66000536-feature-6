<template>
  <div class="chart-panel">
    <div class="head">
      <h4>🥧 故障分布概览</h4>
      <div class="seg">
        <button v-for="m in GROUP_BY_OPTIONS" :key="m.key" class="seg-btn"
          :class="{ on: store.groupBy === m.key }" @click="store.setGroupBy(m.key)">{{ m.label }}</button>
      </div>
    </div>
    <div class="chart-wrap">
      <div ref="chart" class="chart"></div>
      <div v-if="!groups.length" class="chart-empty">暂无故障数据</div>
    </div>
    <div class="legend">
      <span v-for="g in groups" :key="g.key" class="lg" :class="{ on: store.selectedGroup === g.key }"
        @click="toggle(g.key)">
        <i :style="{ background: g.color }"></i>{{ g.key }} {{ g.value }}
      </span>
    </div>
    <div v-if="hints.length" class="hints">
      <div v-for="(h, i) in hints" :key="i" class="hint">⚠ {{ h }}</div>
    </div>
    <div class="total">合计 {{ total }} 次 · {{ groups.length }} 个分组</div>
    <div class="group-list">
      <template v-for="g in groups" :key="g.key">
        <div class="g-row" :class="{ on: store.selectedGroup === g.key }"
          :style="{ borderLeftColor: g.color }" @click="toggle(g.key)">
          <span class="g-name">{{ g.key }}</span>
          <span class="g-val">{{ g.value }} 次</span>
        </div>
        <div v-if="store.selectedGroup === g.key" class="g-detail">
          <div class="gd-dev">设备: {{ g.deviceIds.map(id => '#' + id).join(' ') }}</div>
          <div v-for="r in g.rules" :key="r.rule" class="gd-rule">
            <span class="gd-name">{{ r.rule }}</span>
            <span class="gd-time">最近 {{ ts(r.last) }}</span>
          </div>
          <div v-if="!g.rules.length" class="gd-none">近期无触发记录</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useFactoryStore } from '../store/factory'
import { GROUP_BY_OPTIONS, groupKeysOf, groupColor, expectedGroupKeys } from '../types'

const store = useFactoryStore()
const chart = ref<HTMLDivElement>()
let inst: echarts.ECharts | null = null

interface RuleInfo { rule: string; last: number }
interface GroupInfo { key: string; value: number; color: string; deviceIds: number[]; rules: RuleInfo[] }

const total = computed(() => (store.data?.devices || []).reduce((s, d) => s + d.fault_count, 0))

// 该分组内各触发规则的最近一次发生时间（取当前告警日志）
function rulesFor(deviceIds: number[]): RuleInfo[] {
  const ids = new Set(deviceIds)
  const latest = new Map<string, number>()
  for (const a of store.data?.anomalies || []) {
    for (const t of a.triggers) {
      if (!ids.has(t.device_id)) continue
      latest.set(t.rule, Math.max(latest.get(t.rule) || 0, a.timestamp))
    }
  }
  return [...latest.entries()].map(([rule, last]) => ({ rule, last })).sort((a, b) => b.last - a.last)
}

// 同一批设备按当前分组方式重新分组；空分组不进饼图（不画空心图形）
const groups = computed<GroupInfo[]>(() => {
  const data = store.data
  if (!data) return []
  const by = store.groupBy
  const map = new Map<string, { value: number; ids: number[] }>()
  for (const d of data.devices) {
    const key = groupKeysOf(d, by)[0]
    const g = map.get(key) || { value: 0, ids: [] }
    g.value += d.fault_count
    g.ids.push(d.id)
    map.set(key, g)
  }
  return [...map.entries()]
    .filter(([, g]) => g.value > 0)
    .map(([key, g]) => ({
      key, value: g.value, color: groupColor(by, key),
      deviceIds: g.ids.slice().sort((a, b) => a - b), rules: rulesFor(g.ids)
    }))
    .sort((a, b) => b.value - a.value)
})

// 空分组 / 分组重叠 / 各段与合计不符 → 文字提示，而不是画空心图形
const hints = computed<string[]>(() => {
  const data = store.data
  if (!data) return []
  const by = store.groupBy
  const out: string[] = []
  const faultSum = new Map<string, number>()
  const overlapped: number[] = []
  for (const d of data.devices) {
    const keys = groupKeysOf(d, by)
    if (new Set(keys).size > 1) overlapped.push(d.id)
    for (const k of keys) faultSum.set(k, (faultSum.get(k) || 0) + d.fault_count)
  }
  for (const k of expectedGroupKeys(by)) {
    if (!faultSum.has(k)) out.push(`「${k}」没有设备，已跳过`)
    else if (!(faultSum.get(k)! > 0)) out.push(`「${k}」暂无故障数据`)
  }
  if (overlapped.length) out.push(`设备 ${overlapped.map(id => '#' + id).join('、')} 同时落入多个分组，请检查分组规则`)
  const segSum = groups.value.reduce((s, g) => s + g.value, 0)
  if (segSum !== total.value) out.push(`各段合计 ${segSum} 与总故障数 ${total.value} 不一致`)
  return out
})

function toggle(key: string) {
  store.selectGroup(store.selectedGroup === key ? null : key)
}

function ts(t: number) { return new Date(t * 1000).toLocaleTimeString() }

function update() {
  if (!inst || !store.data) return
  const sel = store.selectedGroup
  inst.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: ${p.value} 次 (${p.percent}%)` },
    series: [{
      type: 'pie',
      data: groups.value.map(g => ({
        name: g.key, value: g.value,
        itemStyle: { color: g.color, opacity: sel && sel !== g.key ? 0.35 : 1 }
      })),
      radius: ['45%', '75%'], center: ['50%', '50%'],
      label: { color: '#94a3b8', fontSize: 10 },
      itemStyle: { borderColor: '#0d1b2a', borderWidth: 2 }
    }],
    animation: false
  }, true)
}

onMounted(() => {
  if (chart.value) {
    inst = echarts.init(chart.value)
    inst.on('click', (p: any) => { if (p.componentType === 'series') toggle(p.name) })
    update()
  }
})
watch(() => [store.data, store.groupBy, store.selectedGroup], update)
// 数据刷新后若选中分组已不存在（变为空分组），自动取消选中
watch(groups, (list) => {
  if (store.selectedGroup && !list.some(g => g.key === store.selectedGroup)) store.selectGroup(null)
})
onUnmounted(() => inst?.dispose())
</script>

<style scoped>
.chart-panel{background:#0d1b2a;border-radius:8px;padding:12px;border:1px solid #1e3a5f}
.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;gap:8px;flex-wrap:wrap}
.chart-panel h4{color:#64b5f6;font-size:13px}
.seg{display:flex;gap:2px;background:#112233;border-radius:5px;padding:2px}
.seg-btn{background:transparent;border:none;color:#94a3b8;font-size:11px;padding:2px 8px;border-radius:4px;cursor:pointer}
.seg-btn.on{background:#1e3a5f;color:#64b5f6;font-weight:600}
.chart-wrap{position:relative}
.chart{width:100%;height:180px}
.chart-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:12px}
.legend{display:flex;flex-wrap:wrap;gap:4px 10px;margin:2px 0}
.lg{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#94a3b8;cursor:pointer;padding:1px 4px;border-radius:3px}
.lg i{width:8px;height:8px;border-radius:2px;display:inline-block}
.lg.on{background:#1e3a5f;color:#e0e6ed}
.hints{margin:4px 0}
.hint{font-size:11px;color:#fbbf24;background:#fbbf2415;border:1px solid #fbbf2433;border-radius:4px;padding:2px 6px;margin-top:3px}
.total{font-size:11px;color:#64748b;margin:4px 0}
.group-list{display:flex;flex-direction:column;gap:3px;max-height:180px;overflow-y:auto}
.g-row{display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:#112233;border-radius:4px;border-left:3px solid #666;cursor:pointer;font-size:12px}
.g-row.on{background:#1e3a5f}
.g-name{color:#e0e6ed;font-weight:600}
.g-val{color:#94a3b8;font-size:11px}
.g-detail{padding:4px 8px 6px 14px;font-size:11px;color:#94a3b8;border-left:3px solid #1e3a5f;margin-left:2px}
.gd-dev{color:#64748b;margin-bottom:3px}
.gd-rule{display:flex;justify-content:space-between;padding:2px 0;color:#fca5a5}
.gd-time{color:#64748b}
.gd-none{color:#64748b}
</style>
