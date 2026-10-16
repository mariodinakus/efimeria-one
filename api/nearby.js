/** OSM data discovery only. A returned place is NOT a confirmed on-duty provider. */
const ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter'
];
function json(res, status, obj) {
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control',status===200?'public, s-maxage=300, stale-while-revalidate=600':'no-store');
  res.setHeader('Access-Control-Allow-Origin','*');
  return res.end(JSON.stringify(obj));
}
function n(v, min, max) { const x=Number(v);return Number.isFinite(x)&&x>=min&&x<=max?x:null; }
function distance(a,b,c,d) {
  const p=Math.PI/180, dp=(c-a)*p, dl=(d-b)*p;
  const z=Math.sin(dp/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(dl/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));
}
function nameFrom(t,type,lang){return (lang==='en'?t['name:en']:t['name:el'])||t.name||t['name:el']||t['name:en']||(type==='pharmacy'?'Pharmacy':'Hospital');}
function addressFrom(t){return [t['addr:street'],t['addr:housenumber']].filter(Boolean).join(' ')||t['addr:full']||t['addr:city']||null;}
export default async function handler(req,res){
  if(req.method!=='GET') return json(res,405,{error:'Method not allowed'});
  const lat=n(req.query.lat,-90,90),lon=n(req.query.lon,-180,180),radius=n(req.query.radius,1000,30000);
  const type=req.query.type;
  const lang=req.query.lang==='en'?'en':'el';
  if(lat===null||lon===null||radius===null||!['hospital','pharmacy'].includes(type)) return json(res,400,{error:'Invalid search parameters'});
  const q=`[out:json][timeout:14];(nwr["amenity"="${type}"](around:${Math.round(radius)},${lat},${lon}););out center 350;`;
  let lastError='Τα δεδομένα χάρτη δεν απαντούν αυτή τη στιγμή.';
  for(const endpoint of ENDPOINTS){
    const c=new AbortController();const timeout=setTimeout(()=>c.abort(),7800);
    try{
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'EfimeriaOne/1.0 (contact: user project, openstreetmap usage)','Accept':'application/json'},body:new URLSearchParams({data:q}).toString(),signal:c.signal});
      if(!r.ok) throw new Error('Map service status '+r.status);
      const data=await r.json();if(!Array.isArray(data.elements)) throw new Error('Unexpected map response');
      const seen=new Set();
      const places=data.elements.map(x=>{
        const a=x.lat??x.center?.lat,b=x.lon??x.center?.lon,t=x.tags||{};
        if(!Number.isFinite(a)||!Number.isFinite(b))return null;
        const id=`${x.type}-${x.id}`;
        if(seen.has(id))return null;seen.add(id);
        const website=typeof t.website==='string'&&/^https?:\/\//i.test(t.website)?t.website:null;
        const phone=t['contact:phone']||t.phone||null;
        return {id,type,name:nameFrom(t,type,lang),lat:a,lon:b,address:addressFrom(t),phone,website,emergencyTag:t.emergency||null,specialityTag:t['healthcare:speciality']||null,distanceKm:Math.round(distance(lat,lon,a,b)*10)/10,verifiedOnDuty:false};
      }).filter(Boolean).sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,80);
      return json(res,200,{places,source:'© OpenStreetMap contributors · Overpass',updatedAt:new Date().toISOString(),onDutyVerified:false});
    }catch(err){lastError=err?.message||lastError;}finally{clearTimeout(timeout);}
  }
  return json(res,503,{error:'Map service unavailable. Try again or use the official links.',detail:String(lastError).slice(0,100)});
}
