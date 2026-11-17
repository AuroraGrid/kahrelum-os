'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'site-shell.css'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/firebase-scoped-release.yml'),'utf8');
const publisher=fs.readFileSync(path.join(root,'scripts/firebase-overlay-release.cjs'),'utf8');

test('opened iPhone menu has viewport-sized panel, not button-sized max-width',()=>{
  // At <=480 the old max-width:100% resolves against the narrow details button.
  // The later explicit viewport width must win the cascade.
  const narrow=css.lastIndexOf('/* Mobile navigation viewport fix');
  assert.ok(narrow>=0,'Missing late-cascade iPhone menu-width correction');
  const rule=css.slice(narrow);
  assert.match(rule,/\.site-mobile-panel\s*\{[^}]*width:\s*min\(calc\(100vw - 2rem\),\s*24rem\)/);
  assert.match(rule,/\.site-mobile-panel\s*\{[^}]*min-width:\s*min\(calc\(100vw - 2rem\),\s*24rem\)/);
  assert.match(rule,/\.site-mobile-panel\s*\{[^}]*max-width:\s*min\(calc\(100vw - 2rem\),\s*24rem\)/);
  assert.match(rule,/\.site-mobile-panel\s*\{[^}]*max-height:\s*calc\(100dvh - 5rem\)/);
  assert.match(rule,/\.site-mobile-panel\s*\{[^}]*overflow-y:\s*auto/);
});

test('mobile nav links stay readable and not force character-by-character breaks',()=>{
  const narrow=css.slice(css.lastIndexOf('/* Mobile navigation viewport fix'));
  assert.match(narrow,/\.site-mobile-group\s*\{[^}]*grid-template-columns:\s*minmax\(0,1fr\)/);
  assert.match(narrow,/\.site-mobile-group\s+a\s*\{[^}]*overflow-wrap:\s*normal/);
  assert.match(narrow,/\.site-mobile-group\s+a\s*\{[^}]*word-break:\s*normal/);
});

test('mobile menu is deployed through exact CSS-only Firebase profile, not a stale full deploy',()=>{
  assert.match(publisher,/'mobile-nav-layout':\s*\{[\s\S]{0,300}overlayFiles:\s*\['site-shell\.css'\]/);
  assert.match(publisher,/Mobile navigation release attempted to change unrelated live Firebase files/);
  assert.match(workflow,/profiles="mobile-nav-layout"/);
  assert.match(workflow,/Mobile navigation source push includes unrelated path/);
  assert.match(workflow,/mobile-nav-browser-qa\.cjs/);
});
