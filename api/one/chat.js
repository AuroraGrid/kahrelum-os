const {send,method,secureConfig,authorized,originAllowed}=require('./_shared');
const CHECK_PROMPT=`You are KAHRELUM ONE in evidence-check mode. Be useful, plain-spoken, and careful. Distinguish FACTS explicitly supported by information in the conversation from INFERENCES and UNKNOWN or MISSING EVIDENCE. Never invent citations, sources, research, actions, or verification. If the user asks about current facts or needs external evidence, say that live web research is not connected in this beta and identify what should be checked. Explain uncertainty briefly. Do not force this format for casual or personal questions; use the smallest structure that helps.`;
const EVERYDAY_PROMPT=`You are KAHRELUM ONE, a warm, capable general-purpose assistant for everyday life. Answer naturally and directly across any subject. Ask a brief follow-up only when it is genuinely needed. Be clear about uncertainty and never pretend to have browsed the web or completed actions you did not perform.`;
module.exports=async function handler(req,res){
  if(!method(req,res,'POST'))return;
  if(!originAllowed(req))return send(res,403,{error:'Request origin not allowed.'});
  const config=secureConfig();
  if(!config)return send(res,503,{error:'Assistant access is not configured yet.'});
  if(!authorized(req))return send(res,401,{error:'Enter your invite code to continue.'});
  const key=process.env.GEMINI_API_KEY;
  if(!key)return send(res,503,{error:'The assistant model is not configured yet. No message was sent.'});
  const {messages,mode}=req.body||{};
  if(!Array.isArray(messages)||messages.length<1||messages.length>12||!['everyday','check'].includes(mode))return send(res,400,{error:'Invalid message.'});
  const normalized=[];
  for(const item of messages){
    if(!item||!['user','assistant'].includes(item.role)||typeof item.content!=='string'||item.content.length>4000)return send(res,400,{error:'Invalid conversation history.'});
    normalized.push({role:item.role==='assistant'?'model':'user',parts:[{text:item.content}]});
  }
  if(normalized[normalized.length-1].role!=='user')return send(res,400,{error:'The last message must be from you.'});
  const base=process.env.KAHRELUM_ONE_GEMINI_MODEL||'gemini-2.5-flash';
  const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(base)}:generateContent`;
  try{
    const upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({systemInstruction:{parts:[{text:mode==='check'?CHECK_PROMPT:EVERYDAY_PROMPT}]},generationConfig:{temperature:0.6,maxOutputTokens:1200},contents:normalized})});
    const data=await upstream.json();
    if(!upstream.ok)return send(res,502,{error:upstream.status===429?'The model’s free-tier request limit has been reached. Try again later.':'The assistant provider returned an error. Try again shortly.'});
    const answer=data.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('').trim();
    if(!answer)return send(res,502,{error:'The assistant returned an empty answer. Please try again.'});
    return send(res,200,{answer});
  }catch{return send(res,502,{error:'Could not reach the assistant provider. Please try again.'});}
};
