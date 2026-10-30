const {send,method,secureConfig,authorized,clearSession}=require('./_shared');
module.exports=async function handler(req,res){
  if(req.method==='DELETE')return send(res,200,{ok:true},clearSession());
  if(!method(req,res,'GET'))return;
  if(!secureConfig())return send(res,503,{ok:false,error:'Invite access is not configured.'});
  return authorized(req)?send(res,200,{ok:true,liveResearchAvailable:Boolean(process.env.TAVILY_API_KEY&&process.env.GEMINI_API_KEY)}):send(res,401,{ok:false});
};
