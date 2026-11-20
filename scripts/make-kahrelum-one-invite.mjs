#!/usr/bin/env node
import { createHash, randomBytes } from 'node:crypto';
const code=`K1-${randomBytes(24).toString('base64url')}`;
const hash=createHash('sha256').update(code,'utf8').digest('hex');
console.log(`Invite code (share privately):\n${code}\n\nSHA-256 digest (add to KAHRELUM_ONE_INVITE_HASHES):\n${hash}`);
