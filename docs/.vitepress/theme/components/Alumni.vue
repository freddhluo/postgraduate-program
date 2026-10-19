<script setup>
import {ref,computed,onMounted} from 'vue';
import {withBase} from 'vitepress';
import data from '../../../../data/alumni.json';
import catalog from '../../../../data/catalog.json';
const category=ref(''),query=ref('');
const schoolById=id=>catalog.schools.find(s=>s.id===id);
const schoolByName=name=>catalog.schools.find(s=>s.name===name);
const filtered=computed(()=>data.cases.filter(a=>(!category.value||a.category===category.value||a.route===category.value)&&JSON.stringify(a).toLowerCase().includes(query.value.toLowerCase())));
onMounted(()=>{if(location.hash)document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();});
</script>

<template>
<div class="app-page alumni-page">
 <header class="page-intro"><div class="eyebrow">PATHS FROM OUR COMMUNITY</div><h1>看看他们，走向了哪里。</h1><p>从统计学院出发，去金融、数据、研究与公共服务的不同现场。<br>读一段真实经历，找到值得尝试的下一步。</p></header>
 <div class="alumni-intro-grid"><div><strong>{{data.cases.length}}</strong><span>本科升学案例</span></div><div><strong>{{data.employment.length}}</strong><span>硕士就业案例</span></div><div><strong>3</strong><span>推免 · 统考 · 申请制</span></div></div>
 <nav class="alumni-nav" aria-label="毕业去向栏目"><a href="#study">本科升学</a><a href="#employment">硕士就业</a><a href="#destinations">更多历史去向</a></nav>
 <section id="study" class="alumni-section"><div class="section-heading"><div><div class="eyebrow">FURTHER STUDY</div><h2>从同专业的经历里，找准备方向</h2></div></div>
 <div class="filter-bar"><label class="search-field"><span>⌕</span><input v-model="query" aria-label="搜索升学案例" placeholder="搜索姓名、大学、专业或准备经历…"></label></div>
 <div class="chips"><button v-for="c in ['', '境内升学','境外升学','推免','统考','申请制']" :key="c" :class="{active:category===c}" :aria-pressed="category===c" @click="category=c">{{c||'全部案例'}}</button></div>
 <p class="helper">以下为专访报道时的升学选择。其他录取单独列示；个人经历可供参考，并非项目录取门槛。</p>
 <div class="result-summary" role="status">{{filtered.length}} 个案例 <button v-if="query||category" class="text-button" @click="query='';category=''">重置筛选</button></div>
 <div class="alumni-grid">
  <article v-for="a in filtered" :key="a.id" :id="a.id" class="alumni-card">
   <div class="school-card-top"><span>{{a.cohort}} · {{a.major}}</span><span class="badge">{{a.route}}</span></div>
   <h3>{{a.name}}</h3><p class="alumni-destination">{{a.destination}}</p>
   <p class="alumni-takeaway">{{a.takeaway}}</p>
   <details v-if="a.offers.length" class="alumni-offers"><summary>还获得了哪些录取？</summary><ul><li v-for="o in a.offers" :key="o.schoolId"><a v-if="schoolById(o.schoolId)" :href="withBase(schoolById(o.schoolId).path)">{{o.school}}</a><span v-else>{{o.school}}</span> · {{o.program}}</li></ul><p v-if="a.offerNote">{{a.offerNote}}</p></details>
   <div class="school-links"><a :href="a.source" target="_blank" rel="noopener noreferrer">阅读完整专访 ↗</a><a v-if="schoolById(a.schoolId)" :href="withBase(schoolById(a.schoolId).path)">了解这所大学 →</a></div>
   <p class="source-date">学院报道 {{a.published}}</p>
  </article>
 </div><div v-if="!filtered.length" class="empty-state"><h3>没有匹配的案例</h3><p>可以换一个学校、专业或姓名关键词。</p></div>
 </section>
 <section id="employment" class="alumni-section"><div class="section-heading"><div><div class="eyebrow">CAREER PATHS</div><h2>读完硕士，可以走向哪些岗位？</h2></div></div><p class="section-description">下面的毕业生均来自统计学院硕士项目，覆盖银行与国家统计系统。</p>
 <div class="career-grid"><article v-for="a in data.employment" :key="a.id" :id="a.id" class="career-card"><div class="school-card-top"><span>{{a.cohort}} · {{a.major}}</span></div><h3>{{a.name}}</h3><p class="alumni-destination">{{a.destination}}</p><p class="career-role">{{a.role}}</p><p v-if="a.takeaway" class="alumni-takeaway">{{a.takeaway}}</p><a :href="a.source" target="_blank" rel="noopener noreferrer">阅读职业经历 ↗</a><small>报道 {{a.published}}</small></article></div>
 </section>
 <section id="destinations" class="alumni-section"><div class="section-heading"><div><div class="eyebrow">MORE POSSIBILITIES</div><h2>更广的去向，更具体的想象</h2></div></div><p class="section-description">学院 {{data.history.published}} 发布的历届汇总，展示了不同学历毕业生的升学与就业去向。</p><div class="destination-tags"><template v-for="name in data.history.schools" :key="name"><a v-if="schoolByName(name)" :href="withBase(schoolByName(name).path)">{{name}} ↗</a><span v-else>{{name}}</span></template></div><div class="sector-grid"><article v-for="s in data.history.sectors" :key="s.name"><h3>{{s.name}}</h3><p>{{s.employers}}</p></article></div><p class="helper">雇主名称按历史报道保留。汇总覆盖不同学历层次，不代表某一届本科生或单个硕士项目的就业比例。</p><a class="text-link" :href="data.history.source" target="_blank" rel="noopener noreferrer">查看学院历届去向汇总 ↗</a></section>
 <p class="source-date">信息来源：学院毕业生专访、学院就业信息与学校新闻网 · 查阅 {{data.checkedOn}}</p>
</div>
</template>
