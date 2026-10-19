import {defineConfig} from 'vitepress';
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync(new URL('../../data/catalog.json',import.meta.url),'utf8'));
const base=process.env.SITE_BASE||'/';
export default defineConfig({
 lang:'zh-CN',title:'升学图谱',description:'金融数学本科生研究生项目知识库 · 2028 入学参考',base,cleanUrls:false,
 head:[['meta',{name:'theme-color',content:'#155c50'}]],
 lastUpdated:false, markdown:{html:true},
 themeConfig:{logo:undefined,siteTitle:'升学图谱',nav:[{text:'院校导航',link:'/schools'},{text:'项目检索',link:'/programs'},{text:'申请时间线',link:'/timeline'},{text:'学长学姐去向',link:'/alumni'},{text:'阅读指南',link:'/about'}],
 sidebar:[{text:'开始探索',items:[{text:'院校导航',link:'/schools'},{text:'项目检索与对比',link:'/programs'},{text:'申请时间线',link:'/timeline'},{text:'学长学姐去向',link:'/alumni'},{text:'阅读指南',link:'/about'}]},...Object.entries(catalog.regions).filter(([id])=>catalog.schools.some(s=>s.region===id)).map(([id,name])=>({text:name,collapsed:true,items:catalog.schools.filter(s=>s.region===id).map(s=>({text:s.name,link:s.path.replace('.html','')}))}))],
 search:{provider:'local',options:{locales:{root:{translations:{button:{buttonText:'搜索全部资料',buttonAriaLabel:'搜索全部资料'},modal:{displayDetails:'显示详情',resetButtonTitle:'清除',backButtonTitle:'返回',noResultsText:'没有找到相关结果',footer:{selectText:'选择',navigateText:'切换',closeText:'关闭'}}}}}}},
 outline:{label:'本页目录',level:[2,3]},docFooter:{prev:'上一篇',next:'下一篇'},returnToTopLabel:'返回顶部',sidebarMenuLabel:'院校目录',darkModeSwitchLabel:'切换深色模式',footer:{message:'对外经济贸易大学 · 统计学院 · 金融数学专业班会分享',copyright:'目标入学 2028 · 各项要求以对应届别的官方通知为准'}
 },
});
