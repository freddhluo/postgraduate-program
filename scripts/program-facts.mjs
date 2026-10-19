import {plain} from './student-content.mjs';

// Only interpret the overview's duration cell: work experience, intake years,
// credits and semesters must not silently become years of study.
export function durationFact(value) {
  const text=plain(value).replace(/[^；;。]*工作[^；;。]*|[^；;。]*需\s*\d+\s*年经验[^；;。]*/g,'');
  const uncertain=/待核|未公开|未统一|未公示|未公布/.test(text);
  if(uncertain) return {category:'unknown',label:'学制待核验',source:plain(value)};
  const units=[...text.matchAll(/(?<![\d.])(\d{1,2}(?:\.\d+)?(?:\s*[–—~～/或-]\s*\d{1,2}(?:\.\d+)?)*)\s*(个月|months?|(?:calendar\s+)?years?|学?年)/gi)];
  const candidates=units.filter(m=>+m[1].split(/[–—~～/或-]/)[0]<=36);
  if(candidates.length) {
    const months=candidates.flatMap(m=>m[1].split(/[–—~～/或-]/).map(n=>+n*(/月|month/i.test(m[2])?1:12)));
    const multiple=new Set(months).size>1 || /至少|最短|最快|最长|最少|以上|以内/.test(text);
    const n=months[0];
    const category=multiple?'variable':n<=12?'short':n<24?'medium':n===24?'two':'long';
    const qualifier=text.slice(Math.max(0,candidates[0].index-3),candidates[0].index).match(/(?:通常约|通常|预计|标准|基准|约)$/)?.[0]||'';
    return {category,label:multiple?'多种 / 范围学制':qualifier+candidates[0][0].trim(),source:plain(value)};
  }
  if(/学期|学季/.test(text)) return {category:'terms',label:'按学期 / 学季',source:plain(value)};
  return {category:'unknown',label:'学制待核验',source:plain(value)};
}

export function routeFact(overview, region, admissionText='') {
  const text=plain(overview),values=[];
  if(region!=='china-mainland' && /申请|网申|admission|application|上传|SOP|推荐报告|推荐信/i.test(text+' '+admissionText)) values.push('application');
  if(region==='china-mainland') {
    for(const [word,key] of [['推免','recommendation'],['统考','exam']]) {
      const clauses=text.split(/[；;。]/).filter(c=>c.includes(word));
      if(clauses.some(c=>!new RegExp('(?:无|不(?:接收|招收|接受|参加)?|非)\\s*'+word).test(c) && !/待核|须核|需查|是否|按培养单位|统考核验|请核/.test(c))) values.push(key);
    }
    if(/自主网申|自主招生|直接申请|网申/.test(text) && !/与自主招生不同|非自主招生/.test(text)) values.push('application');
  }
  const uncertain=text.split(/[；;。]/).some(c=>/推免|统考|网申|申请途径|招生途径/.test(c)&&/待核|须核|需查|是否|按培养单位|统考核验|请核/.test(c)) || values.length===0;
  return {values,uncertain,source:text};
}

// A clearly labelled excerpt, never a generated admissions claim. Preserve
// complete clauses and the full linked field for the expansion beside it.
export function excerpt(value, max=140) {
  const text=plain(value).replace(/(?:检索|核验)(?:日期)?[：:]?\s*20\d\d-\d\d-\d\d/g,'').replace(/\s+/g,' ').trim();
  if(text.length<=max)return text;
  let end=-1,depth=0;
  for(let i=0;i<Math.min(text.length,max);i++) {
    if(/[（(【[]/.test(text[i]))depth++;
    if(/[）)】\]]/.test(text[i]))depth=Math.max(0,depth-1);
    if(!depth && /[。；;]/.test(text[i]))end=i+1;
  }
  // Long unsplittable clauses are shown with an explicit omission marker.
  return text.slice(0,end>=45?end:max).trim()+'…';
}

export function programFacts(p, groups, row) {
  const texts=Object.fromEntries(Object.entries(groups).map(([key,fields])=>[key,fields.map(f=>f.value).join('\n')]));
  const admission=groups.admission.filter(f=>/途径|申请.*要求|初试|考试|招生渠道/.test(f.label));
  const summary={
    admission:excerpt(admission.map(f=>f.value).join('\n')||texts.admission),
    courses:excerpt(texts.courses),fees:excerpt(texts.fees),fit:excerpt(texts.fit),dates:excerpt(texts.dates),
  };
  const routeOverview=row?.[4]||'';
  const routeSource=p.region==='china-mainland'&&!/推免|统考|网申|直接申请|自主招生/.test(routeOverview)?admission.map(f=>f.value).join('\n'):routeOverview;
  return {duration:durationFact(row?.[2]||p.degree),routes:routeFact(routeSource,p.region,texts.admission+' '+texts.dates),summary};
}
