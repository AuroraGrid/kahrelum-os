from pathlib import Path
from xml.etree import ElementTree
from urllib.parse import urlsplit
from collections import defaultdict
from bs4 import BeautifulSoup
import requests
root=Path(__file__).resolve().parent.parent
base='https://kahrelum.com'
s=requests.Session()
sitemap=s.get(base+'/sitemap.xml',timeout=30)
sitemap.raise_for_status()
urls=[]
for e in ElementTree.fromstring(sitemap.text).findall('.//{*}loc'):
 if e.text and e.text.startswith(base+'/'):urls.append(e.text.strip())
groups=defaultdict(list)
for url in urls:
 path=urlsplit(url).path
 name=path.strip('/').split('/')[0] if path.strip('/') else 'Overview and commercial'
 group={'investigations':'Investigations','insights':'Insights','sports':'Sports','nfl':'Sports and NFL','election':'Elections','election-challenge':'Elections','forecasting':'Forecasting','pilot':'Commercial','assurance':'Commercial','demo':'Commercial','sample':'Commercial','opticodds-market-integrity':'Commercial and demonstrations','ai-intelligence-evaluation-2026':'AI evaluation','digital-id':'Digital identity'}.get(name,'Other public pages')
 try:
  r=s.get(url,timeout=17)
  title=BeautifulSoup(r.text,'html.parser').title
  title=title.get_text(' ',strip=True) if title else (path or 'Homepage')
 except Exception:
  title=path or 'Homepage'
 groups[group].append((title,url))
lines=['# KAHRELUM public sitemap','', 'Canonical domain: https://kahrelum.com/', 'Source sitemap: https://kahrelum.com/sitemap.xml','', 'This public directory groups existing website pages. Research status and timestamps are defined on individual pages; inclusion is not an endorsement, certification or claim of live accuracy.','']
for group,items in sorted(groups.items()):
 lines.extend(['## '+group,''])
 for title,url in items:
  lines.append(f'- [{title.replace(chr(91),chr(40)).replace(chr(93),chr(41))}]({url})')
 lines.append('')
(root/'sitemap.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
print('SITEMAP_MD_WRITTEN',len(urls),'URLS',len(groups),'SECTIONS')
