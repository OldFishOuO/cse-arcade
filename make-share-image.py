#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
產生分享預覽圖 assets/og.png（1200×630）。

什麼時候要跑：
  改了 config.js 裡的 title / school / dept / tagline 之後。
  build-single-file.py 會自動呼叫它，所以平常不用單獨執行。

需要 Pillow：pip install pillow
沒裝也不會壞，只是不會更新圖片。
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "assets" / "og.png"

W, H = 1200, 630
BG = (6, 10, 15)
GRID = (12, 22, 30)
GREEN = (57, 255, 136)

# 依序嘗試，找得到哪個用哪個（不同電腦字型路徑不一樣）
FONT_MONO = ["C:/Windows/Fonts/consolab.ttf", "C:/Windows/Fonts/lucon.ttf"]
FONT_CJK_BOLD = ["C:/Windows/Fonts/msjhbd.ttc", "C:/Windows/Fonts/msyhbd.ttc",
                 "C:/Windows/Fonts/mingliub.ttc"]
FONT_CJK = ["C:/Windows/Fonts/msjh.ttc", "C:/Windows/Fonts/msyh.ttc",
            "C:/Windows/Fonts/mingliu.ttc"]


def read_config():
    txt = (ROOT / "assets" / "js" / "config.js").read_text(encoding="utf-8")
    cfg = {}
    for key in ("title", "school", "dept", "booth", "tagline", "siteUrl"):
        m = re.search(key + r"\s*:\s*'([^']*)'", txt)
        cfg[key] = m.group(1) if m else ""
    return cfg


def pick_font(candidates, size):
    from PIL import ImageFont
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def draw_grid(draw):
    for x in range(0, W, 34):
        draw.line([(x, 0), (x, H)], fill=GRID)
    for y in range(0, H, 34):
        draw.line([(0, y), (W, y)], fill=GRID)


def build(cfg):
    from PIL import Image, ImageDraw, ImageFilter, ImageChops

    f_title = pick_font(FONT_MONO, 116)
    f_tag = pick_font(FONT_CJK_BOLD, 40)
    f_small = pick_font(FONT_CJK, 30)

    # 1. 標題的螢光光暈：單獨畫一層、模糊、再用 screen 疊回底圖
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    ImageDraw.Draw(glow).text((84, 188), cfg["title"], font=f_title, fill=GREEN)
    glow = glow.filter(ImageFilter.GaussianBlur(22))

    img = Image.new("RGB", (W, H), BG)
    draw_grid(ImageDraw.Draw(img))
    img = ImageChops.screen(img, glow)

    # 2. 內容
    d = ImageDraw.Draw(img)
    d.text((84, 108), "%s　%s" % (cfg["school"], cfg["dept"]),
           font=f_small, fill=(120, 205, 158))
    d.text((84, 188), cfg["title"], font=f_title, fill=(238, 255, 242))

    d.rectangle([84, 344, 84 + 148, 350], fill=GREEN)

    d.text((84, 388), cfg["tagline"], font=f_tag, fill=(196, 214, 226))
    d.text((84, 486), "二進位 · 邏輯閘 · 抓 Bug · 排序 · 終端機打字 · 封包路由 · 迷思破解",
           font=f_small, fill=(104, 130, 150))

    url = cfg["siteUrl"].replace("https://", "").rstrip("/")
    if url:
        d.text((84, 540), url, font=pick_font(FONT_MONO, 26), fill=(70, 95, 112))

    # 3. 右側的裝飾性 0/1
    import random
    random.seed(1969)                      # 固定亂數，圖才不會每次都不一樣
    f_bit = pick_font(FONT_MONO, 22)
    for i in range(130):
        x = random.randint(860, W - 20)
        y = random.randint(20, H - 30)
        shade = random.randint(16, 46)
        d.text((x, y), random.choice("01"), font=f_bit, fill=(shade, shade + 42, shade + 20))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    return OUT


def main():
    try:
        import PIL  # noqa: F401
    except ImportError:
        print("（沒有 Pillow，跳過分享圖。要產生請執行：pip install pillow）")
        return 0
    cfg = read_config()
    out = build(cfg)
    print("分享預覽圖：%s（%.0f KB）" % (out.name, out.stat().st_size / 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
