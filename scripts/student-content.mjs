import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({html: false, linkify: true});
export const plain = s => s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<br\s*\/?>/gi, ' ').replace(/[`*_#]/g, '').trim();
export const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const missing = /官网未|未公开|未公布|尚未|待核|待发布|未单列|未单独|未找到|未检索到|需核验/;
const substantive = /\d+(?:\.\d+)?\s*(?:万元|元|万|人|分|%|学分|个月)|(?<!\d)\d{1,2}(?:\.\d+)?\s*年|(?:USD|HKD|SGD|AUD|GBP|US\$|HK\$|S\$|£|\$)\s*[\d,]+|\b(?:101|201|204|301|302|303|396|431|432|408)\b|不要求|无需|豁免|可选|不接收|仅接收|仅限|必须|须具备|工作经验|全日制|不适用|Master|MSc|MEng|MFin/;

// Omit standalone missing-data statements, but retain mixed factual statements and
// eligibility restrictions verbatim. Canonical reports remain byte-for-byte intact.
export function studentText(value) {
  const protectedText = [];
  let text = value.replace(/\[[^\]]*\]\(https?:\/\/[^\s)]+\)/g, x => `LINKTOKEN${protectedText.push(x)-1}END`);
  text = text.split(/(?<=[。！？])(?=[^）)])/u).filter(sentence => {
    const clean = plain(sentence).replace(/LINKTOKEN\d+END/g, '').replace(/(?:检索|核验|更新)(?:日期)?[：:]?\s*20\d\d-\d\d-\d\d/g, '').trim();
    if (!missing.test(clean)) return true;
    if (substantive.test(clean)) return true;
    // A missing-data-only sentence has no positive proposition before the caveat.
    return /包含|包括|设有|提供|强调|侧重|课程为|适合|要求(?:达到|提供|具备|提交|至少|本科|学士)|接受|采用|需提交|可申请|毕业生进入|就业率(?:为|达|约)|学费为|学制为/.test(clean);
  }).join('');
  return text.replace(/LINKTOKEN(\d+)END/g, (_,i) => protectedText[+i]).trim();
}

export function render(value) {
  const readable=value.replace(/\[\s*S\d+\s*([：:]\s*([^\]]+))?\]/g,(_,colon,title)=>'['+(title||'官网')+']');
  return md.render(readable.replace(/<br\s*\/?>/gi, ' ')).replace(/href="(https?:[^\"]+)"/g, 'href="$1" target="_blank" rel="noopener noreferrer"');
}

export function classify(label) {
  if (/项目\s*ID|官方依据|官方来源|核验状态|历史培养方案校验/.test(label)) return 'archive';
  if (/适配/.test(label)) return 'fit';
  if (/费用|学费|奖|资助|就业|毕业去向|去向/.test(label)) return 'fees';
  if (/课程|培养|先修|技能|能力|实践|编程|工具|研究方向/.test(label) && !/基本情况/.test(label)) return 'courses';
  if (/日期|时间|批次节点/.test(label) && !/招生|初试|申请.*要求/.test(label)) return 'dates';
  if (/招生|申请|录取|初试|复试|竞争|材料|考核|选拔|英语|语言|考试|GPA/.test(label)) return 'admission';
  if (/基本|院系|名称|中英文|学位|学制|城市|校区|入学季/.test(label)) return 'basic';
  return 'other';
}

export function groupFields(fields) {
  const groups = Object.fromEntries(['basic','fit','courses','admission','fees','dates','other'].map(k=>[k,[]]));
  for (const f of fields) {
    const key=classify(f.label),value=studentText(f.value);
    if (key!=='archive' && plain(value).length>2) groups[key].push({...f,value});
  }
  return groups;
}

export function renderFields(fields) {
  return fields.map(f => render(`**${f.label.replace(/（严格区分计划和实际录取）|（重点核对）|与官网状态/g,'')}**：${f.value}`)).join('\n');
}

export function sourceLinks(body) {
  const links = new Map();
  for (const match of body.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)) {
    const title=plain(match[1]).replace(/^\s*S\d+[：:]?\s*/, '').trim();
    if (!links.has(match[2]) || title.length>(links.get(match[2])||'').length) links.set(match[2],title);
  }
  return links;
}

export function timelineText(text) {
  return text.split('\n').filter(line => {
    if (line.startsWith('|') && missing.test(plain(line))) {
      const cells = line.split('|').slice(1,-1);
      // Only exclude rows which have no date/action, retaining historical dates.
      const time=plain(cells[1]||'');
      return /\d{1,2}[月日:/.-]|20\d\d.{0,4}[春夏秋冬]|关注|准备|递交|申请|确认|复习/.test(time) && !/^(官网未|尚未|待核|未公开)/.test(time);
    }
    return !/^\*\*.*(?:不适用|官网未公开).*\*\*$/.test(line);
  }).join('\n').replace(/^###\s+4\.\d+\s+/gm, '### ');
}

export function schoolPage(s, entries, content, getSection, alumni) {
  const intro = [...new Set(entries.flatMap(p=>p.tags))].join('、');
  const lines = [`# ${s.name}`, `<p class="school-english">${escape(s.school_name_en)}</p>`,
    `<div class="school-facts"><span>${escape(s.country_or_region)}</span><span>${entries.length} 个项目 / 培养方向</span><span>面向 ${s.target_intake_year} 年入学准备</span></div>`,
    `从${intro}等方向了解这所大学。先用下表找方向，再展开项目的课程、申请与费用信息。`,
    `<p class="edition-note">招生资料参考 ${s.reference_intake_years.join(' / ')} 年入学批次，具体日期与费用保留各自年份。请按目标入学届别查看招生通知。资料检索：${s.last_verified_on}。</p>`,
    `## 项目速览 {#program-overview}`];
  const overview=['| 项目 | 院系与学制 | 培养重点 |', '|---|---|---|'];
  for (const p of entries) {
    const short=plain(p.row?.[0]||p.title).replace(new RegExp(s.id+'-p\\d{3}','g'),'').replace(/^p\d{3}\s*/,'').trim();
    overview.push(`| [${short.replaceAll('|','／')}](#${p.id}) | ${studentText(p.row?.[1]||'')}<br>${studentText(p.row?.[2]||'')} | ${studentText(p.row?.[3]||p.focus)} |`);
  }
  lines.push(overview.join('\n'));
  const common=[...getSection(content,1).matchAll(/^[-*]\s+\*\*([^*\n]+)\*\*\s*[：:]?\s*([\s\S]*?)(?=^[-*]\s+\*\*|$(?![\s\S]))/gm)]
    .filter(x=>/语言|英语|费用|生活|资助|材料|学历|本科.*对照|最低|招生渠道|统考通用|工作经验/.test(x[1]))
    .map(x=>({label:x[1].replace(/[：:]$/,''),value:studentText(x[2].trim())})).filter(x=>x.value);
  if(common.length) lines.push('## 申请前要知道 {#before-applying}', '<details class="program-detail"><summary>学校通用要求与预算参考</summary>\n\n'+renderFields(common)+'\n</details>');
  const related=alumni.filter(a=>a.schoolIds.includes(s.id));
  if(related.length) {
    lines.push('## 学长学姐的选择 {#alumni}', '看看统计学院同学的升学经历与准备方法。');
    for(const a of related) {
      const offer = a.schoolId!==s.id && !a.jointSchoolIds?.includes(s.id);
      lines.push(`- [**${a.name}** · ${a.cohort} · ${a.major}](/alumni.html#${a.id})：${offer ? a.offers.filter(o=>o.schoolId===s.id).map(o=>o.school+'（'+o.program+'）').join('；')+'，获录取。最终选择'+a.destination : a.destination+'（'+a.route+'）'}。[阅读学院专访](${a.source})`);
    }
  }
  lines.push('## 项目详解 {#program-details}');
  for (const p of entries) {
    const g=p.groups;
    lines.push(`### ${p.title} {#${p.id}}`, `<div class="program-lead">\n\n${renderFields(g.fit)||render(p.focus)}\n</div>`,
      `<div class="program-facts">\n\n${renderFields(g.basic)||render(p.degree)}\n</div>`);
    for(const [keys,label] of [[['courses'],'学什么 · 课程与能力'],[['admission','dates'],'怎么申请 · 条件、考试与日期'],[['fees'],'费用与毕业去向'],[['other'],'其他项目信息']]) {
      const fields=keys.flatMap(k=>g[k]);
      if(fields.length) lines.push(`<details class="program-detail"><summary>${label}</summary>\n\n${renderFields(fields)}\n</details>`);
    }
    lines.push(`<div class="program-compare">\n\n[加入跨校对比 →](/programs.html?add=${p.id})\n\n</div>`);
  }
  const timeline=timelineText(getSection(content,4));
  lines.push('## 申请时间线 {#application-timeline}', '以下是对应年份的申请节点；2028 年入学准备可结合[全站时间线](/timeline.html)安排。', timeline);
  const links=sourceLinks(content);
  lines.push('## 官方链接与延伸阅读 {#official-sources}', `<details class="source-directory"><summary>项目官网、招生与课程链接（${links.size} 项）</summary>\n`);
  for(const [url,title] of links) lines.push(`- [${title||new URL(url).hostname}](${url})`);
  lines.push('\n</details>', '<SchoolDownloads />');
  return lines.join('\n\n');
}
