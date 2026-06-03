# -*- coding: utf-8 -*-
"""
make_assets.py —— 一键把一张原图处理成首页所需的两张素材：
  1) assets/person.png  : 抠图后的透明人像（前景，清晰）
  2) assets/hero.jpg    : 同一张照片的柔焦背景（背景，朦胧）
两者叠加 => 2.5D 景深 + 视差互动效果。

用法：
  python tools/make_assets.py                 # 自动在 assets/ 里找 original.*
  python tools/make_assets.py 我的照片.jpg     # 指定输入文件
  python tools/make_assets.py 照片.jpg 18      # 第二个参数 = 背景模糊半径(默认14)

依赖：pip install rembg onnxruntime pillow （已安装）
首次运行 rembg 会自动下载抠图模型(约170MB)，需要联网，请耐心等待。
"""
import os
import sys
import glob

from PIL import Image, ImageFilter, ImageEnhance

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, "..", "assets"))
EXTS = ("jpg", "jpeg", "png", "webp", "bmp")


def find_input():
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        return sys.argv[1]
    # 优先 original.*
    for ext in EXTS:
        for name in ("original." + ext, "original." + ext.upper()):
            p = os.path.join(ASSETS, name)
            if os.path.exists(p):
                return p
    # 退而求其次：assets 里任何不是输出文件的图片
    for p in glob.glob(os.path.join(ASSETS, "*")):
        b = os.path.basename(p).lower()
        if b.rsplit(".", 1)[-1] in EXTS and not b.startswith(("hero", "person", "avatar")):
            return p
    return None


def make_background(img, blur_radius):
    """生成 cover 到 1920x1080 的柔焦背景。"""
    tw, th = 1920, 1080
    scale = max(tw / img.width, th / img.height)
    big = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = (big.width - tw) // 2
    top = (big.height - th) // 2
    big = big.crop((left, top, left + tw, top + th))
    big = big.filter(ImageFilter.GaussianBlur(blur_radius))
    big = ImageEnhance.Brightness(big).enhance(0.90)   # 略压暗，衬托名片
    big = ImageEnhance.Color(big).enhance(1.05)        # 色彩稍微饱和一点
    out = os.path.join(ASSETS, "hero.jpg")
    big.convert("RGB").save(out, quality=86)
    return out


def make_cutout(src):
    """rembg 抠图，输出全画幅透明 PNG。"""
    from rembg import remove
    with open(src, "rb") as f:
        data = f.read()
    result = remove(data)  # bytes (PNG, RGBA)
    out = os.path.join(ASSETS, "person.png")
    with open(out, "wb") as f:
        f.write(result)
    return out


def main():
    src = find_input()
    if not src:
        print("[X] 没找到输入图片。请把你的照片放到 assets/ 文件夹"
              "（建议命名 original.jpg），或运行：python tools/make_assets.py 你的文件名")
        return 1

    print("[*] 输入照片：", src)
    img = Image.open(src).convert("RGB")

    blur = 14
    if len(sys.argv) > 2:
        try:
            blur = int(sys.argv[2])
        except ValueError:
            pass

    bg = make_background(img, blur)
    print("[OK] 背景已生成：", bg, "(模糊半径", blur, ")")

    try:
        cut = make_cutout(src)
        print("[OK] 人像抠图已生成：", cut)
    except Exception as e:
        print("[!] 抠图失败（可能是首次下载模型需要联网）:", repr(e))
        print("    背景已生成，可先用着；联网后重跑本脚本即可补上人像。")

    print("\n完成！刷新网页即可看到效果。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
