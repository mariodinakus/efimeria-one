/* Recognise duty marks in official 3rd Health District monthly XLSX, fail closed.
 * A checked cell is a PUBLISHED scheduled duty; this is not a live operational guarantee. */
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleUpperCase('el-GR').replace(/\s+/g,' ').trim();
const SPEC=[
 ['pediatric_psychiatry',/^ΠΑΙΔΟΨΥΧ/],['pediatric_surgery',/^ΠΑΙΔΟΧ/],
 ['pediatric_orthopedic',/^ΠΑΙΔΟΟΡΘ/],['neurosurgery',/^ΝΕΥΡΟΧ/],
 ['cardiac_surgery',/^ΚΑΡΔΟΧ/],['thoracic',/^ΘΩΡ/],
 ['plastic_surgery',/^ΠΛΑΣΤ/],['vascular',/^ΑΓΓΕΙΟΧ/],
 ['internal',/^ΠΑΘ/],['cardiology',/^ΚΑΡΔ/],
 ['hematology',/^ΑΙΜΟΔ/],['neurology',/^ΝΕΥΡΟΛ/],
 ['pediatrics',/^ΠΑΙΔ/],['surgery',/^ΧΕΙΡ/],
 ['orthopedic',/^ΟΡΘΟΠ/],['ent',/^ΩΡΛ/],['ophthalmology',/^ΟΦΘ/],
 ['urology',/^ΟΥΡ/],['gynecology',/^ΓΥΝ|^Μ\/Γ/],
 ['psychiatry',/^ΨΥΧ/],['dental',/^ΟΔΟΝ/],
 ['pulmonology',/^ΠΝΕΥΜΟΝ/]
];
const HOSPITAL=[
 ['Γ.Ν.Θ. Γεώργιος Παπανικολάου',/ΠΑΠΑΝΙΚΟΛΑΟΥ/],
 ['Γ.Ν.Θ. Άγιος Δημήτριος',/ΑΓΙΟΣ ΔΗΜΗΤΡΙΟΣ/],
 ['Π.Γ.Ν.Θ. ΑΧΕΠΑ',/ΑΧΕΠΑ/],
 ['Γ.Ν.Θ. Άγιος Παύλος',/ΑΓΙΟΣ ΠΑΥΛΟΣ/],
 ['Γ.Ν.Θ. Παπαγεωργίου',/ΠΑΠΑΓΕΩΡΓΙΟΥ/],
 ['Γ.Ν.Θ. Γεώργιος Γεννηματάς',/ΓΕΝΝΗΜΑΤΑΣ/],
 ['Ιπποκράτειο Θεσσαλονίκης',/ΙΠΠΟΚΡΑΤΕΙΟ/],
 ['Ψυχιατρικό Νοσοκομείο Θεσσαλονίκης',/ΨΝΘ|ΨΥΧΙΑΤΡΙΚΟ ΝΟΣΟΚΟΜΕΙΟ/]
];
function val(cell){
 if(!cell)return '';
 const v=cell.value;
 if(v instanceof Date)return String(v.getDate())+'/'+String(v.getMonth()+1)+'/'+v.getFullYear();
 if(v&&typeof v==='object')return String(v.result??v.text??cell.text??'');
 return String(v??cell.text??'');
}
export function parseThessWorkbook(workbook,{date,source}){
 const [y,m,d]=date.split('-').map(Number);
 const expected=d+'/'+m+'/'+y,found=[];
 for(const sheet of workbook.worksheets||[]){
  let dayColumn=-1,headerRow=-1;
  for(let rowNum=1;rowNum<=Math.min(12,sheet.rowCount);rowNum++){
   const row=sheet.getRow(rowNum);
   for(let col=3;col<=Math.min(80,row.cellCount||80);col++){
    const v=val(row.getCell(col));
    const mt=v.match(/(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*[\/.-]\s*(\d{4})/);
    if(mt&&(+mt[1])===d&&(+mt[2])===m&&(+mt[3])===y){dayColumn=col;headerRow=rowNum;break}
   }
   if(dayColumn>=0)break;
  }
  if(dayColumn<0)continue;
  let lastHospital='';
  for(let rowNum=headerRow+1;rowNum<=Math.min(sheet.rowCount,450);rowNum++){
   const row=sheet.getRow(rowNum),first=normalize(val(row.getCell(1))),abbr=normalize(val(row.getCell(2))),duty=normalize(val(row.getCell(dayColumn)));
   const name=HOSPITAL.find(([,re])=>re.test(first))?.[0];
   if(name)lastHospital=name;
   if(!lastHospital||!abbr||!duty)continue;
   const spec=SPEC.find(([,re])=>re.test(abbr))?.[0];
   if(!spec)continue;
   // The duty-day cell must repeat the clinic abbreviation, rather than contain
   // a general note / footnote / mark. Do not infer anything from empty cells.
   const same=duty===abbr||duty.startsWith(abbr)||abbr.startsWith(duty)&&duty.length>=3;
   if(!same)continue;
   found.push({name:lastHospital,specialty:spec,hours:'',date,area:'Θεσσαλονίκη',source,sourceType:'official-xlsx',verifiedLive:false,onDutySource:'published-roster',raw:duty});
  }
 }
 const seen=new Set(),out=found.filter(v=>{const k=v.name+v.specialty;if(seen.has(k))return false;seen.add(k);return true});
 if(out.length<2)throw Error('Could not safely parse the monthly 3rd District workbook');
 return out;
}
