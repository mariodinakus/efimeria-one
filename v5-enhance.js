/* EFIMERIA ONE v5.2: location-aware duty cards (no guessed live availability). */
'use strict';
(() => {
  const extraEl={
    distanceGps:'Από τη θέση σου',distanceArea:'Από το κέντρο της περιοχής',straightLine:'σε ευθεία',
    activeDuty:'Σε ισχύ βάσει ωραρίου',laterDuty:'Η εφημερία αρχίζει αργότερα',
    endedDuty:'Η αναγραφόμενη βάρδια έληξε',
    distanceSort:'Πρώτα οι εφημερίες σε ισχύ, μετά οι πλησιέστερες αποστάσεις'
  };
  const extraEn={
    distanceGps:'From your GPS location',distanceArea:'From the area centre',straightLine:'straight-line',
    activeDuty:'On duty per published hours',laterDuty:'Duty starts later',
    endedDuty:'Listed shift has ended',
    distanceSort:'Current scheduled duty first, then nearest distance'
  };
  Object.assign(TEXT.el,extraEl);
  Object.assign(TEXT.en,extraEn);
  const valid=p=>p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon))
    &&Number(p.lat)>=34&&Number(p.lat)<=42.6&&Number(p.lon)>=19&&Number(p.lon)<=30;
  const proximity=p=>valid(p)&&valid(selected)?distance(selected.lat,selected.lon,Number(p.lat),Number(p.lon)):null;
  const distanceText=d=>d<1?Math.round(d*1000)+' '+(lang==='el'?'μ.':'m')
    :new Intl.NumberFormat(lang==='el'?'el-GR':'en-GB',{maximumFractionDigits:1}).format(d)+' '+(lang==='el'?'χλμ.':'km');
  const phase=item=>{
    if(customDate||item.date!==isoToday())return 'unknown';
    const clock=parts(),now=Number(clock.hour)*60+Number(clock.minute);
    const intervals=[...String(item.hours||'').matchAll(/(\d{1,2}):(\d\d)\s*[–-]\s*(\d{1,2}):(\d\d)/g)];
    if(!intervals.length)return 'unknown';
    let later=false;
    for(const x of intervals){
      const start=Number(x[1])*60+Number(x[2]),end=Number(x[3])*60+Number(x[4]);
      if((end<=start&&now>=start)||(end>start&&now>=start&&now<end))return 'now';
      if(now<start)later=true;
    }
    return later?'later':'ended';
  };
  const priority={now:0,later:1,unknown:2,ended:3};
  const byDistance=(a,b)=>(proximity(a)??Infinity)-(proximity(b)??Infinity);
  // Use coordinates published in the directory's own Google Maps link if present.
  mapsURL=item=>{
    const dest=valid(item)?item.lat+','+item.lon
      :[item.name,item.address,'Greece'].filter(Boolean).join(', ');
    return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(dest);
  };
  const previousCard=card;
  card=function(item,type,upcoming=false){
    const c=previousCard(item,type,upcoming);
    if(type==='pharmacy'&&!upcoming){
      const status=phase(item),tag=c.querySelector('.label');
      if(tag&&status!=='unknown')tag.textContent=t(status==='now'?'activeDuty':status==='later'?'laterDuty':'endedDuty');
      if(status==='ended')c.classList.add('shift-ended');
    }
    const d=proximity(item);
    if(d!==null){
      const pill=safeNode('div','distance-info');
      pill.append(safeNode('strong','',distanceText(d)));
      pill.append(safeNode('span','',(selected.isGps?t('distanceGps'):t('distanceArea'))+' · '+t('straightLine')));
      const addr=c.querySelector('.addr');
      if(addr)addr.after(pill);else c.append(pill);
    }
    return c;
  };
  const prevRenderPharmacy=renderPharmacy;
  renderPharmacy=function(){
    if(pharmResult?.entries?.length){
      pharmResult.entries.sort((a,b)=>(priority[phase(a)]-priority[phase(b)])||byDistance(a,b)||a.name.localeCompare(b.name,'el'));
    }
    prevRenderPharmacy();
    if(pharmResult?.entries?.length) {
      const meta=document.getElementById('pharmacyMeta');
      meta.textContent+=' · '+t('distanceSort');
    }
  };
  const names=['ΑΧΕΠΑ','ΙΠΠΟΚΡΑΤΕΙΟ','ΠΑΠΑΓΕΩΡΓΙΟΥ','ΠΑΠΑΝΙΚΟΛΑΟΥ','ΓΕΝΝΗΜΑΤ','ΠΑΥΛΟΣ','ΔΗΜΗΤΡΙΟΣ','ΨΥΧΙΑΤΡΙΚΟ','ΑΦΡΟΔΙΣΙΩΝ'];
  let mappedHospitals=[];
  function enrich(){
    for(const hospital of [...(hospResult?.entries||[]),...(nextResult?.entries||[])]){
      if(valid(hospital))continue;
      const stem=names.find(n=>norm(hospital.name).includes(norm(n)));
      if(!stem)continue;
      const matches=mappedHospitals.filter(p=>norm(p.name).includes(norm(stem)));
      if(matches.length!==1)continue;
      hospital.lat=matches[0].lat;hospital.lon=matches[0].lon;
      hospital.coordinateSource='OpenStreetMap';
    }
  }
  const prevRenderHospital=renderHospital;
  renderHospital=function(){
    enrich();
    if(hospResult?.entries)hospResult.entries.sort(byDistance);
    if(nextResult?.entries)nextResult.entries.sort(byDistance);
    prevRenderHospital();
  };
  const prevRequest=request;
  request=async function(type,date,area,id){
    const result=await prevRequest(type,date,area,id);
    if(type!=='pharmacy'||result.entries?.length||date!==isoToday())return result;
    const city=isThessArea()?'thessaloniki':/ΑΘΗΝ|ATHEN|ΠΕΙΡΑΙ|PIRAE/i.test(area)?'athens':null;
    if(!city)return result;
    try{
      const r=await fetch('/api/pharmacies?'+new URLSearchParams({city,date}),{cache:'no-store'});
      if(!r.ok)return result;
      const alt=await r.json();
      if(id!==requestId||alt.date!==date||!alt.entries?.length)return result;
      return {...result,entries:alt.entries,status:'published',source:alt.source,sourceLabel:'iefimeria.gr (independent directory)',liveConfirmed:false};
    }catch{return result}
  };
  const prevUpdate=update;
  update=function(){
    mappedHospitals=[];
    const p=prevUpdate(),id=requestId;
    void (async()=>{
      if(!valid(selected))return;
      try{
        const params=new URLSearchParams({lat:selected.lat,lon:selected.lon,radius:30000,type:'hospital',lang:'el'});
        const r=await fetch('/api/nearby?'+params,{cache:'no-store'});
        if(!r.ok)return;
        const data=await r.json();
        if(id!==requestId||!Array.isArray(data.places))return;
        mappedHospitals=data.places.filter(valid);
        renderHospital();
      }catch{/* Distances are omitted if map coordinates cannot be established. */}
    })();
    return p;
  };
})();