/* EFIMERIA ONE v5.1 – list-only duty screen, Greece / bilingual.
 * Schedules are not proof of real-time operational availability. */
'use strict';
const $=id=>document.getElementById(id);
const PLACES=[
 ['Μενεμένη','Menemeni',40.6574,22.9073],['Θεσσαλονίκη','Thessaloniki',40.6401,22.9444],['Εύοσμος','Evosmos',40.6707,22.906],
 ['Ελευθέριο Κορδελιό','Eleftherio Kordelio',40.668,22.891],['Αμπελόκηποι Θεσσαλονίκης','Ampelokipoi Thessaloniki',40.652,22.923],
 ['Καλαμαριά','Kalamaria',40.585,22.951],['Αθήνα','Athens',37.9838,23.7275],['Πειραιάς','Piraeus',37.943,23.647],
 ['Πάτρα','Patras',38.2466,21.7346],['Λάρισα','Larissa',39.639,22.4191],['Καβάλα','Kavala',40.9369,24.4129],
 ['Ηράκλειο','Heraklion',35.3387,25.1442],['Ιωάννινα','Ioannina',39.6649,20.8519],['Χανιά','Chania',35.5138,24.018],
 ['Σέρρες','Serres',41.0856,23.5497],['Βόλος','Volos',39.361,22.9425]
];
const SPEC=[
 ['all','Όλες οι ειδικότητες','All specialties'],['Παθολογ','Παθολογική','Internal medicine'],['Καρδιολογ','Καρδιολογική','Cardiology'],
 ['Παιδιατρ','Παιδιατρική','Pediatrics'],['Χειρουργ','Χειρουργική','Surgery'],['Ορθοπ','Ορθοπεδική','Orthopedics'],
 ['Γυναικολογ','Γυναικολογική','Gynecology'],['Μαιευτ','Μαιευτική','Obstetrics'],['Νευρολογ','Νευρολογική','Neurology'],
 ['Ψυχιατρ','Ψυχιατρική','Psychiatry'],['ΩΡΛ','ΩΡΛ','ENT'],['Οφθαλμολογ','Οφθαλμολογική','Ophthalmology'],
 ['Πνευμονολογ','Πνευμονολογική','Pulmonology'],['Ουρολογ','Ουρολογική','Urology']
];
const TEXT={
 el:{
 kicker:'ΕΦΗΜΕΡΙΕΣ · ΕΛΛΑΔΑ',heading:'Ποιος <em>εφημερεύει</em> κοντά σου;',
 summary:'Νοσοκομεία ανά ειδικότητα και φαρμακεία με ώρες, τηλέφωνα και Google Maps. Χωρίς ενσωματωμένους χάρτες.',
 emergency:'Σοβαρό επείγον; Κάλεσε <a href="tel:112">112</a> ή <a href="tel:166">166</a>. Οι δημοσιευμένες εφημερίες δεν εγγυώνται διαθεσιμότητα σε πραγματικό χρόνο.',
 locationLabel:'ΠΕΡΙΟΧΗ ΑΝΑΖΗΤΗΣΗΣ',confirm:'Ναι, Μενεμένη',change:'Άλλη περιοχή',cityLabel:'Πόλη / γειτονιά',search:'Αναζήτηση',
 now:'Σε ισχύ τώρα',chooseDate:'Άλλη ημερομηνία',dutyDate:'Ημερομηνία',hospitalTitle:'Εφημερεύοντα νοσοκομεία',pharmacyTitle:'Εφημερεύοντα φαρμακεία',
 pharmacySubtitle:'Στην περιοχή σου και γειτονικές περιοχές',specialty:'Ειδικότητα',sources:'ΠΗΓΕΣ & ΑΞΙΟΠΙΣΤΙΑ',
 sourceHeading:'Δημοσιευμένα προγράμματα, όχι εικασίες',
 sourceText:'Παρουσιάζονται δημοσιευμένα προγράμματα νοσοκομείων και κατάλογοι φαρμακείων τρίτων. Η εφημερία βάσει προγράμματος δεν εγγυάται ότι μια μονάδα είναι ανοιχτή ή διαθέσιμη τώρα. Επιβεβαίωσε τηλεφωνικά πριν ξεκινήσεις.',
 footer:'Δεν υποκαθιστά ιατρική βοήθεια ή το ΕΚΑΒ. Για επείγον κάλεσε 112 ή 166.',
 areaQuestion:'Είσαι στην περιοχή {area};',selectedArea:'Επιλεγμένη περιοχή',defaultArea:'Προεπιλογή · πάτησε επιβεβαίωση ή άλλαξε περιοχή',
 detectedArea:'Περιοχή μέσω GPS (κατά προσέγγιση)',dateNow:'Σε ισχύ σύμφωνα με πρόγραμμα',dateOther:'Δημοσιευμένο πρόγραμμα της ημέρας',
 next:'Επόμενη εφημερία',nextStart:'Από τις 08:00',loadingHospital:'Διαβάζω τα δημοσιευμένα προγράμματα νοσοκομείων…',loadingPharmacy:'Αναζητώ δημοσιευμένες εφημερίες φαρμακείων…',
 published:'Δημοσιευμένες καταχωρίσεις • Επιβεβαίωσε τηλεφωνικά πριν ξεκινήσεις.',
 cached:'Προσωρινή προβολή χρονολογημένου προγράμματος, όχι επιβεβαίωση live. Επιβεβαίωσε πριν πας.',
 thirdParty:'Εξωτερικός κατάλογος εφημεριών • Δεν αποτελεί επίσημη επιβεβαίωση λειτουργίας.',
 missing:'Δεν υπάρχουν αξιόπιστα αναγνώσιμα αποτελέσματα για αυτή την περιοχή/ημέρα. Δεν εμφανίζω τυχαίες δομές ως εφημερεύουσες.',
 pharmacyMissing:'Δεν βρέθηκε ενημερωμένη καταχώριση φαρμακείου για την επιλεγμένη ημέρα. Δες τον Φαρμακευτικό Σύλλογο και τηλεφώνησε πριν πας.',
 maps:'Google Maps',call:'Κλήση',scheduled:'Εφημερία βάσει προγράμματος',upcoming:'Αρχίζει σε επόμενη βάρδια',specialties:'Ειδικότητες',
 moreSpecialties:'Περισσότερες ειδικότητες',lessSpecialties:'Λιγότερες',source:'Δημοσιευμένη πηγή',nearby:'Κοντινή περιοχή',gpsWait:'Αναζήτηση θέσης…',
 gpsFail:'Ο εντοπισμός δεν λειτουργεί. Πληκτρολόγησε περιοχή χειροκίνητα.',gpsDenied:'Η πρόσβαση στο GPS δεν επιτράπηκε. Πληκτρολόγησε περιοχή.',
 geoHttp:'Το GPS απαιτεί HTTPS.',geoOutside:'Δεν εντοπίστηκε θέση στην Ελλάδα. Επίλεξε περιοχή.',
 searching:'Αναζήτηση περιοχής…',searchFailed:'Δεν βρέθηκε αυτή η περιοχή. Δοκίμασε μεγαλύτερο δήμο ή πόλη.',
 areaSaved:'Η περιοχή επιλέχθηκε.',unsupported:'Αυτή η περιοχή δεν διαθέτει ακόμη αυτόματη δημοσίευση στη συγκεκριμένη κατηγορία.',
 fmtNext:'Επόμενη βάρδια · {date}',dateFrom:'Εφημερία {date} · 08:00 έως 08:00 επομένης',
 warningNoLive:'Ώρες προγράμματος — όχι πιστοποίηση «ανοιχτό τώρα».',
 openSource:'Δες πηγή',gpsAccuracy:'Ακρίβεια περίπου ±{m} μ.'
 },
 en:{
 kicker:'DUTY ROSTERS · GREECE',heading:'Who is <em>on duty</em> near you?',
 summary:'Hospitals by medical specialty and duty pharmacies, with hours, phone numbers and Google Maps. No embedded map.',
 emergency:'Serious emergency? Call <a href="tel:112">112</a> or <a href="tel:166">166</a>. Published rosters do not guarantee real-time availability.',
 locationLabel:'SEARCH AREA',confirm:'Yes, Menemeni',change:'Change area',cityLabel:'City / neighborhood',search:'Search',
 now:'On duty now (scheduled)',chooseDate:'Other date',dutyDate:'Date',hospitalTitle:'Hospitals on duty',pharmacyTitle:'Duty pharmacies',
 pharmacySubtitle:'In and around your neighborhood',specialty:'Medical specialty',sources:'SOURCES & RELIABILITY',
 sourceHeading:'Published schedules, not guesses',
 sourceText:'Hospital duty rosters and third-party pharmacy listings are shown. Published duty hours do not prove a facility is currently open or able to assist you. Call before travelling.',
 footer:'Not a substitute for emergency services or medical advice. In an emergency call 112 or 166.',
 areaQuestion:'Are you in {area}?',selectedArea:'Selected area',defaultArea:'Default area — confirm or change',detectedArea:'Approximate GPS area',
 dateNow:'Current scheduled duty shift',dateOther:'Published duty roster for date',
 next:'Next duty shift',nextStart:'From 08:00',loadingHospital:'Reading published hospital schedules…',loadingPharmacy:'Finding dated pharmacy duty listings…',
 published:'Published duty records • Call before travelling.',
 cached:'Dated published roster snapshot, not live confirmation. Please call before travelling.',
 thirdParty:'Third-party duty listings • Not official real-time opening confirmation.',
 missing:'No reliably readable records for this area/date. We never show random hospitals as on duty.',
 pharmacyMissing:'No updated pharmacy record for the selected day. Check the pharmacists’ association and call before travelling.',
 maps:'Google Maps',call:'Call',scheduled:'Scheduled duty',upcoming:'Upcoming shift',specialties:'Specialties',
 moreSpecialties:'Show more specialties',lessSpecialties:'Show less',source:'Published source',nearby:'Nearby area',gpsWait:'Locating…',
 gpsFail:'Location unavailable. Enter the area manually.',gpsDenied:'Location denied. Enter the area manually.',
 geoHttp:'GPS requires HTTPS.',geoOutside:'No location found in Greece. Choose a city.',
 searching:'Searching area…',searchFailed:'Area not found. Try a nearby town or municipality.',
 areaSaved:'Area selected.',unsupported:'No connected automatic source for this region/category yet.',
 fmtNext:'Next shift · {date}',dateFrom:'Roster {date} · 08:00 to 08:00 next day',
 warningNoLive:'Schedule hours — NOT a live operational confirmation.',
 openSource:'View source',gpsAccuracy:'Accuracy approximately ±{m} m'
 }};
const SEED={
 '2026-10-16':[
 ['ΑΧΕΠΑ','Κυριακίδη Στίλπωνος 1, Θεσσαλονίκη','2313303111','Θωρακοχειρουργική, Καρδιοχειρουργική'],
 ['Ιπποκράτειο Θεσσαλονίκης','Κωνσταντινουπόλεως 49, Θεσσαλονίκη','2313312000','Παθολογική, Παιδιατρική, Καρδιολογική, Νευρολογική, Χειρουργική, ΩΡΛ'],
 ['Άγιος Παύλος','Εθνικής Αντιστάσεως 161, Καλαμαριά','2313304400','Παθολογική, Χειρουργική, Καρδιολογική'],
 ['Ψυχιατρικό Νοσοκομείο Θεσσαλονίκης','Λαγκαδά 196, Σταυρούπολη','2313324100','Ψυχιατρική']
 ],
 '2026-10-17':[
 ['Γεώργιος Γεννηματάς Θεσσαλονίκης','Εθνικής Αμύνης 41, Θεσσαλονίκη','2313308100','Παιδιατρική, Παιδοορθοπαιδική, Παιδοχειρουργική'],
 ['Ιπποκράτειο Θεσσαλονίκης','Κωνσταντινουπόλεως 49, Θεσσαλονίκη','2313312000','Γυναικολογική, Μαιευτική, Νεογνολογική'],
 ['Γεώργιος Παπανικολάου','Εξοχή, Θεσσαλονίκη','2313307000','Αγγειοχειρουργική, Αιμοδυναμική, Γναθοχειρουργική, Θωρακοχειρουργική, Καρδιολογική, Καρδιοχειρουργική, Νευρολογική, Νευροχειρουργική, Ορθοπαιδική, Παθολογική, Παιδοψυχιατρική, Πλαστική Χειρουργική, Πνευμονολογική, Χειρουργική, ΩΡΛ'],
 ['Ψυχιατρικό Νοσοκομείο Θεσσαλονίκης','Λαγκαδά 196, Σταυρούπολη','2313324100','Ψυχιατρική'],
 ['Άγιος Δημήτριος','Ελένης Ζωγράφου 2, Θεσσαλονίκη','2313322100','Γυναικολογική, Οδοντιατρική, Ουρολογική, Οφθαλμολογική, Παθολογική, Χειρουργική']
 ]};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ς/g,'σ').toLowerCase().trim();
const distance=(a,b,c,d)=>{const rad=Math.PI/180,z=Math.sin((c-a)*rad/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin((d-b)*rad/2)**2;return 6371*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))};
let lang='el';try{lang=localStorage.getItem('efimeria-lang')==='en'?'en':'el'}catch{}
const locKey='efimeria-area-v5';
let selected={el:'Μενεμένη',en:'Menemeni',lat:40.6574,lon:22.9073},confirmed=false;
try{const old=JSON.parse(localStorage.getItem(locKey)||'null');if(old&&typeof old.el==='string'&&typeof old.en==='string'){selected=old;confirmed=true}}catch{}
let chooseManual=false,customDate=false,requestId=0,hospResult=null,pharmResult=null,nextResult=null,specialty='all';
const t=k=>TEXT[lang][k]||k;
const phrase=(key,params={})=>Object.entries(params).reduce((s,[k,v])=>s.replace('{'+k+'}',v),t(key));
const safeNode=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const label=()=>selected[lang]||selected.el||selected.en;
function parts(){return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Athens',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23',minute:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]))}
function isoToday(){const p=parts();return p.year+'-'+p.month+'-'+p.day}
function shiftDate(){const p=parts(),today=isoToday();return Number(p.hour)<8?plusDays(today,-1):today}
function plusDays(date,n){return new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10)}
function selectedDate(){return customDate?$('date').value:shiftDate()}
function formatDate(date){const d=new Date(date+'T12:00:00Z');return new Intl.DateTimeFormat(lang==='el'?'el-GR':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d)}
function dateText(date){return phrase('dateFrom',{date:formatDate(date)})}
function mapsURL(item){return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent([item.name,item.address,'Greece'].filter(Boolean).join(', '))}
function sourcesLink(type){return type==='hospital'?'https://www.3ype.gr/category/efimeries/':'https://efimeries.fsth.gr/'}
function isThessArea(){return selected.lat?distance(selected.lat,selected.lon,40.6401,22.9444)<55:/ΘΕΣΣ|ΜΕΝΕΜ|EVOSM|THESS/i.test(label())}
function seed(date){if(!isThessArea()||!SEED[date])return null;return {date,status:'published_snapshot',entries:SEED[date].map(s=>({name:s[0],address:s[1],phone:s[2],specialties:s[3].split(', '),hours:'08:00–08:00 επομένης',date,source:'https://www.thessalonikiguide.gr/efimerevonta-nosokomeia/',sourceKind:'dated-source-snapshot'})),source:'https://www.thessalonikiguide.gr/efimerevonta-nosokomeia/'}}
function save(){try{localStorage.setItem(locKey,JSON.stringify(selected))}catch{}}
function msg(txt){$('message').textContent=txt||''}
function fillLocale(){document.documentElement.lang=lang;$('language').textContent=lang==='el'?'EN':'ΕΛ';
 document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
 document.querySelectorAll('[data-html]').forEach(el=>el.innerHTML=t(el.dataset.html));
 $('areaQuestion').textContent=phrase('areaQuestion',{area:label()});
 $('areaNote').textContent=t(confirmed?'selectedArea':'defaultArea');
 $('confirmArea').querySelector('[data-t]').textContent=lang==='el'?'Ναι, '+label():'Yes, '+label();
 $('city').placeholder=lang==='el'?'Πόλη ή συνοικία, π.χ. Μενεμένη':'City or area, e.g. Menemeni';
 const sp=$('specialty');sp.replaceChildren();for(const [key,gr,en] of SPEC){const o=safeNode('option','',lang==='el'?gr:en);o.value=key;sp.append(o)}sp.value=specialty;
 $('cities').replaceChildren();for(const [gr,en] of PLACES){const o=safeNode('option');o.value=lang==='el'?gr:en;$('cities').append(o)}
 $('pickerWrap').hidden=!customDate;$('nowTab').classList.toggle('active',!customDate);$('dayTab').classList.toggle('active',customDate);
 $('hospitalSubtitle').textContent=(customDate?t('dateOther'):t('dateNow'))+' · '+formatDate(selectedDate())+' · '+label();
 }
function notice(el,msg,state='info'){el.textContent=msg;el.dataset.state=state}
function action(text,url,primary=false){const a=safeNode('a','action'+(primary?' main':''),text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a}
function hospitalFilter(entries){if(specialty==='all')return entries;return entries.filter(e=>(e.specialties||[]).some(s=>norm(s).includes(norm(specialty))))}
function card(item,type,upcoming=false){
 const c=safeNode('article','result'+(!upcoming&&/ΠΑΠΑΝΙΚΟΛ|PAPANIKO/i.test(norm(item.name))?' featured':''));
 c.append(safeNode('span','label',upcoming?t('upcoming'):t('scheduled')));
 c.append(safeNode('h3','',item.name),safeNode('p','addr','⌖ '+(item.address||label())));
 c.append(safeNode('div','hours','◷ '+(item.hours||dateText(item.date))));
 if(type==='hospital'&&Array.isArray(item.specialties)&&item.specialties.length){
  const block=safeNode('div','tags'),tokens=item.specialties.map(s=>safeNode('span','tag',s));
  const big=item.specialties.length>8;
  tokens.forEach((el,i)=>{if(i>=8)el.hidden=true;block.append(el)});
  c.append(block);
  if(big){const btn=safeNode('button','expand',t('moreSpecialties')+' ('+(tokens.length-8)+')');btn.type='button';let open=false;btn.onclick=()=>{open=!open;tokens.forEach((el,i)=>{if(i>=8)el.hidden=!open});btn.textContent=t(open?'lessSpecialties':'moreSpecialties')+(open?'':' ('+(tokens.length-8)+')')};c.append(btn)}
 }
 const row=safeNode('div','actions');row.append(action('↗ '+t('maps'),mapsURL(item),true));
 if(item.phone&&/^[+\d()\s.-]{7,25}$/.test(item.phone)){const a=safeNode('a','action','☎ '+t('call'));a.href='tel:'+item.phone.replace(/[^+\d]/g,'');row.append(a)}
 c.append(row);
 c.append(safeNode('small','',t('warningNoLive')));
 return c;
}
function renderHospital(){
 const root=$('hospitals');root.replaceChildren();
 const result=hospResult;let entries=hospitalFilter(result?.entries||[]);
 const filtered=entries.filter(e=>{
   if(!customDate&&e.name.includes('Αφροδισίων')&&Number(parts().hour)>=20)return false;
   return true;
 });
 const hasDated=!!result&&['published_snapshot'].includes(result.status);
 if(filtered.length){
  notice($('hospitalMeta'),(hasDated?t('cached'):t('published'))+' · '+filtered.length+' · '+dateText(selectedDate()),hasDated?'warning':'info');
  for(const e of filtered)root.append(card(e,'hospital'));
 }else{
  notice($('hospitalMeta'),t('missing'),'warning');
  const empty=safeNode('div','empty',t('missing'));empty.append(document.createTextNode(' '),action(t('openSource')+' ↗',sourcesLink('hospital')));root.append(empty);
 }
 const wrap=$('nextWrap'),place=$('nextResults');place.replaceChildren();
 if(customDate||!nextResult?.entries?.length){wrap.hidden=true;return}
 const more=hospitalFilter(nextResult.entries).slice(0,8);if(!more.length){wrap.hidden=true;return}
 wrap.hidden=false;$('nextTitle').textContent=t('next');$('nextTime').textContent=phrase('fmtNext',{date:formatDate(nextResult.date)})+' · '+t('nextStart');
 for(const item of more)place.append(card(item,'hospital',true));
}
function renderPharmacy(){
 const root=$('pharmacies');root.replaceChildren();
 let entries=pharmResult?.entries||[];
 // A listing labelled as running until midnight cannot be represented as overnight service after midnight.
 if(!customDate&&selectedDate()!==isoToday()){
   entries=entries.filter(e=>{const m=String(e.hours||'').match(/(\d\d?):(\d\d)\s*[–-]\s*(\d\d?):(\d\d)/);return m&&Number(m[3])>=8});
 }
 if(entries.length){
  notice($('pharmacyMeta'),t('thirdParty')+' · '+entries.length);
  for(const e of entries.slice(0,30))root.append(card(e,'pharmacy'));
 }else{
  notice($('pharmacyMeta'),t('pharmacyMissing'),'warning');
  const e=safeNode('div','empty',t('pharmacyMissing'));e.append(document.createTextNode(' '),action(t('openSource')+' ↗',sourcesLink('pharmacy')));root.append(e);
 }
}
async function request(type,date,area,id){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),19000);try{
 const r=await fetch('/api/live-duty?'+new URLSearchParams({type,date,area}),{cache:'no-store',signal:controller.signal});
 if(!r.ok)throw Error('Failed '+r.status);
 const j=await r.json();if(j.date!==date||id!==requestId)throw Error('Outdated response');return j
 }finally{clearTimeout(timer)}}
async function update(){
 const id=++requestId,date=selectedDate(),area=label();
 $('nextWrap').hidden=true;
 hospResult=null;pharmResult=null;nextResult=null;
 $('hospitals').replaceChildren();$('pharmacies').replaceChildren();
 notice($('hospitalMeta'),t('loadingHospital'));notice($('pharmacyMeta'),t('loadingPharmacy'));
 $('hospitalSubtitle').textContent=(customDate?t('dateOther'):t('dateNow'))+' · '+formatDate(date)+' · '+label();
 const main=request('hospital',date,area,id).then(d=>{if(id!==requestId)return;hospResult=d;renderHospital()}).catch(()=>{if(id!==requestId)return;hospResult=seed(date);renderHospital()});
 const pharm=request('pharmacy',date,area,id).then(d=>{if(id!==requestId)return;pharmResult=d;renderPharmacy()}).catch(()=>{if(id!==requestId)return;pharmResult=null;renderPharmacy()});
 const preview=!customDate?request('hospital',plusDays(date,1),area,id).then(d=>{if(id!==requestId)return;nextResult=d;renderHospital()}).catch(()=>{if(id!==requestId)return;nextResult=seed(plusDays(date,1));renderHospital()}):Promise.resolve();
 await Promise.allSettled([main,pharm,preview])
}
function commitArea(p){selected=p;confirmed=true;save();$('areaForm').hidden=true;fillLocale();msg(t('areaSaved'));update()}
async function citySearch(e){
 e.preventDefault();const q=$('city').value.trim();if(q.length<2)return;
 const find=PLACES.find(([gr,en])=>norm(gr)===norm(q)||norm(en)===norm(q));
 if(find){commitArea({el:find[0],en:find[1],lat:find[2],lon:find[3]});return}
 msg(t('searching'));try{
 const r=await fetch('/api/places?'+new URLSearchParams({q,lang}),{cache:'no-store'});
 if(!r.ok)throw Error();const j=await r.json();const first=j.places?.[0];
 if(!first||!Number.isFinite(first.lat)||!Number.isFinite(first.lon))throw Error();
 commitArea({el:first.label,en:first.label,lat:first.lat,lon:first.lon});
 }catch{msg(t('searchFailed'))}
}
function gps(){
 if(!isSecureContext){msg(t('geoHttp'));return}if(!navigator.geolocation){msg(t('gpsFail'));return}
 $('gps').disabled=true;msg(t('gpsWait'));
 navigator.geolocation.getCurrentPosition(async position=>{
  const lat=position.coords.latitude,lon=position.coords.longitude;$('gps').disabled=false;
  if(lat<34||lat>42.5||lon<19||lon>30){msg(t('geoOutside'));return}
  const nearby=PLACES.map(c=>({c,d:distance(lat,lon,c[2],c[3])})).sort((a,b)=>a.d-b.d)[0];
  let el=nearby.d<12?nearby.c[0]:'',en=nearby.d<12?nearby.c[1]:'';
  if(!el){try{const r=await fetch('/api/reverse?'+new URLSearchParams({lat,lon}));if(r.ok){const data=await r.json();el=data.label;en=data.label}}catch{}}
  if(!el){msg(t('geoOutside'));return}
  commitArea({el,en,lat,lon});msg(t('detectedArea')+' · '+phrase('gpsAccuracy',{m:Math.round(position.coords.accuracy)}));
 },e=>{$('gps').disabled=false;msg(t(e.code===1?'gpsDenied':'gpsFail'))},{enableHighAccuracy:true,timeout:14000,maximumAge:45000})
}
function init(){
 if('serviceWorker' in navigator)navigator.serviceWorker.getRegistrations().then(list=>Promise.all(list.map(x=>x.unregister()))).catch(()=>{});
 $('date').value=isoToday();
 $('language').onclick=()=>{lang=lang==='el'?'en':'el';try{localStorage.setItem('efimeria-lang',lang)}catch{}fillLocale();renderHospital();renderPharmacy()};
 $('confirmArea').onclick=()=>{confirmed=true;save();fillLocale();msg(t('areaSaved'))};
 $('toggleArea').onclick=()=>{$('areaForm').hidden=!$('areaForm').hidden;if(!$('areaForm').hidden)$('city').focus()};
 $('areaForm').onsubmit=citySearch;$('gps').onclick=gps;
 $('nowTab').onclick=()=>{customDate=false;fillLocale();update()};
 $('dayTab').onclick=()=>{customDate=true;fillLocale();update()};
 $('date').onchange=()=>{if(customDate)update()};
 $('specialty').onchange=()=>{specialty=$('specialty').value;renderHospital()};
 fillLocale();update()
}
document.addEventListener('DOMContentLoaded',init);
