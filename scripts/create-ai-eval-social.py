from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math
root=Path(__file__).resolve().parent.parent
out=root/'assets'/'social'/'og-ai-intelligence-evaluation-2026.png'
W,H=1200,630
im=Image.new('RGB',(W,H),(16,29,47))
px=im.load()
for y in range(H):
 for x in range(W):
  v=max(0,1-math.hypot(x-1060,y-60)/1050)
  px[x,y]=(int(16+23*v),int(29+25*v),int(47+20*v))
draw=ImageDraw.Draw(im)
path=Path('C:/Windows/Fonts')
def font(n,bold=False):
 file=path/('segoeuib.ttf' if bold else 'segoeui.ttf')
 if not file.exists(): file=path/('arialbd.ttf' if bold else 'arial.ttf')
 return ImageFont.truetype(str(file),n) if file.exists() else ImageFont.load_default()
teal='#63dfc6'; white='#f5f5f1'; muted='#a9becb';border='#3f6174'
draw.rounded_rectangle((46,47,1154,582),radius=22,fill='#122539',outline=border,width=2)
draw.rounded_rectangle((76,78,284,118),radius=15,fill='#214848')
draw.text((92,85),'KAHRELUM  /  OS',font=font(17,True),fill=teal)
draw.text((80,147),'INTELLIGENCE',font=font(61,True),fill=white)
draw.text((80,224),'EVALUATION LAB',font=font(57,True),fill=teal)
draw.text((83,312),'Source-linked scoring. Preserved uncertainty.',font=font(25),fill=muted)
draw.line((78,374,1122,374),fill=border,width=2)
for i,(head,desc) in enumerate([('EVIDENCE','Traceable claims'),('CHALLENGE','Countercase retained'),('ADJUDICATION','Provisional findings')]):
  x=80+350*i
  draw.rounded_rectangle((x,406,x+328,502),radius=13,fill='#1d344a',outline='#36546b',width=2)
  draw.text((x+17,421),head,font=font(21,True),fill=white)
  draw.text((x+17,461),desc,font=font(17),fill=muted)
draw.rounded_rectangle((80,529,674,559),radius=13,fill='#594b32')
draw.text((95,536),'SYNTHETIC DEMONSTRATION  |  NOT CERTIFICATION',font=font(13,True),fill='#ffe0a2')
out.parent.mkdir(parents=True,exist_ok=True)
im.save(out,optimize=True)
print('GENERATED',out.name,im.size,out.stat().st_size)
