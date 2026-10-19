const idPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*-p\d{3}$/;
export const savedKey='grad-favorites-v1';
export function savedIds(value,allowed) {
  const valid=allowed&&new Set(allowed);
  return [...new Set(Array.isArray(value)?value:[])].filter(id=>typeof id==='string'&&idPattern.test(id)&&(!valid||valid.has(id))).slice(0,1000);
}
export function favoriteBackup(ids) {
  return JSON.stringify({format:'postgraduate-program.favorites',version:1,programIds:savedIds(ids)},null,2);
}
export function readFavoriteBackup(text,allowed) {
  const data=JSON.parse(text);
  if(data?.format!=='postgraduate-program.favorites'||data.version!==1||!Array.isArray(data.programIds))throw Error('invalid backup');
  return savedIds(data.programIds,allowed);
}
export function programCsv(programs,origin) {
  const cell=value=>{
    let text=String(value??'');
    if(/^[\s]*[=+@-]/.test(text))text="'"+text;
    return '"'+text.replaceAll('"','""')+'"';
  };
  const rows=[['项目ID','大学','地区','项目名称','院系','类型与学制','培养方向','参考入学年份','资料核验日期','完整资料与来源'],
    ...programs.map(p=>[p.id,p.school,p.regionName,p.title,p.department,p.degree,p.focus,(p.years||[]).join(' / '),p.verified,new URL(p.url,origin).href])];
  return '\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
