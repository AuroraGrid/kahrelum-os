'use strict';
function patchDiscovery(live, source, name) {
  const route='/insights/morgan-dollar-quote';
  const snippet=name==='insights.html'
    ? source.match(/<section aria-labelledby="mqa001-title">[\s\S]*?<\/section>/)?.[0]
    : source.split(/\r?\n/).find(line=>line.includes('https://kahrelum.com'+route));
  if(!snippet)throw Error('Missing MQA discovery source');
  if(live.includes(route)) {
    if(!live.includes(snippet) || live.split(route).length!==2)throw Error('Conflicting MQA discovery');
    return live;
  }
  if(name==='sitemap.md')return live+(live.endsWith('\n')?'':'\n')+snippet+'\n';
  if(live.split('</main>').length!==2)throw Error('Ambiguous Insights insertion');
  return live.replace('</main>',snippet+'\n</main>');
}
module.exports={patchDiscovery};
