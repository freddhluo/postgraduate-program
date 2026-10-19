export const timelinePaths=[['recommendation','推免'],['exam','统考'],['application','境外 / 申请制']];
export function timelineSchools(catalog,{region='',savedOnly=false},favorites=[]) {
  const savedSchools=new Set(favorites.map(id=>id.replace(/-p\d{3}$/, '')));
  return catalog.schools.filter(s=>(!region||s.region===region)&&(!savedOnly||savedSchools.has(s.id)));
}
export function readTimelineFilters(params,catalog,favorites=[]) {
  const region=Object.hasOwn(catalog.regions,params.get('region'))?params.get('region'):'';
  const path=timelinePaths.some(([id])=>id===params.get('path'))?params.get('path'):'';
  const savedOnly=params.get('saved')==='1';
  const schools=timelineSchools(catalog,{region,savedOnly},favorites),id=params.get('school');
  const school=schools.some(s=>s.id===id)?id:(schools.find(s=>s.id==='cn-uibe')||schools[0])?.id||'';
  return {region,path,savedOnly,school};
}
