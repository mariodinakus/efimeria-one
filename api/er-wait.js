/* Public, aggregate-only emergency department wait times.
 * Provider registry: add hospital adapters ONLY when a public source exists.
 * No patient records, authenticated hospital systems or guessed wait times. */
import { load } from 'cheerio';

const PAPA_SOURCE = 'https://www.gnpap-golive.gr/';
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ς/g, 'σ').toUpperCase().replace(/\s+/g, ' ').trim();
const supportsPapa = name => /ΠΑΠΑΓΕΩΡΓΙΟΥ|PAPAGEORGIOU|PAPAGEORGIOY/i.test(normalize(name));
const SPECIALTIES = [
  'ΑΓΓΕΙΟΧΕΙΡΟΥΡΓΙΚΟ', 'ΓΑΣΤΡΟΕΝΤΕΡΟΛΟΓΙΚΟ', 'ΓΥΝΑΙΚΟΛΟΓΙΚΟ',
  'ΚΑΡΔΙΟΛΟΓΙΚΟ', 'ΟΡΘΟΠΕΔΙΚΟ', 'ΝΕΥΡΟΛΟΓΙΚΟ', 'ΝΕΥΡΟΧΕΙΡΟΥΡΓΙΚΟ',
  'ΝΕΦΡΟΛΟΓΙΚΟ', 'ΟΓΚΟΛΟΓΙΚΟ', 'ΟΥΡΟΛΟΓΙΚΟ', 'ΟΦΘΑΛΜΟΛΟΓΙΚΟ',
  'ΠΑΘΟΛΟΓΙΚΟ', 'ΠΑΙΔΙΑΤΡΙΚΟ', 'ΠΑΙΔΟΡΘΟΠΕΔΙΚΟ', 'ΠΑΙΔΟΧΕΙΡΟΥΡΓΙΚΟ',
  'ΕΓΚΑΥΜΑΤΩΝ', 'ΠΝΕΥΜΟΝΟΛΟΓΙΚΟ', 'ΓΕΝΙΚΟ ΧΕΙΡΟΥΡΓΙΚΟ',
  'ΨΥΧΙΑΤΡΙΚΟ', 'ΩΡΛ'
];
const SOURCES = [{ id:'papageorgiou-golive', match:supportsPapa, url:PAPA_SOURCE }];

function athensClock(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone:'Europe/Athens', year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map(x=>[x.type,x.value]));
  return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);
}
function readNumber(text, label) {
  const match = text.match(new RegExp(label + '\\s*[:–-]?\\s*(\\d{1,7})(?!\\d)','i'));
  return match ? Number(match[1]) : null;
}
function parseOfficial(html) {
  const $ = load(html);
  $('script,style,nav,footer').remove();
  const body = $('body').text().replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  if (!body.includes('Χρόνοι Αναμονής') || !body.includes('Αναμονή Περιστατικών')) throw Error('Unexpected source document');
  const stamp = body.match(/τελευταία\s+ανανέωση\s*:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/i);
  if (!stamp) throw Error('Missing official update timestamp');
  const [dd,mm,yy,hh,mi,ss] = stamp.slice(1).map(Number);
  const sourceLocal = Date.UTC(yy,mm-1,dd,hh,mi,ss);
  const updatedLabel = `${String(dd).padStart(2,'0')}/${String(mm).padStart(2,'0')}/${yy} ${String(hh).padStart(2,'0')}:${String(mi).padStart(2,'0')}`;
  const minutesOld = (athensClock() - sourceLocal) / 60000;
  if (minutesOld > 20 || minutesOld < -10) return {status:'stale',sourceUpdatedAt:updatedLabel,sourceAgeMinutes:Math.round(minutesOld)};
  const totalCases = readNumber(body, 'Πλήθος\\s+Περιστατικών');
  const completed = readNumber(body, 'Ολοκληρωμένα\\s+Περιστατικά');
  const waitingDoctor = readNumber(body, 'Ασθενείς\\s+σε\\s+Αναμονή\\s+για\\s+Γιατρό');
  const waitingTriage = readNumber(body, 'Ασθενείς\\s+σε\\s+Αναμονή\\s+για\\s+Διαλογή');
  const leftWithoutExam = readNumber(body, 'Αποχωρήσεις\\s+Χωρίς\\s+Εξέταση');
  const wait = body.match(/Συνολικός\s+Μέσος\s+Χρόνος\s+Αναμονής\s*(\d{1,3})\s*ω\s*:\s*(\d{1,2})\s*λ/i);
  const avgMinutes = wait ? Number(wait[1])*60 + Number(wait[2]) : null;
  if ([totalCases,completed,waitingDoctor,waitingTriage,avgMinutes].some(x=>x===null)) throw Error('Cannot reliably parse the public counters');
  const rows = [];
  const seen = new Set();
  $('tr').each((_,node)=>{
    const cells = $(node).find('td').map((_,cell)=>$(cell).text().replace(/\s+/g,' ').trim()).get();
    const chosen = cells.find(c=>SPECIALTIES.includes(normalize(c)));
    if (!chosen) return;
    const key = normalize(chosen);
    const at = cells.indexOf(chosen);
    const numbers = cells.slice(at+1).map(x=>/^\d{1,6}$/.test(x)?Number(x):null).filter(x=>x!==null);
    if (numbers.length>=3 && !seen.has(key)){
      seen.add(key); rows.push({name:key,total:numbers[0],waiting:numbers[1],completed:numbers[2]});
    }
  });
  // Fallback for source revisions where table cells wrap specialty names.
  for (const specialty of SPECIALTIES) {
    if (seen.has(specialty)) continue;
    const match = body.match(new RegExp(specialty + '\\s+(\\d{1,6})\\s+(\\d{1,6})\\s+(\\d{1,6})(?!\\d)'));
    if(match) { seen.add(specialty);rows.push({name:specialty,total:+match[1],waiting:+match[2],completed:+match[3]}); }
  }
  if (!rows.length) throw Error('Cannot reliably parse the specialty queue');
  return {
    status:'live',sourceUpdatedAt:updatedLabel,sourceAgeMinutes:Math.max(0,Math.round(minutesOld)),
    metrics:{totalCases,completed,waitingDoctor,waitingTriage,leftWithoutExam,averageWaitMinutes:avgMinutes},
    specialties:rows
  };
}

let cached = null, expires = 0, inflight = null;
async function fetchPapa() {
  if (cached && Date.now()<expires) return cached;
  if (inflight) return inflight;
  inflight = (async()=>{
    try {
      const response = await fetch(PAPA_SOURCE,{signal:AbortSignal.timeout(8500),headers:{'Accept':'text/html'}});
      if(!response.ok) throw Error('HTTP '+response.status);
      if(!/text\/html/i.test(response.headers.get('content-type')||'text/html')) throw Error('Unexpected content type');
      const html = await response.text();
      if(html.length > 1_500_000) throw Error('Oversized public document');
      cached = {...parseOfficial(html),hospitalId:'papageorgiou-golive',hospital:'Παπαγεωργίου',source:PAPA_SOURCE,checkedAt:new Date().toISOString()};
      expires=Date.now()+90_000;
      return cached;
    } catch {
      cached={status:'unavailable',hospitalId:'papageorgiou-golive',hospital:'Παπαγεωργίου',
        source:PAPA_SOURCE,checkedAt:new Date().toISOString(),message:'Η δημόσια πηγή δεν ανταποκρίνεται ή άλλαξε μορφή.'};
      expires=Date.now()+35_000;
      return cached;
    }
  })();
  try { return await inflight; } finally { inflight=null; }
}
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','public, s-maxage=90, stale-while-revalidate=30');
  if(req.method && req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({error:'Method not allowed'}));}
  const name=String(req.query?.hospital||new URL(req.url,'http://localhost').searchParams.get('hospital')||'');
  if(!name||name.length>160){res.statusCode=400;return res.end(JSON.stringify({error:'Hospital name required'}));}
  const provider=SOURCES.find(p=>p.match(name));
  if(!provider) return res.end(JSON.stringify({status:'not_published',source:null,metrics:null,specialties:[],
    message:'Δεν έχει επαληθευτεί δημόσια ζωντανή πηγή αναμονής για αυτό το νοσοκομείο.'}));
  return res.end(JSON.stringify(await fetchPapa()));
}
