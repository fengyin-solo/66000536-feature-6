/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { useFactoryStore } from '../store/factory';
import { FAULT_GROUPS, GROUP_LABEL, groupColor } from '../types';
const store = useFactoryStore();
const chart = ref();
let inst = null;
const groupOptions = Object.keys(GROUP_LABEL)
    .map(v => ({ value: v, label: GROUP_LABEL[v] }));
const selected = computed(() => store.selectedFaultGroup);
// 设备故障总数：权威合计（fault_count 是故障事件的唯一自增入口）
const total = computed(() => store.data?.devices.reduce((s, d) => s + d.fault_count, 0) ?? 0);
// 当前维度下各分组的计数：优先使用后端 fault_stats；
// 类型/区域维度在 stats 缺失时可用设备明细兜底（班次为实时属性，只能来自后端）
const rows = computed(() => {
    const gb = store.faultGroupBy;
    const stats = store.data?.fault_stats?.[gb];
    const counts = {};
    if (stats) {
        Object.assign(counts, stats);
    }
    else if (store.data && gb !== 'shift') {
        store.data.devices.forEach(d => {
            const k = gb === 'type' ? d.type : d.area;
            counts[k] = (counts[k] || 0) + d.fault_count;
        });
    }
    const names = [...FAULT_GROUPS[gb]];
    Object.keys(counts).forEach(k => { if (!names.includes(k))
        names.push(k); });
    return names.map(name => {
        const value = counts[name] || 0;
        const percent = total.value ? Math.round(value / total.value * 1000) / 10 : 0;
        return { name, value, percent };
    });
});
const nonEmpty = computed(() => rows.value.filter(r => r.value > 0));
const emptyGroups = computed(() => rows.value.filter(r => r.value === 0).map(r => r.name));
const segSum = computed(() => rows.value.reduce((s, r) => s + r.value, 0));
const mismatch = computed(() => total.value > 0 && segSum.value !== total.value);
// 检测占比过小、角度相邻的扇区（含首尾环绕），这些扇区的标签会重叠
const overlapGroups = computed(() => {
    const items = nonEmpty.value;
    if (items.length < 2 || total.value === 0)
        return [];
    const angles = items.map(r => (r.value / total.value) * 360);
    const mids = [];
    let acc = -90;
    items.forEach((_, i) => { mids.push(acc + angles[i] / 2); acc += angles[i]; });
    const flagged = new Set();
    const near = (a, b) => {
        let d = Math.abs(a - b) % 360;
        d = d > 180 ? 360 - d : d;
        return d < 20;
    };
    for (let i = 0; i < items.length; i++) {
        const j = (i + 1) % items.length;
        if (near(mids[i], mids[j])) {
            flagged.add(items[i].name);
            flagged.add(items[j].name);
        }
    }
    return [...flagged];
});
function chipStyle(row) {
    const c = groupColor(store.faultGroupBy, row.name);
    const active = store.selectedFaultGroup === row.name;
    return {
        '--c': c,
        boxShadow: active ? `0 0 8px ${c}88` : 'none',
        borderColor: active ? c : '#1e3a5f'
    };
}
function toggleGroup(name) {
    store.selectedFaultGroup = store.selectedFaultGroup === name ? null : name;
}
function switchGroup(g) {
    if (store.faultGroupBy === g)
        return;
    store.faultGroupBy = g;
    store.selectedFaultGroup = null; // 切换维度后旧分组失效
}
function render() {
    if (!inst)
        return;
    const gb = store.faultGroupBy;
    const overlap = new Set(overlapGroups.value);
    const data = nonEmpty.value.map(r => ({
        name: r.name,
        value: r.value,
        itemStyle: { color: groupColor(gb, r.name), borderColor: '#0d1b2a', borderWidth: 2 },
        selected: store.selectedFaultGroup === r.name,
        label: { show: !overlap.has(r.name) }
    }));
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
            formatter: (p) => `${p.name}<br/>故障 ${p.value} 次 (${p.percent}%)`
        }
    }, { notMerge: true, replaceMerge: ['series'] });
}
function update() { if (store.data)
    render(); }
onMounted(() => {
    if (!chart.value)
        return;
    inst = echarts.init(chart.value);
    inst.on('click', (p) => { if (p && p.name)
        toggleGroup(p.name); });
    update();
});
watch(() => store.data, update, { deep: false });
watch(() => [store.faultGroupBy, store.selectedFaultGroup, rows, overlapGroups], render, { deep: true });
onUnmounted(() => inst?.dispose());
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['chart-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['seg']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-panel fault-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "group-switch" },
});
for (const [g] of __VLS_getVForSourceType((__VLS_ctx.groupOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.switchGroup(g.value);
            } },
        key: (g.value),
        ...{ class: "seg" },
        ...{ class: ({ on: __VLS_ctx.store.faultGroupBy === g.value }) },
    });
    (g.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "chart",
    ...{ class: "chart" },
});
/** @type {typeof __VLS_ctx.chart} */ ;
if (__VLS_ctx.nonEmpty.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "center-total" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "t-num" },
    });
    (__VLS_ctx.total);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "t-label" },
    });
}
if (!__VLS_ctx.nonEmpty.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-mask" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "legend" },
});
for (const [row] of __VLS_getVForSourceType((__VLS_ctx.rows))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.toggleGroup(row.name);
            } },
        key: (row.name),
        ...{ class: "legend-item" },
        ...{ class: ({ active: __VLS_ctx.selected === row.name, dim: row.value === 0 }) },
        ...{ style: (__VLS_ctx.chipStyle(row)) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
        ...{ class: "dot" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "lg-name" },
    });
    (row.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "lg-val" },
    });
    (row.value);
    (row.percent);
    if (row.value === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "lg-empty" },
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hints" },
});
if (__VLS_ctx.emptyGroups.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hint warn" },
    });
    (__VLS_ctx.emptyGroups.map(g => g).join('、'));
}
if (__VLS_ctx.overlapGroups.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hint warn" },
    });
    (__VLS_ctx.overlapGroups.join('、'));
}
if (__VLS_ctx.mismatch) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hint err" },
    });
    (__VLS_ctx.segSum);
    (__VLS_ctx.total);
}
if (__VLS_ctx.selected) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "hint info" },
    });
    (__VLS_ctx.selected);
}
/** @type {__VLS_StyleScopedClasses['chart-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['fault-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-head']} */ ;
/** @type {__VLS_StyleScopedClasses['group-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['seg']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['chart']} */ ;
/** @type {__VLS_StyleScopedClasses['center-total']} */ ;
/** @type {__VLS_StyleScopedClasses['t-num']} */ ;
/** @type {__VLS_StyleScopedClasses['t-label']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-mask']} */ ;
/** @type {__VLS_StyleScopedClasses['legend']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
/** @type {__VLS_StyleScopedClasses['lg-name']} */ ;
/** @type {__VLS_StyleScopedClasses['lg-val']} */ ;
/** @type {__VLS_StyleScopedClasses['lg-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['hints']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['warn']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['warn']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['err']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['info']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            store: store,
            chart: chart,
            groupOptions: groupOptions,
            selected: selected,
            total: total,
            rows: rows,
            nonEmpty: nonEmpty,
            emptyGroups: emptyGroups,
            segSum: segSum,
            mismatch: mismatch,
            overlapGroups: overlapGroups,
            chipStyle: chipStyle,
            toggleGroup: toggleGroup,
            switchGroup: switchGroup,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
