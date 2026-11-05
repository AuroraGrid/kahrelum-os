#!/usr/bin/env python3
"""Deterministic, original KAHRELUM Open Graph cards. 1200 x 630; no third-party images."""
from pathlib import Path
import math
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets'/'social'
OUT.mkdir(parents=True,exist_ok=True)
FONT_ROOT=Path('C:/Windows/Fonts')
def font(name,size):
    p=FONT_ROOT/name
    return ImageFont.truetype(str(p),size) if p.exists() else ImageFont.load_default()
SERIF='georgia.ttf';BOLD='georgiab.ttf';SANS='arial.ttf';SANSB='arialbd.ttf'
INK='#211e19';PAPER='#f4efe6';WHITE='#fffdf8';MUTED='#6b6258';RED='#ac4e35';LINE='#cfc2af';NAVY='#243f59';GREEN='#386c66'
def label(d,x,y,s,fill=INK,size=23,bold=True):
    d.text((x,y),s,font=font(SANSB if bold else SANS,size),fill=fill)
def rule(d,x,y,end,color=LINE,width=2):
    d.line((x,y,end,y),fill=color,width=width)
def base(section,number):
    im=Image.new('RGB',(1200,630),PAPER);d=ImageDraw.Draw(im)
    d.rectangle((0,0,19,630),fill=RED)
    d.rectangle((1110,0,1200,14),fill=INK)
    label(d,76,40,'KAHRELUM',size=31)
    label(d,885,47,number,fill=RED,size=21)
    rule(d,76,101,1131)
    label(d,78,125,section,fill=RED,size=21)
    rule(d,76,565,1131)
    label(d,77,583,'EVIDENCE BEFORE INFERENCE.  ·  SOURCES / CUTOFFS / UNCERTAINTY',fill=MUTED,size=17)
    return im,d
def main():
    # US results, authentic statistics are not frozen into an auto-updating social graphic.
    im,d=base('2026 MIDTERMS  /  RESULTS DESK','01  /  US')
    d.text((77,188),'U.S. ELECTION',font=font(BOLD,68),fill=INK)
    d.text((77,270),'RESULTS MAP',font=font(BOLD,68),fill=INK)
    label(d,79,396,'435 HOUSE  /  35 SENATE  /  36 GOVERNORS',size=26)
    label(d,80,455,'UNOFFICIAL COUNTS  ·  SOURCE LINKED',fill=RED,size=21)
    for i in range(10):
        x=848+(i%5)*58;y=212+(i//5)*104
        d.rectangle((x,y,x+44,y+70),outline=NAVY,width=3)
        d.rectangle((x+7,y+10,x+37,y+52),fill=(NAVY if i in (0,2,4,5,7) else RED))
    im.save(OUT/'og-us-results-2026.png',optimize=True)

    im,d=base('26TH KNESSET  /  CERTIFICATION AUDIT','02  /  ISRAEL')
    d.text((78,188),'ISRAEL 2026',font=font(BOLD,69),fill=INK)
    d.text((78,271),'CERTIFIED SEATS',font=font(BOLD,60),fill=INK)
    label(d,80,391,'120 SEATS  ·  NOVEMBER 4 CERTIFICATION',size=23)
    xx=80;top=452
    for width,fill in [(53/120*850,'#9c6046'),(48/120*850,'#365d77'),(19/120*850,'#44766d')]:
        d.rectangle((xx,top,xx+width,top+45),fill=fill);xx+=width
    label(d,80,515,'53 / 48 / 19 BLOC ANALYSIS  ·  NOT GOVERNMENT FORMATION',fill=MUTED,size=18)
    im.save(OUT/'og-israel-certified-2026.png',optimize=True)

    im,d=base('SOURCEGRID  /  SPORTS INTELLIGENCE','03  /  NFL')
    d.text((77,185),'NFL TRADE',font=font(BOLD,73),fill=INK)
    d.text((77,274),'DEADLINE WATCH',font=font(BOLD,67),fill=INK)
    label(d,78,399,'NOV 10  /  4 P.M. EASTERN',size=26)
    label(d,79,465,'OFFICIAL DEALS  ·  REPORTED TALKS  ·  REVIEW QUEUE',fill=RED,size=20)
    for i in range(5):
        x=930+i*40
        d.line((x,195,x,514),fill=LINE,width=3)
    d.ellipse((990,253,1120,382),outline=RED,width=8)
    im.save(OUT/'og-nfl-deadline-watch-2026.png',optimize=True)

    im,d=base('HISTORICAL AI DECISIONS  /  FREE TOOL','04  /  ASSURANCE')
    d.text((78,191),'DECISION EVIDENCE',font=font(BOLD,59),fill=INK)
    d.text((78,271),'GAP SCORECARD',font=font(BOLD,64),fill=INK)
    label(d,81,397,'8 EVIDENCE GATES  ·  3 HISTORICAL CASES',size=24)
    label(d,81,460,'PASS  /  GAP  /  UNKNOWN  ·  CSV EXPORT',fill=RED,size=21)
    d.text((956,375),'08',font=font(BOLD,110),fill=RED)
    im.save(OUT/'og-evidence-scorecard.png',optimize=True)
    for p in ['og-us-results-2026.png','og-israel-certified-2026.png','og-nfl-deadline-watch-2026.png','og-evidence-scorecard.png']:
        f=OUT/p;check=Image.open(f);assert check.size==(1200,630);print(p,f.stat().st_size)
if __name__=='__main__':main()
