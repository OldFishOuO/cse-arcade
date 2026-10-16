#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 index.html + CSS + 全部 JS 打包成「一個 .html 檔」。

用途：
  攤位現場最保險的版本。一個檔案，沒有相對路徑，
  雙擊、丟 USB、用 LINE 傳、在任何預覽視窗打開都不會壞。

用法：
  python build-single-file.py

產出：
  cse-arcade-standalone.html（單檔版，可直接雙擊）
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "index.html"
OUT = ROOT / "cse-arcade-standalone.html"   # 刻意用英文檔名：USB、Email、不同語系電腦都不會亂碼


def read(path: Path) -> str:
    if not path.is_file():
        sys.exit(f"找不到檔案：{path}")
    return path.read_text(encoding="utf-8")


def protect(code: str) -> str:
    """避免內容裡的結束標籤提早關掉 <script> / <style>。"""
    return code.replace("</script", "<\\/script").replace("</style", "<\\/style")


def main() -> None:
    html = read(SRC)
    inlined = []

    def css_sub(m: re.Match) -> str:
        href = m.group(1)
        path = ROOT / href
        inlined.append(href)
        return "<style>\n/* ===== %s ===== */\n%s\n</style>" % (href, protect(read(path)))

    html = re.sub(
        r'<link\s+rel="stylesheet"\s+href="([^"]+)"\s*>',
        css_sub,
        html,
    )

    def js_sub(m: re.Match) -> str:
        src = m.group(1)
        path = ROOT / src
        inlined.append(src)
        return "<script>\n/* ===== %s ===== */\n%s\n</script>" % (src, protect(read(path)))

    html = re.sub(
        r'<script\s+src="([^"]+)"\s*></script>',
        js_sub,
        html,
    )

    # 留一個標記，方便日後辨認這是打包版
    html = html.replace(
        "<head>",
        "<head>\n<!-- 這是自動打包的單檔版本。要改內容請改原始碼後重新執行 "
        "build-single-file.py，不要直接改這個檔。 -->",
        1,
    )

    leftovers = re.findall(r'(?:src|href)="(assets/[^"]+)"', html)
    OUT.write_text(html, encoding="utf-8")

    print("已內嵌 %d 個檔案：" % len(inlined))
    for f in inlined:
        print("  -", f)
    print()
    print("產出：%s（%.1f KB）" % (OUT.name, OUT.stat().st_size / 1024))
    if leftovers:
        print("\n⚠ 還有沒內嵌到的外部檔案，單檔版可能不完整：")
        for f in sorted(set(leftovers)):
            print("  -", f)
        sys.exit(1)
    print("沒有殘留的外部相依，這個檔案可以單獨使用。")


if __name__ == "__main__":
    main()
