import pathlib
import fontTools.misc.textTools as tt

_tostr = tt.tostr


def tostr(s, encoding="ascii", errors="strict"):
    try:
        return _tostr(s, encoding, errors)
    except UnicodeDecodeError:
        return _tostr(s, "utf-8", errors)


tt.tostr = tostr
import fontTools.cffLib as cffLib

cffLib.tostr = tostr
from fontTools.ttLib import TTFont

SRC = pathlib.Path("assets-src/fonts")
OUT = pathlib.Path("public/fonts")
OUT.mkdir(parents=True, exist_ok=True)

WANT = {
    "GamtanRoad Dotum-OTF/감탄로드돋움체 Regular.otf": ("gamtan-dotum-400.woff2", "GamtanRoadDotum-Regular"),
    "GamtanRoad Dotum-OTF/감탄로드돋움체 Bold.otf": ("gamtan-dotum-700.woff2", "GamtanRoadDotum-Bold"),
    "GamtanRoad Batang-OTF/감탄로드바탕체 Regular.otf": ("gamtan-batang-400.woff2", "GamtanRoadBatang-Regular"),
    "GamtanRoad Tantan-OTF/감탄로드탄탄체.otf": ("gamtan-tantan-400.woff2", "GamtanRoadTantan-Regular"),
    "Montserrat/Montserrat-VariableFont_wght.ttf": ("montserrat-var.woff2", "Montserrat"),
    "nt_epika/NT Epika Regular (PERSONAL USE).otf": ("epika-400.woff2", "NTEpika-Regular"),
    "nt_epika/NT Epika Bold (PERSONAL USE).otf": ("epika-700.woff2", "NTEpika-Bold"),
}

for rel, (name, ps) in WANT.items():
    src = SRC / rel
    font = TTFont(str(src))

    if "CFF " in font:
        font["CFF "].cff.fontNames = [ps]
    font["name"].names.sort(key=lambda r: (r.platformID, r.platEncID, r.langID, r.nameID))

    font.flavor = "woff2"
    font.save(str(OUT / name))
    before = src.stat().st_size / 1024
    after = (OUT / name).stat().st_size / 1024
    print(f"{name:26} {before:7.0f}KB → {after:6.0f}KB  {100 - after / before * 100:3.0f}% 절감")
