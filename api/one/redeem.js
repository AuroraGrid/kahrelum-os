const {send,method,secureConfig,digest,safeEqual,sessionHeaders,originAllowed}=require('./_shared');
module.exports=async function handler(req,res){
  if(!method(req,res,'POST'))return;
  if(!originAllowed(req))return send(res,403,{error:'Request origin not allowed.'});
  const config=secureConfig();
  if(!config)return send(res,503,{error:'Invite access is not configured yet.'});
  if(!config.hashes.length)return send(res,503,{error:'No invite codes are configured yet.'});
  const code=typeof req.body?.code==='string'?req.body.code.trim():'';
  if(code.length<20||code.length>128)return send(res,400,{error:'Enter a valid invite code.'});
  const candidate=digest(code);
  const valid=config.hashes.some(hash=>safeEqual(candidate,hash));
  if(!valid)return send(res,401,{error:'That invite code isn’t valid. Check it and try again.'});
  return send(res,200,{ok:true},sessionHeaders(req,config.secret));
};
