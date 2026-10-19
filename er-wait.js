/* Public ER queue widgets for CURRENT scheduled duty hospital cards only.
 * An absent provider is not represented as zero waiting patients. */
(()=>{
  'use strict';
  const root=()=>document.getElementById('hospitals');
  const papa=name=>/ΠΑΠΑΓΕΩΡΓΙΟΥ|PAPAGEORGIOU|PAPAGEORGIOY/i.test(
    String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase());
  const current=()=>document.getElementById('nowTab')?.classList.contains('active');
  const greek=()=>document.documentElement.lang!=='en';
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
  const row=(a,b)=>{const el=make('div','er-stat');el.append(make('span','',a),make('strong','',b));return el;};
  const pretty=(n)=>n===null||n===undefined?'—':new Intl.NumberFormat(greek()?'el-GR':'en-GB').format(n);
  const minutes=m=>m===null||m===undefined?'—':Math.floor(m/60)+(greek()?'ω ':'h ')+String(m%60).padStart(2,'0')+(greek()?'λ':'m');
  let last=null,lastAt=0,work=null;
  async function data(force=false){
    if(!force && last && Date.now()-lastAt<60_000) return last;
    if(work)return work;
    work=fetch('/api/er-wait?hospital='+encodeURIComponent('Παπαγεωργίου'),{cache:'no-store'})
      .then(async r=>{if(!r.ok)throw Error(String(r.status));return r.json()})
      .catch(()=>({status:'unavailable',source:'https://www.gnpap-golive.gr/'}));
    try{last=await work;lastAt=Date.now();return last;}finally{work=null;}
  }
  function link(label,url){const a=make('a','er-source',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
  function fill(el,d){
    el.replaceChildren();
    if(d.status!=='live'||!d.metrics) {
      el.append(make('div','er-note',d.status==='stale'?
        (greek()?'Τα στοιχεία έχουν παλιώσει. Δεν εμφανίζονται ως ζωντανά.':'The source data is stale; live figures are hidden.'):
        (greek()?'Δεν είναι διαθέσιμα επιβεβαιωμένα ζωντανά στοιχεία.':'Verified live figures are temporarily unavailable.')));
      if(d.sourceUpdatedAt)el.append(make('small','', (greek()?'Τελευταία ενημέρωση πηγής: ':'Source last updated: ')+d.sourceUpdatedAt));
    } else {
      const mark=make('div','er-live',greek()?'● LIVE · ΔΗΜΟΣΙΑ ΠΗΓΗ':'● LIVE · PUBLIC SOURCE');
      el.append(mark);
      const stats=make('div','er-stats');
      stats.append(
        row(greek()?'Περιμένουν γιατρό':'Waiting for doctor',pretty(d.metrics.waitingDoctor)),
        row(greek()?'Αναμονή διαλογής':'Waiting for triage',pretty(d.metrics.waitingTriage)),
        row(greek()?'Μέση αναμονή':'Average wait',minutes(d.metrics.averageWaitMinutes)),
        row(greek()?'Ολοκληρώθηκαν':'Completed',pretty(d.metrics.completed))
      );
      el.append(stats);
      const specialties=Array.isArray(d.specialties)?[...d.specialties].filter(x=>x.waiting>0).sort((a,b)=>b.waiting-a.waiting).slice(0,6):[];
      if(specialties.length){
        const title=make('div','er-smalltitle',greek()?'ΑΝΑΜΟΝΗ ΑΝΑ ΕΙΔΙΚΟΤΗΤΑ':'QUEUE BY SPECIALTY');
        el.append(title);
        const all=make('div','er-specialties');
        for(const s of specialties)all.append(row(s.name,pretty(s.waiting)));
        el.append(all);
      }
      el.append(make('small','er-timestamp',(greek()?'Ενημέρωση νοσοκομείου: ':'Hospital update: ')+d.sourceUpdatedAt+
       (greek()?' · ανά 5 λεπτά από την πηγή':' · source refresh every 5 min')));
    }
    el.append(link(greek()?'Επίσημη πηγή ↗':'Official source ↗','https://www.gnpap-golive.gr/'));
    el.append(make('small','er-caveat',greek()?
      'Η ουρά δεν προσδιορίζει τη σειρά εξέτασης ή την πιθανότητα εισαγωγής. Προηγείται η διαλογή βάσει βαρύτητας.':
      'Queue counts do not determine examination priority or admission. Clinical triage takes precedence.'));
  }
  async function refresh(el,force=false){
    el.replaceChildren(make('div','er-note',greek()?'Ανάκτηση δεδομένων νοσοκομείου…':'Loading hospital data…'));
    fill(el,await data(force));
  }
  function scan(){
    const target=root();if(!target)return;
    for(const card of target.querySelectorAll(':scope > .result')){
      if(card.dataset.erConnected==='1')continue;
      if(!current())continue;
      const name=card.querySelector('h3')?.textContent||'';
      const panel=make('div','er-panel');
      card.dataset.erConnected='1';
      const heading=make('div','er-heading');
      heading.append(make('strong','',greek()?'Αναμονή ΤΕΠ':'ER wait times'));
      panel.append(heading);
      if(!papa(name)){
        panel.classList.add('er-no-data');
        panel.append(make('p','er-note',greek()?'Δεν υπάρχει επιβεβαιωμένη δημόσια live πηγή για αυτό το νοσοκομείο.':'No verified public live feed for this hospital.'));
        card.append(panel);continue;
      }
      const refreshButton=make('button','er-refresh',greek()?'↻ Ανανέωση':'↻ Refresh');refreshButton.type='button';
      heading.append(refreshButton);
      const output=make('div','er-output');
      panel.append(output);card.append(panel);
      refreshButton.onclick=()=>refresh(output,true);
      refresh(output);
    }
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const target=root();if(!target)return;
    new MutationObserver(scan).observe(target,{childList:true});
    scan();
    setInterval(()=>{
      if(document.hidden||!current())return;
      const nodes=target.querySelectorAll('.er-output');
      for(const n of nodes)refresh(n,true);
    },5*60*1000);
    document.getElementById('language')?.addEventListener('click',()=>{
      // v5.js redraws hospital results, triggering scan; no independent translation cache.
    });
  });
})();
