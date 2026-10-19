<script setup>
import {ref,reactive,computed,onMounted,onUnmounted,watch,nextTick} from 'vue';
import {withBase} from 'vitepress';
import catalog from '../../../../data/catalog.json';
import {categories,durationOptions,routeOptions,emptyFilters,readFilters,matchesProgram,selectedIds,routeLabel} from '../../../../shared/program-filters.mjs';
import ProgramComparison from './ProgramComparison.vue';
import SaveProgram from './SaveProgram.vue';
import {useSavedPrograms} from '../useSavedPrograms.mjs';
import {favoriteBackup,readFavoriteBackup,programCsv} from '../../../../shared/saved-programs.mjs';
const all=ref([]),filters=reactive(emptyFilters()),page=ref(1),selected=ref([]),showCompare=ref(false),error=ref(''),loading=ref(true),note=ref('');
const {saved,savedError,mergeSaved}=useSavedPrograms();
const savedOnly=ref(false),backupInput=ref(null),importing=ref(false),resultsEl=ref(null);
const favorites=computed(()=>all.value.filter(p=>saved.value.includes(p.id)));
const comparisonEl=ref(null),details=reactive({}),detailErrors=reactive({}),detailLoading=reactive({}),requests=new Map();
const searchText=ref({}),searchReady=ref(false),searchError=ref('');
let restoring=true,searchRequest;
const searchFailed=computed(()=>!!filters.q.trim()&&!!searchError.value);
const searchPending=computed(()=>!!filters.q.trim()&&!searchReady.value&&!searchFailed.value);
const resultsReady=computed(()=>!loading.value&&!error.value&&!searchPending.value&&!searchFailed.value);
const schools=computed(()=>catalog.schools.filter(s=>!filters.region||s.region===filters.region));
const filtered=computed(()=>searchPending.value||searchFailed.value?[]:all.value.filter(p=>(!savedOnly.value||saved.value.includes(p.id))&&matchesProgram(p,filters,searchText.value[p.id]||'')));
const pages=computed(()=>Math.max(1,Math.ceil(filtered.value.length/18)));
const visible=computed(()=>filtered.value.slice((page.value-1)*18,page.value*18));
const picked=computed(()=>selected.value.map(id=>all.value.find(p=>p.id===id)).filter(Boolean));
const activeFilters=computed(()=>[
 ['q',filters.q&&`关键词：${filters.q}`],['region',catalog.regions[filters.region]],
 ['school',catalog.schools.find(s=>s.id===filters.school)?.name],['tag',filters.tag],
 ['duration',durationOptions.find(x=>x[0]===filters.duration)?.[1]],['route',routeOptions.find(x=>x[0]===filters.route)?.[1]],
].filter(([,value])=>value));
function urlFor(compare=showCompare.value){
 const u=new URL(location.href);u.search='';u.hash=compare&&selected.value.length?'comparison':'';
 for(const [key,value] of Object.entries(filters))if(value)u.searchParams.set(key,value);
 if(savedOnly.value)u.searchParams.set('saved','1');
 if(compare&&selected.value.length)u.searchParams.set('compare',selected.value.join(','));
 return u;
}
function syncUrl(){if(!restoring)history.replaceState(null,'',urlFor().toString());}
async function restore(fromHistory=false){
 restoring=true;
 const params=new URLSearchParams(location.search);
 Object.assign(filters,readFilters(params,catalog));page.value=1;
 savedOnly.value=params.get('saved')==='1';
 if(params.has('compare'))selected.value=selectedIds(params.get('compare').split(','),all.value);
 else if(!fromHistory){try{selected.value=selectedIds(JSON.parse(localStorage.getItem('grad-compare')||'[]'),all.value)}catch{selected.value=[];}}
 showCompare.value=params.has('compare')&&selected.value.length>=2;
 const add=params.get('add');
 if(!fromHistory&&all.value.some(p=>p.id===add)&&!selected.value.includes(add)){
  if(selected.value.length<4)selected.value.push(add);else note.value='已选满 4 个项目，请先移除一个再加入。';
 }
 await nextTick();restoring=false;
 if(showCompare.value){await loadDetails();await nextTick();comparisonEl.value?.scrollIntoView();}
}
async function load(){
 loading.value=true;error.value='';
 try{const r=await fetch(withBase('/data/program-index.json'));if(!r.ok)throw Error();all.value=await r.json();await restore();}
 catch{error.value='项目数据加载失败，请检查网络后重试。';}
 finally{loading.value=false;}
}
async function ensureSearch(){
 if(searchReady.value)return;
 if(searchRequest)return searchRequest;
 searchError.value='';
 searchRequest=(async()=>{
  try{const r=await fetch(withBase('/data/program-search.json'));if(!r.ok)throw Error();searchText.value=await r.json();searchReady.value=true;}
  catch{searchError.value='全文搜索资料暂时加载失败，请重试，或清除关键词后按条件筛选。';}
  finally{searchRequest=null;}
 })();
 return searchRequest;
}
const onPopState=()=>restore(true);
onMounted(()=>{load();window.addEventListener('popstate',onPopState)});
onUnmounted(()=>window.removeEventListener('popstate',onPopState));
watch(()=>filters.region,()=>{if(filters.school&&!schools.value.some(s=>s.id===filters.school))filters.school='';});
watch(filters,()=>{page.value=1;syncUrl();});
watch(()=>filters.q,q=>{if(q.trim())ensureSearch();});
watch(savedOnly,()=>{page.value=1;syncUrl();});
watch(pages,()=>{if(page.value>pages.value)page.value=pages.value;});
watch(selected,()=>{
 try{localStorage.setItem('grad-compare',JSON.stringify(selected.value))}catch{}
 if(!selected.value.length)showCompare.value=false;
 syncUrl();if(showCompare.value)loadDetails();
},{deep:true});
async function fetchSchool(id){
 if(requests.has(id))return requests.get(id);
 if(all.value.filter(p=>p.schoolId===id).every(p=>details[p.id]))return;
 detailLoading[id]=true;delete detailErrors[id];
 const request=(async()=>{
  try{const r=await fetch(withBase(`/data/program-details/${id}.json`));if(!r.ok)throw Error();Object.assign(details,await r.json());}
  catch{detailErrors[id]='完整资料暂时加载失败，可重试或打开院校原文。';}
  finally{detailLoading[id]=false;requests.delete(id);}
 })();requests.set(id,request);return request;
}
async function loadDetails(){await Promise.all([...new Set(picked.value.map(p=>p.schoolId))].map(fetchSchool));}
function toggle(id){
 note.value='';
 if(selected.value.includes(id))selected.value=selected.value.filter(x=>x!==id);
 else if(selected.value.length<4)selected.value=[...selected.value,id];
 else note.value='最多同时比较 4 个条目，请先移除一个再加入。';
}
async function compare(){showCompare.value=true;syncUrl();loadDetails();await nextTick();comparisonEl.value?.scrollIntoView({behavior:'smooth'});comparisonEl.value?.focus();}
function closeCompare(){showCompare.value=false;syncUrl();}
async function share(includeCompare){
 const u=urlFor(includeCompare);
 if(includeCompare)u.searchParams.delete('saved');
 try{await navigator.clipboard.writeText(u.toString());note.value=includeCompare?'已复制对比链接。':'已复制筛选链接。';}
 catch{history.replaceState(null,'',u.toString());note.value='请复制地址栏链接，即可保留当前筛选或对比。';}
}
function reset(){Object.assign(filters,emptyFilters());savedOnly.value=false;}
function download(content,type,name){
 const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportResults(){download(programCsv(filtered.value.map(p=>({...p,url:withBase(p.url)})),location.origin),'text/csv;charset=utf-8','升学图谱-筛选结果.csv');note.value=`已导出全部 ${filtered.value.length} 个筛选结果，含资料页链接。`;}
function exportFavorites(){download(favoriteBackup(favorites.value.map(p=>p.id)),'application/json','升学图谱-收藏备份.json');note.value=`已导出 ${favorites.value.length} 个收藏，可在另一浏览器或站点导入。`;}
async function importFavorites(event){
 const file=event.target.files?.[0];if(!file)return;importing.value=true;
 try{
  if(file.size>256*1024)throw Error();
  const ids=readFavoriteBackup(await file.text(),all.value.map(p=>p.id));
  const added=mergeSaved(ids);note.value=ids.length?`导入完成，新增 ${added} 个收藏；已有收藏已保留。`:'备份中没有本站当前收录的项目。';
 }catch{note.value='无法导入，请选择本站导出的收藏备份 JSON（不超过 256 KB）。原有收藏未改动。';}
 finally{importing.value=false;event.target.value='';}
}
async function turnPage(delta){page.value+=delta;await nextTick();resultsEl.value?.scrollIntoView({behavior:'smooth'});resultsEl.value?.focus();}
</script>

<template>
<div class="app-page explorer">
 <header class="page-intro"><div class="eyebrow">FIND YOUR PROGRAM</div><h1>让项目之间的差异，清晰可见。</h1><p>先按方向、学制与申请途径缩小范围，再选取 2–4 个项目，比较课程、申请条件与学习成本。</p></header>
 <section class="saved-toolbar" aria-label="项目收藏">
  <div class="saved-toolbar-main"><div class="view-switch"><button :class="{active:!savedOnly}" :aria-pressed="!savedOnly" @click="savedOnly=false">全部项目</button><button :class="{active:savedOnly}" :aria-pressed="savedOnly" @click="savedOnly=true">我的收藏 <span>{{favorites.length}}</span></button></div><a :href="withBase('/timeline.html?saved=1#school-dates')">收藏学校的时间线 →</a></div>
  <div class="saved-tools"><button class="text-button" :disabled="!favorites.length" @click="exportFavorites">导出收藏备份</button><button class="text-button" :disabled="loading||importing" @click="backupInput?.click()">{{importing?'正在导入…':'导入收藏备份'}}</button><input ref="backupInput" class="sr-only" type="file" accept=".json,application/json" aria-label="选择收藏备份 JSON" @change="importFavorites"></div>
  <p>收藏保存在此浏览器、此站点。换设备或切换 Vercel / Cloudflare 地址时，可导出备份后导入。</p>
  <p v-if="savedError" role="alert">{{savedError}}</p>
 </section>
 <div class="filter-bar">
  <label class="search-field"><span aria-hidden="true">⌕</span><input v-model="filters.q" placeholder="搜索：金融工程、Python、431、GRE…" aria-label="搜索项目全文"></label>
  <label class="select-field"><span>地区</span><select v-model="filters.region" aria-label="地区"><option value="">全部地区</option><option v-for="(n,id) in catalog.regions" :key="id" :value="id">{{n}}</option></select></label>
  <label class="select-field"><span>大学</span><select v-model="filters.school" aria-label="大学"><option value="">全部大学</option><option v-for="s in schools" :key="s.id" :value="s.id">{{s.name}}</option></select></label>
 </div>
 <div class="secondary-filters">
  <label class="select-field"><span>学制</span><select v-model="filters.duration" aria-label="学制"><option value="">全部学制</option><option v-for="[id,label] in durationOptions" :key="id" :value="id">{{label}}</option></select></label>
  <label class="select-field"><span>申请途径</span><select v-model="filters.route" aria-label="申请途径"><option value="">全部途径</option><option v-for="[id,label] in routeOptions" :key="id" :value="id">{{label}}</option></select></label>
  <p>按资料所列学制与途径筛选，适用年份见项目。多路径学制单列，学期不换算成年。</p>
 </div>
 <div class="chips" aria-label="培养方向"><button :class="{active:!filters.tag}" :aria-pressed="!filters.tag" @click="filters.tag=''">全部方向</button><button v-for="c in categories" :key="c" :class="{active:filters.tag===c}" :aria-pressed="filters.tag===c" @click="filters.tag=c">{{c}}</button></div>
 <div v-if="activeFilters.length" class="active-filters" aria-label="当前筛选"><span>当前筛选</span><button v-for="[key,label] in activeFilters" :key="key" @click="filters[key]=''" :aria-label="`移除筛选：${label}`">{{label}} <span aria-hidden="true">×</span></button><button class="text-button" @click="reset">全部重置</button></div>
 <div ref="resultsEl" tabindex="-1" class="result-summary"><span role="status">{{loading?'正在加载项目资料…':searchPending?'正在加载全文搜索资料…':searchFailed?'全文搜索暂时不可用':error?'项目资料暂时不可用':`找到 ${filtered.length} 个项目 / 培养方向条目`}}</span><button v-if="!savedOnly" class="text-button" @click="share(false)">复制筛选链接</button><button class="text-button" :disabled="!resultsReady||!filtered.length" @click="exportResults">导出当前结果 CSV ↓</button><a :href="withBase('/data/programs.csv')" download>完整索引 CSV ↓</a></div>
 <p v-if="note" role="status" class="explorer-feedback">{{note}}</p>
 <div v-if="selected.length" class="selection-bar"><div><strong>已选 {{selected.length}} / 4</strong><span v-if="selected.length===1"> · 再选一个项目开始对比</span><div class="selected-tags"><button v-for="p in picked" :key="p.id" @click="toggle(p.id)" :aria-label="`移除对比：${p.school} ${p.title}`">{{p.school}} · {{p.title.slice(0,16)}} ×</button></div></div><div class="tray-actions"><button class="text-button" @click="selected=[];closeCompare()">清空</button><button class="button primary" :disabled="selected.length<2" @click="compare">{{showCompare?'返回对比表':'开始对比'}} →</button></div></div>
 <section v-if="showCompare&&picked.length" id="comparison" ref="comparisonEl" tabindex="-1" class="comparison">
  <ProgramComparison :picked="picked" :details="details" :errors="detailErrors" :pending="detailLoading" @remove="toggle" @retry="fetchSchool" @share="share(true)" @close="closeCompare" />
 </section>
 <div v-if="error" class="empty-state" role="alert">{{error}} <button class="button secondary" @click="load">重试加载项目</button></div>
 <div v-if="searchFailed" class="empty-state" role="alert">{{searchError}} <button class="button secondary" @click="ensureSearch">重试全文搜索</button><button class="text-button" @click="filters.q=''">清除关键词</button></div>
 <div v-if="resultsReady" class="program-grid"><article v-for="p in visible" :key="p.id" class="program-card" :class="{selected:selected.includes(p.id)}">
  <div class="school-card-top"><span>{{p.school}}</span><span class="region-mini">{{p.regionName}}</span></div>
  <div class="program-save-row"><SaveProgram :id="p.id" :title="`${p.school} ${p.title}`" /></div>
  <a :href="withBase(p.url)"><h2>{{p.title}}</h2></a><p class="program-dept">{{p.department}}</p>
  <dl class="program-summary"><div><dt>学制</dt><dd>{{p.facts.duration.label}}</dd></div><div><dt>途径</dt><dd>{{routeLabel(p.facts.routes)}}</dd></div><div><dt>方向</dt><dd>{{p.focus||'详见项目培养说明'}}</dd></div></dl>
  <details class="card-preview"><summary>查看学制说明与申请要点</summary><p><strong>类型与学制：</strong>{{p.degree}}</p><p><strong>申请要点（节选）：</strong>{{p.facts.summary.admission||'资料尚未明确，请查看项目原文。'}}</p><a :href="withBase(p.url)">完整要求与来源 ↗</a></details>
  <div class="program-meta">参考 {{p.years?.join(' / ')}} · 核验 {{p.verified}}</div>
  <div class="school-links"><a :href="withBase(p.url)">查看项目详情 ↗</a><button @click="toggle(p.id)" :aria-label="`${selected.includes(p.id)?'移除':'加入'}对比：${p.school} ${p.title}`" :aria-pressed="selected.includes(p.id)">{{selected.includes(p.id)?'✓ 已加入对比':'+ 加入对比'}}</button></div>
 </article></div>
 <div v-if="resultsReady&&!filtered.length" class="empty-state"><h2>{{savedOnly&&!favorites.length?'还没有收藏项目':'没有找到匹配条目'}}</h2><p>{{savedOnly&&!favorites.length?'浏览项目时点“☆ 收藏”，之后可在这里继续筛选和对比。也可以导入已有备份。':'可以移除上方单个筛选条件，或试试“待核验”“多种 / 范围学制”。'}}</p><button class="button secondary" @click="reset">{{savedOnly&&!favorites.length?'浏览全部项目':'清除筛选'}}</button></div>
 <nav v-if="resultsReady&&filtered.length" class="pagination" aria-label="项目分页"><button :disabled="page===1" @click="turnPage(-1)">← 上一页</button><span>{{page}} / {{pages}}</span><button :disabled="page===pages" @click="turnPage(1)">下一页 →</button></nav>
</div>
</template>
