<script setup>
import {withBase} from 'vitepress';
import catalog from '../../../../data/catalog.json';
const regions=Object.entries(catalog.regions).filter(([id])=>catalog.schools.some(s=>s.region===id));
const counts=id=>catalog.schools.filter(s=>s.region===id).length;
</script>
<template>
<div class="home-page">
 <section class="hero">
  <div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> 金融数学 · 升学信息共同体</div><h1>看见更多选择，<br>走向适合你的<span>下一站。</span></h1><p>从培养内容到申请路径，把分散的院校资料连成一张图。<br class="desktop-only">面向 2028 年入学，让每一次选择都有依据。</p><div class="hero-actions"><a class="button primary" :href="withBase('/programs.html')">探索研究生项目 <span>↗</span></a><a class="button secondary" :href="withBase('/schools.html')">按大学浏览 →</a></div><div class="hero-note">班会分享资料库 / 2024 级金融数学本科生</div></div>
  <div class="atlas" :aria-label="`知识库覆盖 ${regions.length} 个地区，汇集金融、统计和数据分析等方向`"><div class="atlas-top"><span>YOUR NEXT CHAPTER</span><span>2028 ↗</span></div><div class="atlas-orbit orbit-one"></div><div class="atlas-orbit orbit-two"></div><div class="atlas-core"><span>GRADUATE</span><strong>探索 · 连接 · 选择</strong><span>PROGRAM ATLAS</span></div><div class="orbit-label label-1">金融与量化</div><div class="orbit-label label-2">统计与数学</div><div class="orbit-label label-3">数据与商分</div><div class="atlas-bottom"><span>从你的兴趣出发</span><span>∞ POSSIBILITIES</span></div></div>
 </section>
 <section class="stats" aria-label="资料库概览"><div><strong>{{catalog.schools.length}}</strong><span>所大学</span></div><div><strong>{{catalog.programCount}}</strong><span>项目 / 培养方向条目</span></div><div><strong>{{regions.length}}</strong><span>个地区</span></div><div><strong>2028</strong><span>目标入学年份</span></div></section>
 <div class="notice"><span>阅读提示</span><p>报告多参考 2026–2027 届资料；个别项目已列 2028 年信息。请逐项查看实际适用年份。当前报告均为调研草稿，未作为人工复核结果。</p><a :href="withBase('/about.html')">了解资料口径 ↗</a></div>
 <section class="section"><div class="section-heading"><div><div class="eyebrow">EXPLORE BY REGION</div><h2>从一个地区，开始探索</h2></div><a :href="withBase('/schools.html')">查看所有大学 →</a></div><div class="region-grid"><a v-for="([id,name],i) in regions" :key="id" class="region-card" :href="withBase('/schools.html?region='+id)"><span class="region-number">0{{i+1}} /</span><h3>{{name}}</h3><p>{{counts(id)}} 所大学 · {{catalog.schools.filter(s=>s.region===id).reduce((n,s)=>n+s.count,0)}} 个条目</p><div class="region-schools">{{catalog.schools.filter(s=>s.region===id).slice(0,3).map(s=>s.name).join(' / ')}}</div><span class="card-arrow">↗</span></a></div></section>
 <section class="section paths"><div class="section-heading"><div><div class="eyebrow">PLAN YOUR PATH</div><h2>不同路径，同样提前准备</h2></div><a :href="withBase('/timeline.html')">查看申请时间线 →</a></div><div class="path-grid"><a :href="withBase('/timeline.html#preparation')"><span>01 / 推免</span><h3>从资格与材料开始</h3><p>关注本校资格、夏令营、预推免及正式推免。考核方式逐项目核对。</p></a><a :href="withBase('/timeline.html#preparation')"><span>02 / 统考</span><h3>把考试科目查清楚</h3><p>区分推免与统考名额，按目标专业课安排复习，跟踪招生目录变化。</p></a><a :href="withBase('/timeline.html#preparation')"><span>03 / 申请制</span><h3>课程与经历一起准备</h3><p>检查先修课、语言和考试要求，分别记录各轮次与入学季。</p></a></div></section>
 <section class="closing"><div><span class="eyebrow">BUILT ON EVIDENCE</span><h2>信息能追溯，选择才有底。</h2><p>每校完整报告、官方来源、参考年度与待核验清单，一起保留。</p></div><a class="button secondary" :href="withBase('/guide.html')">查看调研规范 ↗</a></section>
</div>
</template>
