// Read-only, origin-locked election data bridge for Vercel preview hosting.
// On canonical Firebase Hosting, the lab reads /election-data/* directly.
// This proxy must NEVER accept arbitrary URLs or write election data.
const ALLOWED = new Set(["latest.json","coalitions.json","competition.json","competition-lock.json"]);
export default async function handler(req,res) {
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"read_only"});}
  let file=typeof req.query.file==="string"?req.query.file:"";
  if(!ALLOWED.has(file) && !/^coalition-draws\/[0-9a-f]{16}\.json$/.test(file)){
    return res.status(400).json({error:"resource_not_allowlisted"});
  }
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12500);
  try{
    const url="https://kahrelum.com/election-data/"+file;
    const r=await fetch(url,{method:"GET",signal:controller.signal,redirect:"error",headers:{Accept:"application/json"}});
    if(!r.ok) return res.status(502).json({error:"upstream_unavailable",upstream_status:r.status});
    const text=await r.text();
    if(text.length>4500000) return res.status(502).json({error:"upstream_exceeds_limit"});
    const payload=JSON.parse(text);
    if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new Error("bad_feed_shape");
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.setHeader("X-KAHRELUM-Bridge","read-only");
    res.setHeader("Cache-Control","public, s-maxage=35, stale-while-revalidate=60");
    return res.status(200).send(text);
  }catch(error){
    return res.status(502).json({error:"upstream_read_failed"});
  }finally{clearTimeout(timer);}
}
