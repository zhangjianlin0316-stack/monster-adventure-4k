# 用粗略标注作为种子，自动寻找眼睛高光 + 虹膜区域，得到精确的眼睛椭圆（归一化坐标）
import json, numpy as np
from PIL import Image
from scipy import ndimage as nd
E = json.load(open('tools/eyes.json')); OUT = {}
for s, eyes in E.items():
    im = np.asarray(Image.open(f'assets/{s}.webp').convert('RGBA')).astype(float); H, W = im.shape[:2]
    lum = im[..., 0] * .3 + im[..., 1] * .59 + im[..., 2] * .11; a = im[..., 3]
    mx = im[..., :3].max(-1); mn = im[..., :3].min(-1); sat = (mx - mn) / (mx + 1)
    res = []
    for (gx, gy, rw, rh) in eyes:
        cx, cy = gx / 10 * W, gy / 10 * H; ew, eh = rw * W, rh * H
        R = int(max(0.07 * W, 2.5 * max(ew, eh))); x0, x1 = max(0, int(cx - R)), min(W, int(cx + R)); y0, y1 = max(0, int(cy - R)), min(H, int(cy + R))
        L = lum[y0:y1, x0:x1]; A = a[y0:y1, x0:x1]; S = sat[y0:y1, x0:x1]
        hl = (L > 232) & (S < 0.18) & (A > 200)
        lab, n = nd.label(hl); best = None
        for i in range(1, n + 1):
            m = lab == i; area = m.sum()
            if area < 4 or area > (0.035 * W) ** 2: continue
            ys, xs = np.nonzero(m); bx, by = xs.mean() + x0, ys.mean() + y0
            ring = nd.binary_dilation(m, iterations=max(3, int(np.sqrt(area)))) & ~m
            rl = L[ring].mean() if ring.any() else 255
            d = np.hypot(bx - cx, by - cy) / R
            sc = (rl / 255) + d * 0.8
            if rl < 175 and (best is None or sc < best[0]): best = (sc, bx, by, m, rl)
        if not best: res.append([cx / W, cy / H, rw, rh, 0]); continue
        _, bx, by, m, rl = best
        thr = min(200, rl + 45)
        dark = ((L < thr) | m) & (A > 200)
        lab2, n2 = nd.label(dark); touch = nd.binary_dilation(m, iterations=2)
        ids = set(np.unique(lab2[touch])) - {0}
        if not ids: res.append([bx / W, by / H, rw, rh, 1]); continue
        comp = np.isin(lab2, list(ids)) | m
        ys, xs = np.nonzero(comp)
        ex0, ex1, ey0, ey1 = xs.min() + x0, xs.max() + x0, ys.min() + y0, ys.max() + y0
        w2, h2 = (ex1 - ex0) / 2, (ey1 - ey0) / 2
        ok = 0.35 * ew < w2 < 2.6 * ew + 6 and 0.35 * eh < h2 < 2.6 * eh + 6
        if ok: res.append([(ex0 + ex1) / 2 / W, (ey0 + ey1) / 2 / H, w2 / W, h2 / H, 2])
        else: res.append([bx / W, by / H + eh * 0.25 / H, rw, rh, 1])
    OUT[s] = [[round(v, 4) for v in r[:4]] + [r[4]] for r in res]
json.dump(OUT, open('tools/eyes_refined.json', 'w'), indent=0)
from collections import Counter; print(Counter(r[4] for v in OUT.values() for r in v))
