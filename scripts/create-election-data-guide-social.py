from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math
root=Path(__file__).resolve().parent.parent
out=root/'assets'/'social'/'og-election-data-guide.png'
W,H=1200,630
im=Image.new('RGB',(W,H),'#112a38')
px=im.load()
for y in range(H):
 for x in range(W):
  grad=max(0.0,1-math.hypot(x-985,y-160)/990)
  px[x,y]=(int(17+30*grad),int(42+18*grad),int(56+28*grad))
d=ImageDraw.Draw(im)
font_dir=Path('C:/Windows/Fonts')
def f(size,bold=False):
 name='segoeuib.ttf' if bold else 'segoeui.ttf'
 p=font_dir/name
 if not p.exists():p=font_dir/('arialbd.ttf' if bold else 'arial.ttf')
 return ImageFont.truetype(str(p),size) if p.exists() else ImageFont.load_default()
white='#f5f1e8'; aqua='#84ded2';muted='#bfd2d3'
d.rounded_rectangle((48,46,1152,579),radius=24,outline='#49727a',width=2,fill='#172d3b')
d.rounded_rectangle((78,75,306,117),radius=17,fill='#245359')
d.text((94,83),'KAHRELUM  /  RECORDS',font=f(16,True),fill=aqua)
d.text((78,150),'ELECTION DATA',font=f(59,True),fill=white)
d.text((78,222),'& EVIDENCE',font=f(59,True),fill=aqua)
d.text((82,318),'Original cutoffs. Auditable sources. Explicit uncertainty.',font=f(25),fill=muted)
d.line((80,367,1114,367),fill='#456271',width=2)
items=[('01  OBSERVATION','Published collector state'),('02  COALITIONS','Sources and definitions'),('03  COMPETITION LOCK','Historical method and cutoff')]
for i,(name,sub) in enumerate(items):
 x=80+i*350
 d.rounded_rectangle((x,405,x+330,500),radius=14,fill='#244354',outline='#416476',width=2)
 d.text((x+17,422),name,font=f(18,True),fill=white)
 d.text((x+17,462),sub,font=f(15),fill=muted)
d.rounded_rectangle((80,529,660,557),radius=10,fill='#4a4733')
d.text((92,535),'PUBLIC RESEARCH  |  NOT A CERTIFIED ELECTION RESULT',font=f(12,True),fill='#f1d8a2')
out.parent.mkdir(parents=True,exist_ok=True)
im.save(out,optimize=True)
print('PNG_CREATED',out.name,'BYTES',out.stat().st_size,'SIZE',im.size)
