export const durationOptions=[['short','1年及以内'],['medium','1年以上、2年以内'],['two','2年'],['long','2年以上'],['variable','多种 / 范围学制'],['terms','按学期 / 学季'],['unknown','待核验']];
export const routeOptions=[['recommendation','推免'],['exam','统考'],['application','申请制'],['unknown','含待核验途径']];
export const categories=['量化金融','金融与金融科技','统计与应用数学','数据与商业分析','经济与计量','管理与运筹','精算与风险管理'];
export const emptyFilters=()=>({q:'',region:'',school:'',tag:'',duration:'',route:''});
export function readFilters(params,catalog) {
  const f=emptyFilters();f.q=params.get('q')||'';
  const region=params.get('region'),school=params.get('school');
  if(Object.hasOwn(catalog.regions,region))f.region=region;
  if(catalog.schools.some(s=>s.id===school&&(!f.region||s.region===f.region)))f.school=school;
  for(const [key,options] of [['tag',categories],['duration',durationOptions.map(x=>x[0])],['route',routeOptions.map(x=>x[0])]])if(options.includes(params.get(key)))f[key]=params.get(key);
  return f;
}
export function matchesProgram(p,f) {
  return (!f.region||p.region===f.region)&&(!f.school||p.schoolId===f.school)&&(!f.tag||p.tags.includes(f.tag))&&(!f.duration||p.facts.duration.category===f.duration)&&(!f.route||(f.route==='unknown'?p.facts.routes.uncertain:p.facts.routes.values.includes(f.route)))&&f.q.trim().toLowerCase().split(/\s+/).filter(Boolean).every(q=>(p.school+' '+p.search).toLowerCase().includes(q));
}
export function selectedIds(value,all) {
  return [...new Set(Array.isArray(value)?value:[])].filter(id=>typeof id==='string'&&all.some(p=>p.id===id)).slice(0,4);
}
export function routeLabel(routes) {
  const labels=routes.values.map(id=>routeOptions.find(x=>x[0]===id)?.[1]).filter(Boolean);
  return labels.length?labels.join(' / ')+(routes.uncertain?' · 部分待核验':''):'申请途径待核验';
}
