/* Strict, column-aware, fail-closed parser of Ministry of Health Attica duty PDF text items.
 * Never creates a hospital name that is not present in the published PDF. */
export const SPECIALTIES=[
 ['internal',/ΠΑΘΟΛΟΓΙΚ/],['cardiology',/ΚΑΡΔΙΟΛΟΓΙΚ/],['surgery',/^ΧΕΙΡΟΥΡΓΙΚ/],
 ['pediatrics',/ΠΑΙΔΙΑΤΡΙΚ/],['orthopedic',/ΟΡΘΟΠ[ΕΑΙ]ΔΙΚ/],
 ['gynecology',/ΓΥΝΑΙΚΟΛΟΓΙΚ/],['neurology',/^ΝΕΥΡΟΛΟΓΙΚ/],['psychiatry',/^ΨΥΧΙΑΤΡΙΚ/],
 ['ent',/^Ω\.?Ρ\.?Λ\.?/],['ophthalmology',/ΟΦΘΑΛΜΟΛΟΓΙΚ/],
 ['neurosurgery',/ΝΕΥΡΟΧΕΙΡΟΥΡΓΙΚ/],['urology',/ΟΥΡΟΛΟΓΙΚ/],
 ['pulmonology',/ΠΝΕΥΜΟΝΟΛΟΓΙΚ/],['dermatology',/ΔΕΡΜΑΤΟΛΟΓΙΚ/],
 ['hematology',/ΑΙΜΑΤΟΛΟΓΙΚ/],['gastroenterology',/ΓΑΣΤΡΕΝΤΕΡΟΛΟΓΙΚ/],
 ['nephrology',/ΝΕΦΡΟΛΟΓΙΚ/],['oncology',/ΟΓΚΟΛΟΓΙΚ/],
 ['obstetrics',/ΜΑΙΕΥΤΙΚ/],['vascular',/ΑΓΓΕΙΟΧΕΙΡ/],
 ['dental',/ΟΔΟΝΤΙΑΤΡΙΚ/],['pediatric_psychiatry',/ΠΑΙΔΟΨΥΧΙΑΤΡΙΚ/],
 ['hand_surgery',/ΚΛΙΝΙΚΗ ΧΕΡΙΟΥ/],['endocrinology',/ΕΝΔΟΚΡΙΝΟΛΟΓΙΚ/],
 ['maxillofacial',/ΓΝΑΘΟΧΕΙΡΟΥΡΓΙΚ/],['thoracic',/ΘΩΡΑΚΟΧΕΙΡ/],
 ['cardiac_surgery',/ΚΑΡΔΙΟΧΕΙΡ/],['rheumatology',/ΡΕΥΜΑΤΟΛΟΓΙΚ/],
 ['plastic_surgery',/ΠΛΑΣΤ.*ΧΕΙΡΟΥΡΓΙΚ/]
];
const HOSPITALS=[
 ['Γ.Ν.Α. Ευαγγελισμός',/ΕΥΑΓΓΕΛΙΣΜΟΣ/],
 ['Γ.Ν.Ν. Ιωνίας Κωνσταντοπούλειο',/ΚΩΝ\/?ΠΟΥΛΕΙΟ|ΚΩΝΣΤΑΝΤΟΠΟΥΛΕΙΟ/],
 ['Π.Γ.Ν. Αττικόν',/ΑΤΤΙΚΟΝ/],
 ['Γ.Ν. Ασκληπιείο Βούλας',/ΑΣΚΛΗΠΙΕΙΟ/],
 ['Γ.Ν.Α. ΚΑΤ',/«?ΚΑΤ»?|Κ\.Α\.Τ\./],
 ['Ν.Δ.Ν.Α. Ανδρέας Συγγρός',/ΣΥΓΓΡΟΣ/],
 ['Γ.Ν.Α. Γεώργιος Γεννηματάς',/Γ[\. ]?ΓΕΝΝΗΜΑΤΑΣ/],
 ['Γ.Ν.Α. Έλενα Βενιζέλου',/ΕΛ[. ]*ΒΕΝΙΖΕΛΟΥ/],
 ['Γ.Ν. Παίδων Αγία Σοφία',/ΑΓ[. ]*ΣΟΦΙΑ/],
 ['Γ.Ν. Αλεξάνδρα',/«?ΑΛΕΞΑΝΔΡΑ»?/],
 ['Α.Ο.Ν.Α. Άγιος Σάββας',/ΑΓΙΟΣ ΣΑΒΒΑΣ/],
 ['Γ.Ο.Ν.Κ. Άγιοι Ανάργυροι',/ΑΓΙΟΙ ΑΝΑΡΓΥΡΟΙ/],
 ['Δρομοκαΐτειο',/ΔΡΟΜΟΚΑ/],
 ['Οφθαλμιατρείο Αθηνών',/ΟΦΘΑΛΜΙΑΤΡΕΙΟ/],
 ['Γ.Ν.Π. Τζάνειο',/ΤΖΑΝΕΙΟ/],
 ['Γ.Ν.Α. Λαϊκό',/«?ΛΑΙΚΟ»?/],
 ['Γ.Ν.Ν. Αγ. Παντελεήμων',/ΑΓ[. ]*ΠΑΝΤΕΛΕΗΜ/],
 ['ΝΙΜΤΣ',/\bΝΙΜΤΣ\b/],
 ['Γ.Ν. Παίδων Π. & Α. Κυριακού',/ΚΥΡΙΑΚΟΥ/],
 ['Γ.Ν.Α. Κοργιαλένειο – Μπενάκειο Ερυθρός Σταυρός',/ΕΡΥΘΡΟΣ ΣΤΑΥΡΟΣ/],
 ['Γ.Ν.Ν.Θ.Α. Σωτηρία',/«?ΣΩΤΗΡΙΑ»?/],
 ['Σισμανόγλειο',/ΣΙΣΜΑΝΟΓΛ/],
 ['Αμαλία Φλέμιγκ',/ΦΛΕΜΙΓΚ/],
 ['Ιπποκράτειο',/ΙΠΠΟΚΡΑΤΕΙΟ/],
 ['Θριάσιο',/ΘΡΙΑΣΙΟ/],
 ['Αρεταίειο',/ΑΡΕΤΑΙΕΙΟ/],
 ['Αιγινήτειο',/ΑΙΓΙΝΗΤΕΙΟ/],
 ['Μεταξά',/«?ΜΕΤΑΞΑ»?/],
 ['Αγία Βαρβάρα',/ΑΓ[. ]*ΒΑΡΒΑΡΑ/],
 ['Παμμακάριστος',/ΠΑΜΜΑΚΑΡΙΣΤ/]
];
export const normalized=s=>String(s||'').toLocaleUpperCase('el-GR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
const specOf=s=>SPECIALTIES.find(([k,re])=>re.test(normalized(s)))?.[0];
const hospitalOf=s=>HOSPITALS.find(([k,re])=>re.test(normalized(s)))?.[0];

export function parseAtticaPdf(pages,{date,source}){
 if(!pages.length)throw Error('No PDF pages');
 const header=normalized(pages[0].items.slice(0,100).map(x=>x.str).join(' '));
 const [year,month,day]=date.split('-').map(Number);
 const months=['','ΙΑΝΟΥΑΡΙΟΥ','ΦΕΒΡΟΥΑΡΙΟΥ','ΜΑΡΤΙΟΥ','ΑΠΡΙΛΙΟΥ','ΜΑΙΟΥ','ΙΟΥΝΙΟΥ','ΙΟΥΛΙΟΥ','ΑΥΓΟΥΣΤΟΥ','ΣΕΠΤΕΜΒΡΙΟΥ','ΟΚΤΩΒΡΙΟΥ','ΝΟΕΜΒΡΙΟΥ','ΔΕΚΕΜΒΡΙΟΥ'];
 if(!header.includes(String(year))||!header.includes(months[month])||!new RegExp('(^|\\D)'+day+'(\\D|$)').test(header))throw Error('Duty PDF date mismatch');
 const out=[],seen=new Set();
 for(const page of pages){
  const width=page.width;
  const rows=(page.items||[]).filter(x=>typeof x.str==='string'&&x.str.trim()&&Array.isArray(x.transform))
    .map(x=>({txt:x.str.trim(),x:x.transform[4],y:x.transform[5]}))
    .sort((a,b)=>b.y-a.y||a.x-b.x);
  // Columns are inferred from the published PDF table. Do not parse layouts that lack those headings.
  const tableHeader=rows.filter(x=>normalized(x.txt).includes('ΚΛΙΝΙΚΕΣ'));
  if(!tableHeader.length)continue;
  const lines=[];
  for(const item of rows){
   let col=item.x<width*.205?0:item.x<width*.435?1:item.x<width*.663?2:3;
   let line=lines.find(l=>l.col===col&&Math.abs(l.y-item.y)<2.2);
   if(!line){line={col,y:item.y,parts:[]};lines.push(line)}
   line.parts.push(item);
  }
  for(const l of lines)l.text=l.parts.sort((a,b)=>a.x-b.x).map(v=>v.txt).join(' ').replace(/\s+/g,' ').trim();
  const starts=lines.filter(x=>x.col===0&&specOf(x.text)).sort((a,b)=>b.y-a.y);
  for(let j=0;j<starts.length;j++){
   const s=starts[j],end=starts[j+1]?.y??-1,sp=specOf(s.text);
   if(!sp)continue;
   const slots=lines.filter(x=>[1,2].includes(x.col)&&x.y<=s.y+3&&x.y>end+2&&x.text);
   for(const line of slots){
    const name=hospitalOf(line.text);
    if(!name)continue;
    const until=line.text.match(/(?:ΕΩΣ|έως)\s*(\d{1,2}:\d{2})/i)?.[1];
    const hours=until?'έως '+until:line.col===1?'08:00–08:00 επομένης':'08:00–23:00';
    const key=sp+'|'+name+'|'+hours;
    if(seen.has(key))continue;
    seen.add(key);out.push({name,specialty:sp,hours,source,sourceType:'official-pdf',date,area:'Αττική',onDutySource:'published-roster',verifiedLive:false,raw:line.text.slice(0,180)})
   }
  }
 }
 if(!out.length)throw Error('PDF layout unrecognized: no verified records parsed');
 return out;
}
