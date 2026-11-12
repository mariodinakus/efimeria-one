/* EFIMERIA ONE — map and duty activity, v1. Source-backed; not a crowd forecast. */
(() => {
  'use strict';
  const root=document.getElementById('geoRadar');
  if(!root)return;
  const byId=id=>document.getElementById(id);
  const W={
    el:{
      title:'Χάρτης & κινητικότητα εφημεριών',subtitle:'Πού βρίσκονται οι υπηρεσίες σε σχέση με εσένα και πώς αλλάζει το δημοσιευμένο ωράριο.',
      all:'Όλα',hosp:'Νοσοκομεία',pharm:'Φαρμακεία',gps:'GPS · Η θέση μου',area:'Κέντρο επιλεγμένης περιοχής',
      active:'Σε εφημερία βάσει ωραρίου',later:'Αρχίζουν αργότερα',mapped:'Σημεία στον χάρτη',
      next:'Οι κοντινότερες επιλογές',now:'Σε ισχύ βάσει ωραρίου',soon:'Αργότερα',ended:'Εκτός δηλωμένου ωραρίου',
      unknown:'Ωράριο μη ελέγξιμο',unknownCoords:'Δεν υπάρχουν επαληθευμένες συντεταγμένες',
      straight:'Απόσταση σε ευθεία',route:'Οδηγίες',call:'Κλήση',mapFail:'Ο χάρτης δεν φορτώθηκε. Οι επιλογές και οι οδηγίες παραμένουν διαθέσιμες.',
      missing:'Δεν υπάρχουν ακόμη χαρτογραφήσιμες καταχωρίσεις για αυτή την περιοχή.',chart:'Ρυθμός εφημεριών ανά δίωρο',
      chartNote:'Πλήθος υπηρεσιών βάσει δημοσιευμένων ωρών (όχι εκτίμηση αναμονής ή πληρότητας).',
      dateNote:'Η επιλεγμένη ημερομηνία είναι πρόγραμμα, όχι ζωντανή κατάσταση.',ref:'Προέλευση: δημοσιευμένες εφημερίες',
      live:'Δημόσια ζωντανή αναμονή ΤΕΠ',liveNo:'Δεν υπάρχουν διαθέσιμα επαληθευμένα live δεδομένα αναμονής αυτή τη στιγμή.',
      liveWait:'Περιμένουν γιατρό',liveTriage:'Περιμένουν διαλογή',liveAverage:'Μέση αναμονή',liveUpdate:'Ενημέρωση πηγής',
      history:'Μεταβολή από προηγούμενη καταγραφή',historyNote:'Ιστορικό μόνο των πραγματικών μετρήσεων που κατέγραψε αυτός ο browser.',
      minutes:'λεπτά',noGps:'Η ένδειξη απόστασης υπολογίζεται από την επιλεγμένη περιοχή, όχι από το GPS σου.',
      noCapacity:'Η συχνότητα εφημεριών δεν δείχνει κίνηση ασθενών. Η διαλογή προηγείται της σειράς άφιξης.'
    },
    en:{
      title:'Duty map & activity',subtitle:'See facilities relative to your location and how published duty hours change.',
      all:'All',hosp:'Hospitals',pharm:'Pharmacies',gps:'GPS · My location',area:'Selected area centre',
      active:'Scheduled as on duty',later:'Starting later',mapped:'Mapped locations',
      next:'Closest facilities',now:'On duty by schedule',soon:'Later',ended:'Outside published hours',
      unknown:'Hours not verifiable',unknownCoords:'Verified coordinates unavailable',
      straight:'Straight-line distance',route:'Directions',call:'Call',mapFail:'Map unavailable. Listings and directions are still accessible.',
      missing:'No mapped entries are available for this area yet.',chart:'Duty coverage by 2-hour interval',
      chartNote:'Published duty coverage only (not patient traffic or queue predictions).',
      dateNote:'Chosen date shows a schedule, not a live service status.',ref:'Source: published duty schedules',
      live:'Verified public ED queue',liveNo:'Verified live wait-time data are currently unavailable.',
      liveWait:'Waiting for doctor',liveTriage:'Waiting for triage',liveAverage:'Average wait',liveUpdate:'Source updated',
      history:'Change since previous observation',historyNote:'History consists only of real observations collected in this browser.',
      minutes:'minutes',noGps:'Distances use the selected area centre, not your exact GPS position.',
      noCapacity:'Duty coverage is not patient traffic. Medical triage determines priority.'
    }
  };
  const tr=k=>W[document.documentElement.lang==='en'?'en':'el'][k];
  const isEnglish=()=>document.documentElement.lang==='en';
  const valid=p=>p && Number.isFinite(+p.lat) && Number.isFinite(+p.lon) &&
    +p.lat>=34 && +p.lat<=42.6 && +p.lon>=19 && +p.lon<=30;
  const coord=p=>[+p.lat,+p.lon];
  const mk=(tag,cls,value)=>{
    const e=document.createElement(tag);
    if(cls)e.className=cls;
    if(value!==undefined)e.textContent=String(value);
    return e;
  };
  const urls=p=>'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(valid(p)?p.lat+','+p.lon:[p.name,p.address,'Greece'].filter(Boolean).join(', '));
  const todayClock=()=>{
    const p=parts();
    return {date:p.year+'-'+p.month+'-'+p.day,minutes:Number(p.hour)*60+Number(p.minute)};
  };
  const dayOffset=(day,base)=>Math.round((Date.parse(day+'T00:00:00Z')-Date.parse(base+'T00:00:00Z'))/86400000);
  function intervals(item){
    let h=String(item.hours||'').toUpperCase()
      .replace(/ΜΕΣΑΝΥΧΤΑ/g,'00:00')
      .replace(/[–—−]/g,'-')
      .replace(/ΕΩΣ/g,'-');
    const ranges=[];
    const rx=/(\d{1,2}):(\d{2})\s*(?:-|TO)\s*(\d{1,2}):(\d{2})/g;
    for(const m of h.matchAll(rx)){
      const a=+m[1]*60 + +m[2],b=+m[3]*60 + +m[4];
      if(a>=1440||b>1440||+m[2]>=60||+m[4]>=60)continue;
      ranges.push([a,b<=a?b+1440:b]);
    }
    return ranges;
  }
  const runningAt=(item,minute)=>intervals(item).some(([a,b])=>minute>=a&&minute<b);
  function phase(item,base){
    if(typeof customDate!=='undefined'&&customDate)return 'unknown';
    const clock=todayClock();
    const m=dayOffset(clock.date,base)*1440+clock.minutes;
    const slots=intervals(item);
    if(!slots.length)return 'unknown';
    if(slots.some(([a,b])=>m>=a&&m<b))return 'now';
    if(slots.some(([a])=>m<a))return 'later';
    return 'ended';
  }
  let filter='all',map=null,markersLayer=null,selfMarker=null,markerMap=new Map(),cameraKey='',lastLocation='';
  let liveData=null,lastLiveAt=0,working=false;
  const historyKey='efimeria-public-queue-history-v1';
  let history=[];
  try{
    const v=JSON.parse(localStorage.getItem(historyKey)||'[]');
    if(Array.isArray(v))history=v.filter(x=>Number.isFinite(x.t)&&Number.isFinite(x.v)&&Date.now()-x.t<86400000).slice(-180);
  }catch{}
  function collect(){
    const hospital=(typeof hospResult!=='undefined' && Array.isArray(hospResult?.entries)?hospResult.entries:[]);
    const pharmacy=(typeof pharmResult!=='undefined' && Array.isArray(pharmResult?.entries)?pharmResult.entries:[]);
    const items=[];
    const activeHospital=typeof hospitalFilter==='function'?hospitalFilter(hospital):hospital;
    for(const p of activeHospital)items.push({...p,type:'hospital'});
    for(const p of pharmacy)items.push({...p,type:'pharmacy'});
    return items;
  }
  function getItems(){
    const items=collect();
    return filter==='all'?items:items.filter(p=>p.type===filter);
  }
  function getDistance(p){
    if(!valid(p)||!valid(selected))return null;
    return distance(+selected.lat,+selected.lon,+p.lat,+p.lon);
  }
  const prettyDist=p=>{
    const d=getDistance(p);
    if(d===null)return '—';
    return d<1?Math.round(d*1000)+' m':new Intl.NumberFormat(isEnglish()?'en-GB':'el-GR',{maximumFractionDigits:1}).format(d)+' km';
  };
  function updateHeader(){
    byId('radarTitle').textContent=tr('title');
    byId('radarSubtitle').textContent=tr('subtitle');
    for(const k of ['all','hosp','pharm'])byId('radarFilter-'+k).textContent=tr(k);
    byId('radarGps').textContent=tr('gps');
    byId('radarOrigin').textContent=(selected.isGps?tr('gps'):tr('area'))+' · '+(selected[isEnglish()?'en':'el']||selected.el);
    byId('radarDisclaimer').textContent=tr('noCapacity')+' '+(selected.isGps?'':tr('noGps'));
    byId('radarChartTitle').textContent=tr('chart');
    byId('radarChartNote').textContent=tr('chartNote');
    byId('radarNearbyTitle').textContent=tr('next');
    byId('radarLiveTitle').textContent=tr('live');
    byId('radarSource').textContent=tr('ref');
    for(const k of ['all','hosp','pharm']){
      const btn=byId('radarFilter-'+k);
      btn.setAttribute('aria-pressed',String(filter===k||(k==='hosp'&&filter==='hospital')||(k==='pharm'&&filter==='pharmacy')));
    }
  }
  function drawMetrics(items){
    const base=selectedDate(),now=items.filter(p=>phase(p,base)==='now').length;
    const later=items.filter(p=>phase(p,base)==='later').length;
    const mapped=items.filter(valid).length;
    const entries=[
      {v:now,l:tr('active')},{v:later,l:tr('later')},{v:mapped,l:tr('mapped')}
    ];
    const holder=byId('radarMetrics');holder.replaceChildren();
    for(const entry of entries){
      const b=mk('div','radar-stat');
      b.append(mk('strong','',entry.v),mk('span','',entry.l));
      holder.append(b);
    }
  }
  function drawChart(items){
    const target=byId('radarChart');target.replaceChildren();
    const date=selectedDate();
    const slots=Array.from({length:12},(_,i)=>{
      const at=480+i*120;
      const h=items.filter(p=>p.type==='hospital'&&runningAt(p,at)).length;
      const f=items.filter(p=>p.type==='pharmacy'&&runningAt(p,at)).length;
      return {label:String(Math.floor(at/60)%24).padStart(2,'0')+':00',h,f};
    });
    const max=Math.max(1,...slots.map(s=>s.h+s.f));
    const now=todayClock(),currentMinutes=dayOffset(now.date,date)*1440+now.minutes;
    for(let i=0;i<slots.length;i++){
      const slot=slots[i],bin=mk('div','radar-bin');
      const bars=mk('div','radar-bars');
      const hospitalBar=mk('div','radar-bar hospital');
      hospitalBar.style.height=Math.max(0,slot.h/max*100)+'%';
      const pharmacyBar=mk('div','radar-bar pharmacy');
      pharmacyBar.style.height=Math.max(0,slot.f/max*100)+'%';
      bars.append(hospitalBar,pharmacyBar);
      bin.append(bars,mk('span','',slot.label));
      const from=480+i*120;
      if(!customDate&&currentMinutes>=from&&currentMinutes<from+120)bin.classList.add('current');
      bin.title=slot.label+' · '+tr('hosp')+': '+slot.h+' · '+tr('pharm')+': '+slot.f;
      target.append(bin);
    }
  }
  function popupContent(p){
    const e=mk('div','radar-popup');
    e.append(mk('strong','',p.name||'?'));
    if(p.address)e.append(mk('p','',p.address));
    const when=mk('div','radar-popup-meta',tr(phase(p,selectedDate())==='now'?'now':phase(p,selectedDate())==='later'?'soon':phase(p,selectedDate())==='ended'?'ended':'unknown')+' · '+prettyDist(p));
    e.append(when);
    const a=mk('a','',tr('route'));a.href=urls(p);a.target='_blank';a.rel='noopener noreferrer';e.append(a);
    if(p.phone && /^[+\d()\s.-]{7,25}$/.test(p.phone)){const tel=mk('a','',tr('call'));tel.href='tel:'+p.phone.replace(/[^+\d]/g,'');e.append(tel)}
    return e;
  }
  function markerIcon(p){
    return L.divIcon({className:'radar-map-icon',html:'<span class="radar-pin '+(p.type==='hospital'?'hospital':'pharmacy')+'">'+(p.type==='hospital'?'+':'✦')+'</span>',iconSize:[27,34],iconAnchor:[13,33],popupAnchor:[0,-27]});
  }
  function fitMap(items){
    if(!map||!valid(selected))return;
    const k=selected.lat+'|'+selected.lon+'|'+filter+'|'+items.map(p=>p.lat+','+p.lon).join(';');
    if(cameraKey===k)return;
    cameraKey=k;
    const coords=[coord(selected),...items.filter(valid).map(coord)];
    if(coords.length>1)map.fitBounds(L.latLngBounds(coords),{padding:[30,30],maxZoom:13,animate:false});
    else map.setView(coord(selected),12,{animate:false});
  }
  function drawMap(items){
    const container=byId('dutyMap');
    if(!valid(selected))return;
    if(!window.L){container.replaceChildren(mk('div','radar-map-error',tr('mapFail')));return;}
    if(!map){
      map=L.map(container,{zoomControl:true,scrollWheelZoom:false,preferCanvas:true,attributionControl:true})
        .setView(coord(selected),12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom:18
      }).addTo(map);
      markersLayer=L.layerGroup().addTo(map);
    }
    markersLayer.clearLayers();markerMap.clear();
    if(selfMarker)map.removeLayer(selfMarker);
    selfMarker=L.circleMarker(coord(selected),{
      radius:9,color:'#fff',weight:3,fillColor:'#248af6',fillOpacity:1
    }).addTo(map).bindPopup(selected.isGps?tr('gps'):tr('area'));
    for(const p of items){
      if(!valid(p))continue;
      const marker=L.marker(coord(p),{icon:markerIcon(p)}).bindPopup(popupContent(p));
      marker.addTo(markersLayer);markerMap.set(p,marker);
    }
    fitMap(items);
    setTimeout(()=>map.invalidateSize({pan:false}),80);
  }
  function drawNearby(items){
    const div=byId('radarNearby');div.replaceChildren();
    const sorted=[...items].sort((a,b)=>(getDistance(a)??Infinity)-(getDistance(b)??Infinity));
    if(!sorted.length){div.append(mk('p','radar-empty',tr('missing')));return;}
    const nearby=sorted.slice(0,8);
    for(const p of nearby){
      const line=mk('article','radar-nearby-item');
      const info=mk('div','radar-nearby-main');
      const name=mk('strong','',p.name);
      info.append(name,mk('small','',prettyDist(p)+' · '+tr(phase(p,selectedDate())==='now'?'now':phase(p,selectedDate())==='later'?'soon':phase(p,selectedDate())==='ended'?'ended':'unknown')));
      const actions=mk('div','radar-nearby-actions');
      if(valid(p)){
        const focus=mk('button','radar-focus',isEnglish()?'Map':'Χάρτης');focus.type='button';
        focus.onclick=()=>{
          if(map){map.setView(coord(p),14);const m=markerMap.get(p);if(m)m.openPopup();}
          else window.open('https://www.openstreetmap.org/?mlat='+p.lat+'&mlon='+p.lon+'#map=14/'+p.lat+'/'+p.lon,'_blank','noopener');
        };
        actions.append(focus);
      }
      const a=mk('a','radar-directions',tr('route'));a.href=urls(p);a.target='_blank';a.rel='noopener noreferrer';actions.append(a);
      line.append(info,actions);
      div.append(line);
    }
    const absent=items.filter(p=>!valid(p)).length;
    if(absent)div.append(mk('p','radar-missing-coords',absent+' · '+tr('unknownCoords')));
  }
  function queueHistory(n,stamp){
    if(!Number.isFinite(n))return;
    const time=Date.now();
    if(history.some(p=>p.stamp===stamp))return;
    history.push({t:time,v:n,stamp:stamp||String(time)});
    history=history.filter(p=>time-p.t<86400000).slice(-180);
    try{localStorage.setItem(historyKey,JSON.stringify(history))}catch{}
  }
  function drawLive(items){
    const holder=byId('radarLive');holder.replaceChildren();
    if(customDate){holder.append(mk('p','radar-note',tr('dateNote')));return;}
    const hasPapa=items.some(x=>/ΠΑΠΑΓΕΩΡΓΙΟΥ|PAPAGEORGIOU/i.test(String(x.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'')));
    if(!hasPapa){holder.append(mk('p','radar-note',tr('liveNo')));return;}
    if(liveData?.status!=='live'||!liveData.metrics){
      holder.append(mk('p','radar-note',tr('liveNo')));
      return;
    }
    const stats=mk('div','radar-live-stats');
    const m=liveData.metrics;
    for(const [name,value] of [[tr('liveWait'),m.waitingDoctor],[tr('liveTriage'),m.waitingTriage],[tr('liveAverage'),m.averageWaitMinutes===null?'—':m.averageWaitMinutes+' '+tr('minutes')]]){
      const box=mk('div','radar-live-cell');
      box.append(mk('span','',name),mk('strong','',value??'—'));
      stats.append(box);
    }
    holder.append(mk('div','radar-live-badge',isEnglish()?'LIVE · Papageorgiou':'LIVE · Παπαγεωργίου'),stats);
    holder.append(mk('small','',tr('liveUpdate')+': '+(liveData.sourceUpdatedAt||'—')));
    const v=history.filter(p=>Date.now()-p.t<86400000);
    if(v.length>=2){
      const delta=v[v.length-1].v-v[v.length-2].v;
      holder.append(mk('p','radar-live-trend',tr('history')+': '+(delta>0?'+':'')+delta+' · '+tr('historyNote')));
    }
    const a=mk('a','radar-source-link',isEnglish()?'Official feed':'Επίσημη πηγή');
    a.href='https://www.gnpap-golive.gr/';a.target='_blank';a.rel='noopener noreferrer';holder.append(a);
  }
  async function fetchLive(items){
    if(customDate||!items.some(x=>/ΠΑΠΑΓΕΩΡΓΙΟΥ|PAPAGEORGIOU/i.test(String(x.name).normalize('NFD').replace(/[\u0300-\u036f]/g,''))))return;
    if(working||Date.now()-lastLiveAt<90_000)return;
    working=true;lastLiveAt=Date.now();
    try{
      const res=await fetch('/api/er-wait?hospital='+encodeURIComponent('Παπαγεωργίου'),{cache:'no-store'});
      if(res.ok){
        const j=await res.json();
        liveData=j;
        if(j.status==='live'&&j.metrics&&Number.isFinite(j.metrics.waitingDoctor))queueHistory(j.metrics.waitingDoctor,j.sourceUpdatedAt);
      }
    }catch{liveData={status:'unavailable'};}
    finally{working=false;drawLive(getItems());}
  }
  let drawScheduled=false;
  function render(){
    drawScheduled=false;
    if(typeof selected==='undefined'||typeof selectedDate!=='function')return;
    updateHeader();
    const items=getItems();
    drawMetrics(items);drawChart(items);drawNearby(items);drawMap(items);drawLive(items);
    void fetchLive(items);
  }
  function schedule(){
    if(drawScheduled)return;
    drawScheduled=true;
    window.requestAnimationFrame(render);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    for(const [button,key] of [['radarFilter-all','all'],['radarFilter-hosp','hospital'],['radarFilter-pharm','pharmacy']]){
      byId(button).onclick=()=>{filter=key;cameraKey='';schedule();};
    }
    byId('radarGps').onclick=()=>byId('gps')?.click();
    for(const id of ['hospitals','pharmacies','nextResults']){
      const target=byId(id);if(target)new MutationObserver(schedule).observe(target,{childList:true});
    }
    byId('language')?.addEventListener('click',schedule);
    for(const id of ['nowTab','dayTab','date','specialty','confirmArea'])byId(id)?.addEventListener('change',schedule);
    byId('specialty')?.addEventListener('change',schedule);
    byId('gps')?.addEventListener('click',()=>setTimeout(schedule,500));
    schedule();
    setInterval(()=>{if(!document.hidden)schedule()},60_000);
  });
})();
