from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

ROOT=Path(__file__).resolve().parent.parent
DEST=ROOT/'assets'/'social'/'og-opticodds-market-integrity.png'
W,H=1200,630
im=Image.new('RGB',(W,H),'#09121f')
pix=im.load()
for y in range(H):
    for x in range(W):
        s=max(0,1-math.hypot(x-1020,y-60)/850)
        pix[x,y]=(int(9+14*s),int(18+40*s),int(31+40*s))
draw=ImageDraw.Draw(im)
font_dir=Path(r'C:\Windows\Fonts')
def font(sz,bold=False):
    name='segoeuib.ttf' if bold else 'segoeui.ttf'
    f=font_dir/name
    if not f.exists():f=font_dir/('arialbd.ttf' if bold else 'arial.ttf')
    return ImageFont.truetype(str(f),sz) if f.exists() else ImageFont.load_default()

teal='#62e2c5'
muted='#b9c9d7'
white='#eef6fd'
draw.rounded_rectangle((46,42,1154,588),radius=24,outline='#305064',width=2,fill='#0c1b2c')
draw.rounded_rectangle((77,72,293,109),radius=18,fill='#1b4447')
draw.text((94,78),'KAHRELUM  /  OS',font=font(18,True),fill=teal)
draw.text((77,139),'MARKET STATE',font=font(54,True),fill=white)
draw.text((77,203),'INTEGRITY LAB',font=font(59,True),fill=teal)
draw.text((81,283),'Independent evidence-to-decision reviews of market data.',font=font(23),fill=muted)
draw.line((79,335,1118,335),fill='#284659',width=2)

cards=[
    ('01','INJURY-TO-ODDS','Lock propagation and stale-line evidence'),
    ('02','STREAM CONTINUITY','SSE reconnect and missing checkpoint'),
    ('03','SETTLEMENT','Result-to-grade reconciliation')
]
for i,(num,title,desc) in enumerate(cards):
    x=78+i*350
    draw.rounded_rectangle((x,365,x+333,482),radius=15,fill='#13283a',outline='#305267',width=2)
    draw.text((x+17,378),num,font=font(21,True),fill=teal)
    draw.text((x+17,412),title,font=font(17,True),fill=white)
    draw.text((x+17,445),desc,font=font(13),fill=muted)

draw.rounded_rectangle((78,520,653,550),radius=12,fill='#544022')
draw.text((92,523),'SYNTHETIC DEMO  •  NO LIVE API  •  NO PROVIDER AFFILIATION',font=font(13,True),fill='#ffdfa9')
draw.text((806,522),'kahrelum.com',font=font(21,True),fill=white)
DEST.parent.mkdir(parents=True,exist_ok=True)
im.save(DEST,optimize=True)
print('PNG_CREATED',str(DEST),'BYTES',DEST.stat().st_size,'SIZE',im.size)
