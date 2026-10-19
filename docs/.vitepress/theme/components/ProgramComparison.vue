<script setup>
import {ref} from 'vue';
import {withBase} from 'vitepress';
import {routeLabel} from '../../../../shared/program-filters.mjs';
const props=defineProps({picked:Array,details:Object,errors:Object,pending:Object});
defineEmits(['remove','retry','share','close']);
const full=ref(false),expanded=ref({});
const rows=[['admission','招生与申请要求'],['courses','课程与先修'],['fees','费用、资助与去向'],['fit','金融数学适配性'],['dates','申请日期']];
const isOpen=(id,key)=>full.value||expanded.value[id+':'+key];
function toggle(id,key){expanded.value={...expanded.value,[id+':'+key]:!expanded.value[id+':'+key]};}
</script>
<template>
 <div class="section-heading"><div><div class="eyebrow">SIDE BY SIDE</div><h2>跨校项目对比 <span class="comparison-count">{{picked.length}} 个条目</span></h2></div><div class="comparison-actions"><button class="text-button" @click="$emit('share')">复制对比链接</button><button class="text-button" @click="$emit('close')">收起对比</button></div></div>
 <div class="compare-toolbar"><div class="view-switch" aria-label="对比阅读模式"><button :class="{active:!full}" :aria-pressed="!full" @click="full=false">要点速览</button><button :class="{active:full}" :aria-pressed="full" @click="full=true">完整资料</button></div><p>速览保留内容节选；展开查看完整条件及来源。费用按原币种、年份与计费周期阅读。</p></div>
 <p class="comparison-scroll-hint">表格可横向滚动；项目名称与比较维度会固定显示。</p>
 <div class="comparison-scroll" role="region" aria-label="跨校对比表，可横向及纵向滚动" tabindex="0">
 <table><caption class="sr-only">所选项目的培养重点、学制、申请途径与原文资料对比</caption><thead><tr><th scope="col">比较维度</th><th v-for="p in picked" :key="p.id" scope="col"><span>{{p.school}} · {{p.regionName}}</span><a :href="withBase(p.url)">{{p.title}} ↗</a><small>参考 {{p.years?.join(' / ')}} · 核验 {{p.verified}}</small><button class="remove-column" :aria-label="`移除对比列：${p.school} ${p.title}`" @click="$emit('remove',p.id)">移除 ×</button><p v-if="pending[p.schoolId]" class="detail-load-status" role="status">正在加载完整资料…</p><div v-if="errors[p.schoolId]" class="detail-load-error" role="alert">{{errors[p.schoolId]}} <button @click="$emit('retry',p.schoolId)">重试</button></div></th></tr></thead>
 <tbody>
  <tr><th scope="row">培养重点</th><td v-for="p in picked" :key="p.id">{{p.focus||'详见培养说明'}}</td></tr>
  <tr><th scope="row">类型与学制</th><td v-for="p in picked" :key="p.id"><span class="fact-pill">{{p.facts.duration.label}}</span><p>{{p.degree}}</p><a class="cell-source" :href="withBase(p.url)">项目说明与来源 ↗</a></td></tr>
  <tr><th scope="row">申请途径</th><td v-for="p in picked" :key="p.id"><span class="fact-pill">{{routeLabel(p.facts.routes)}}</span><p class="cell-note">仅代表所列参考资料；具体方向、名额和资格见下方要求。</p></td></tr>
  <tr v-for="[key,label] in rows" :key="key"><th scope="row">{{label}}</th><td v-for="p in picked" :key="p.id">
   <template v-if="isOpen(p.id,key)"><div v-if="details[p.id]" :id="`detail-${p.id}-${key}`" class="comparison-text" v-html="details[p.id].fields[key]"></div><p v-else>{{pending[p.schoolId]?'正在加载完整资料…':'完整资料暂时不可用，请重试或查看院校原文。'}}</p></template>
   <p v-else class="comparison-excerpt">{{p.facts.summary[key]||'资料未单列可核验内容，请查看项目原文。'}}</p>
   <button v-if="!full" class="expand-cell" :aria-expanded="!!isOpen(p.id,key)" :aria-controls="isOpen(p.id,key)?`detail-${p.id}-${key}`:undefined" :aria-label="`${isOpen(p.id,key)?'收起':'展开'} ${p.school} ${p.title} 的${label}`" @click="toggle(p.id,key)">{{isOpen(p.id,key)?'收起原文':'展开全文和来源'}} {{isOpen(p.id,key)?'−':'+'}}</button>
   <a class="cell-source" :href="withBase(p.url)">院校原文 ↗</a>
  </td></tr>
 </tbody></table>
 </div>
</template>
