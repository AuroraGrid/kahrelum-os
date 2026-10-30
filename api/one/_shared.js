const crypto = require('node:crypto');

function send(res, status, body, headers = {}) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  return res.status(status).json(body);
}
function method(req, res, expected) {
  if (req.method === expected) return true;
  res.setHeader('Allow', expected);
  send(res, 405, {error:'Method not allowed.'});
  return false;
}
function secureConfig() {
  const secret = process.env.KAHRELUM_ONE_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return {secret, hashes:(process.env.KAHRELUM_ONE_INVITE_HASHES || '').split(',').map(value=>value.trim().toLowerCase()).filter(value=>/^[a-f0-9]{64}$/.test(value))};
}
function digest(value) { return crypto.createHash('sha256').update(value, 'utf8').digest('hex'); }
function safeEqual(left, right) {
  const a = Buffer.from(left, 'hex'), b = Buffer.from(right, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function sign(payload, secret) {
  const value = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret).update(value).digest('base64url');
  return `${value}.${mac}`;
}
function verifyToken(token, secret) {
  if (!token || token.length > 2048) return false;
  const [value, mac, extra] = token.split('.');
  if (!value || !mac || extra) return false;
  const expected = crypto.createHmac('sha256', secret).update(value).digest('base64url');
  const a = Buffer.from(mac), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a,b)) return false;
  try { const payload=JSON.parse(Buffer.from(value,'base64url').toString('utf8')); return payload.exp > Math.floor(Date.now()/1000) && payload.aud === 'kahrelum-one'; } catch { return false; }
}
function sessionCookie(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/(?:^|;\s*)k1_session=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : '';
}
function authorized(req) {
  const config=secureConfig();
  return Boolean(config && verifyToken(sessionCookie(req),config.secret));
}
function sessionHeaders(req, secret) {
  const token=sign({aud:'kahrelum-one', exp:Math.floor(Date.now()/1000)+60*60*24*7}, secret);
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  return {'Set-Cookie':`k1_session=${encodeURIComponent(token)}; Path=/api/one; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`};
}
function clearSession() { return {'Set-Cookie':'k1_session=; Path=/api/one; HttpOnly; SameSite=Lax; Max-Age=0; Secure'}; }
function originAllowed(req) {
  const origin=req.headers.origin;
  if(!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}
module.exports={send,method,secureConfig,digest,safeEqual,authorized,sessionHeaders,clearSession,originAllowed};
