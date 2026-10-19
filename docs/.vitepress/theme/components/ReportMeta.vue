<script setup>
import {useData,withBase} from 'vitepress';const {frontmatter:f}=useData();
</script>
<template><div v-if="f.content_type==='school_report'" class="report-banner"><div><span class="badge">{{f.report_status==='reviewed'?'已人工复核':f.report_status==='needs_update'?'需更新':'调研草稿'}}</span><strong>目标入学 {{f.target_intake_year}}</strong><span>原报告核验 {{f.last_verified_on}}</span></div><p>实际参考入学年：{{f.reference_intake_years?.join(' / ')}}。网站整合不代表重新核验招生事实。</p><div class="report-downloads"><a v-if="f.pdf" :href="withBase(f.pdf)" target="_blank" rel="noopener">阅读原 PDF ↗</a><a v-if="f.sourceMd" :href="withBase(f.sourceMd)" download>下载 Markdown ↓</a></div></div></template>
