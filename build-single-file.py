#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
做兩件事：

1. 在 index.html 的 CSS / JS 連結後面蓋上版本章（?v=雜湊值）
   → 只要內容有改，網址就跟著變，瀏覽器一定會重新抓，
     不會因為快取而看到舊的文字。（GitHub Pages 的快取是 10 分鐘）

2. 把 index.html + CSS + 全部 JS 打包成「一個 .html 檔」
   → 攤位現場最保險的版本。一個檔案，沒有相對路徑，
     雙擊、丟 USB、用 LINE 傳都不會壞。

用法：
  python build-single-file.py

產出：
  index.html                  （就地更新版本章）
  iecs-arcade-standalone.html  （單檔版，可直接雙擊）
"""

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "index.html"
OUT = ROOT / "iecs-arcade-standalone.html"   # 刻意用英文檔名：USB、Email、不同語系電腦都不會亂碼

# 比對 index.html 裡指向 assets/ 的 src= 或 href=
ASSET_REF = re.compile(r'(?P<attr>src|href)="(?P<path>assets/[^"?]+)(?:\?[^"]*)?"')


def read(path: Path) -> str:
    if not path.is_file():
        sys.exit("找不到檔案：%s" % path)
    return path.read_text(encoding="utf-8")


def protect(code: str) -> str:
    """避免內容裡的結束標籤提早關掉 <script> / <style>。"""
    return code.replace("</script", "<\\/script").replace("</style", "<\\/style")


def asset_paths(html: str):
    """index.html 參照到的所有 assets/ 檔案，依出現順序、不重複。"""
    seen, out = set(), []
    for m in ASSET_REF.finditer(html):
        p = m.group("path")
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def stamp_version(html: str, paths) -> tuple:
    """用所有資產的內容算出一個短雜湊，蓋在每個連結後面。"""
    h = hashlib.sha1()
    for p in paths:
        h.update((ROOT / p).read_bytes())
    version = h.hexdigest()[:8]

    def sub(m: re.Match) -> str:
        return '%s="%s?v=%s"' % (m.group("attr"), m.group("path"), version)

    return ASSET_REF.sub(sub, html), version


def main() -> None:
    html = read(SRC)
    paths = asset_paths(html)
    if not paths:
        sys.exit("index.html 裡找不到任何 assets/ 連結，請檢查檔案是不是被改壞了。")

    for p in paths:
        if not (ROOT / p).is_file():
            sys.exit("index.html 參照到不存在的檔案：%s" % p)

    # ---- 1. 蓋版本章，就地更新 index.html ----
    stamped, version = stamp_version(html, paths)

    # 把版本也寫進 <html data-build="...">，讓網頁能自己發現有新版。
    # （GitHub Pages 連 index.html 都會被快取 10 分鐘，光靠 ?v= 擋不住）
    stamped = re.sub(r'\sdata-build="[^"]*"', "", stamped, count=1)
    stamped = stamped.replace("<html ", '<html data-build="%s" ' % version, 1)

    if stamped != html:
        SRC.write_text(stamped, encoding="utf-8")
        print("index.html 版本章已更新為 %s" % version)
    else:
        print("index.html 版本章不變（%s）" % version)

    # 網頁會定期抓這個檔比對版本，發現不一樣就自己重新整理
    (ROOT / "version.json").write_text(
        '{"v": "%s"}\n' % version, encoding="utf-8"
    )

    # ---- 2. 打包單檔版 ----
    inlined = []

    def css_sub(m: re.Match) -> str:
        href = m.group(1).split("?")[0]
        inlined.append(href)
        return "<style>\n/* ===== %s ===== */\n%s\n</style>" % (href, protect(read(ROOT / href)))

    bundle = re.sub(r'<link\s+rel="stylesheet"\s+href="([^"]+)"\s*>', css_sub, stamped)

    def js_sub(m: re.Match) -> str:
        src = m.group(1).split("?")[0]
        inlined.append(src)
        return "<script>\n/* ===== %s ===== */\n%s\n</script>" % (src, protect(read(ROOT / src)))

    bundle = re.sub(r'<script\s+src="([^"]+)"\s*></script>', js_sub, bundle)

    bundle = bundle.replace(
        "<head>",
        "<head>\n<!-- 自動打包的單檔版（build %s）。要改內容請改 assets/ 底下的原始碼，"
        "再重新執行 build-single-file.py，不要直接改這個檔。 -->" % version,
        1,
    )

    leftovers = sorted(set(re.findall(r'(?:src|href)="(assets/[^"]+)"', bundle)))
    OUT.write_text(bundle, encoding="utf-8")

    print("已內嵌 %d 個檔案" % len(inlined))
    print("產出：%s（%.1f KB）" % (OUT.name, OUT.stat().st_size / 1024))

    if leftovers:
        print("\n[!] 還有沒內嵌到的外部檔案，單檔版可能不完整：")
        for f in leftovers:
            print("   -", f)
        sys.exit(1)
    print("單檔版沒有殘留的外部相依，可以單獨使用。")


if __name__ == "__main__":
    main()
