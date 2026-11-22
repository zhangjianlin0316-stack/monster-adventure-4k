# 从原画自动切分骨骼部件：按骨骼胶囊体最近距离分配像素 + 关节重叠帽 + 被遮挡区域补色 → 图集 + 骨骼数据
import json, sys, os, numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
ROOT = '/workspace/mg-repo'
RIGS = {}
import glob
for fn in sorted(glob.glob(os.path.join(os.path.dirname(__file__), 'rigs_*.json'))): RIGS.update(json.load(open(fn)))
DEF_R = dict(body=1.2, head=1.4, leg=0.22, tail=0.35, wing=0.3, arm=0.22, spine=0.55, tent=0.12, ear=0.2, extra=0.3)
CAP = dict(head=0.55, leg=0.32, tail=0.38, wing=0.4, arm=0.32, spine=0.5, tent=0.2, ear=0.2, extra=0.3)
CLOSE = dict(body=0.9, head=0.5, leg=0.2, tail=0.4, wing=0.4, arm=0.2, spine=0.5, tent=0.12, ear=0.15, extra=0.3)

def segdist(X, Y, a, b):
    ax, ay = a; bx, by = b; dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy + 1e-9
    t = np.clip(((X - ax) * dx + (Y - ay) * dy) / L2, 0, 1)
    return np.hypot(X - (ax + t * dx), Y - (ay + t * dy))

def bones_of(R):
    """返回骨骼列表：name, parent, pivot(grid), seg(a,b) 用于分配像素, kind, r"""
    B = []; face = R.get('face', -1)
    def add(n, p, piv, a, b, kind, r=None, **kw):
        d = dict(n=n, p=p, piv=piv, a=a, b=b, kind=kind, r=r if r is not None else DEF_R[kind]); d.update(kw); B.append(d)
    if 'spine' in R:
        S = R['spine']; c = R.get('core', len(S) // 2); rs = R.get('spineR', DEF_R['spine'])
        rs = rs if isinstance(rs, list) else [rs] * (len(S) - 1)
        # 核心段
        add('body', None, [(S[c][0] + S[c + 1][0]) / 2, (S[c][1] + S[c + 1][1]) / 2], S[c], S[c + 1], 'spine', rs[c], own=True)
        prev = 'body'
        for i in range(c + 1, len(S) - 1): add('sp%d' % i, prev, S[i], S[i], S[i + 1], 'spine', rs[i], ch='t', idx=i - c); prev = 'sp%d' % i
        prev = 'body'
        for i in range(c - 1, -1, -1): add('sp%d' % i, prev, S[i + 1], S[i], S[i + 1], 'spine', rs[i], ch='h', idx=c - i); prev = 'sp%d' % i
        headParent = 'sp0' if c > 0 else 'body'
    else:
        b = R['body']; add('body', None, [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2], b[0], b[1], 'body', b[2] if len(b) > 2 else None)
        headParent = 'body'
    if 'head' in R:
        h = R['head']; add('head', headParent, h[0], h[0], h[1], 'head', h[2] if len(h) > 2 else None)
    for key, kind in (('legs', 'leg'), ('arms', 'arm')):
        for side, P in R.get(key, {}).items():
            r = P[3] if len(P) > 3 else None
            add(side + '_u', 'body', P[0], P[0], P[1], kind, r, side=side); add(side + '_l', side + '_u', P[1], P[1], P[2], kind, r, side=side)
    if 'tail' in R:
        T = R['tail']; tr = R.get('tailR', DEF_R['tail']); tr = tr if isinstance(tr, list) else [tr] * (len(T) - 1); prev = R.get('tailParent', 'body')
        for i in range(len(T) - 1): add('tail%d' % i, prev, T[i], T[i], T[i + 1], 'tail', tr[i], idx=i); prev = 'tail%d' % i
    for ci, T in enumerate(R.get('tails', [])):
        tr = R.get('tailsR', [0.6] * 9)[ci] if 'tailsR' in R else 0.6; nm = 'tail' + 'BCDEFG'[ci]
        prev = R.get('tailParent', 'body')
        if isinstance(T, dict): prev = T.get('p', prev); tr = T.get('r', tr); T = T['pts']
        for i in range(len(T) - 1): add('%s%d' % (nm, i), prev, T[i], T[i], T[i + 1], 'tail', tr, idx=i); prev = '%s%d' % (nm, i)
    for side, P in R.get('wings', {}).items():
        r = P[3] if len(P) > 3 else None; wp = R.get('wingParent', 'body')
        add('w' + side + '0', wp, P[0], P[0], P[1], 'wing', r, side=side); add('w' + side + '1', 'w' + side + '0', P[1], P[1], P[2], 'wing', r, side=side)
    for i, P in enumerate(R.get('tents', [])):
        prev = R.get('tentParent', 'body')
        for j in range(len(P) - 1): add('t%d_%d' % (i, j), prev, P[j], P[j], P[j + 1], 'tent', R.get('tentR'), idx=j, tn=i); prev = 't%d_%d' % (i, j)
    for i, E in enumerate(R.get('ears', [])):
        add('ear%d' % i, 'head', E[0], E[0], E[1], 'ear', E[2] if len(E) > 2 else None, idx=i)
    for E in R.get('props', []):
        add(E['n'], E.get('p', 'body'), E['a'], E['a'], E['b'], 'extra', E.get('r', 0.25))
    for i, E in enumerate(R.get('extras', [])):
        add(E['n'], E.get('p', 'body'), E['a'], E['a'], E['b'], 'extra', E.get('r'))
    return B

def default_z(R, B):
    names = [b['n'] for b in B]; z = []
    far = lambda n: n.startswith(('FF', 'BF', 'AF', 'wF', 'LF')) or n.startswith('F_') and False
    z += [n for n in names if n[:2] in ('wF', 'wC')]
    if R.get('wingsBack'): z += [n for n in names if n[:2] in ('wN', 'wB')]
    z += [n for n in names if n[:2] in ('BF', 'FF', 'AF', 'LF')]
    z += [n for n in names if n.startswith('tail')] if not R.get('tailFront') else []
    z += [n for n in names if n.startswith('t') and '_' in n and not n.startswith('tail')]
    z += [n for n in names if n.startswith('sp') and B[names.index(n)].get('ch') == 't'][::-1]
    z += ['body']
    z += [n for n in names if n.startswith('sp') and B[names.index(n)].get('ch') == 'h']
    z += [n for n in names if n[:2] in ('BN', 'FN', 'LN')]
    z += [n for n in names if n.startswith('tail')] if R.get('tailFront') else []
    z += [n for n in names if n.startswith('ear')]
    z += ['head'] if 'head' in names else []
    z += [n for n in names if n[:2] in ('AN',)]
    z += [n for n in names if n[:2] in ('wN', 'wB') and n not in z]
    z += [n for n in names if n not in z]
    if 'z' in R:  # 覆盖：列出的部件按给定顺序，其他保持
        rest = [n for n in z if n not in R['z']]; z = R['z'] + rest if R.get('zFirst') else [n for n in z if n not in R['z']] and _merge(z, R['z'])
    return z

def _merge(z, order):
    # 把 order 中的元素按 order 相对顺序重排在它们原来占据的位置上
    pos = sorted(z.index(n) for n in order if n in z); out = list(z)
    for p, n in zip(pos, [n for n in order if n in z]): out[p] = n
    return out

def build(sp, R, outdir, dbg=None):
    im = np.array(Image.open(f'{ROOT}/assets/{sp}.webp').convert('RGBA')).astype(np.float32)
    H, W = im.shape[:2]; gx, gy = W / 10, H / 10; G = (gx + gy) / 2
    A = im[..., 3]; opaque = A > 6
    B = bones_of(R); n = len(B)
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    D = np.full((n, H, W), 1e9, np.float32)
    for i, b in enumerate(B):
        a = (b['a'][0] * gx, b['a'][1] * gy); e = (b['b'][0] * gx, b['b'][1] * gy)
        D[i] = segdist(X, Y, a, e) - b['r'] * G
    # 全局所有者（身体/头部 own 区域优先）
    asg = np.argmin(D, 0)
    names = [b['n'] for b in B]; idx = {nm: i for i, nm in enumerate(names)}
    # 连通性修正：每个部件只保留与其骨骼相连的最大连通块，其余碎块并回第二近的骨骼
    for it in range(2):
        for i, b in enumerate(B):
            m = (asg == i) & opaque
            if not m.any(): continue
            lab, k = ndi.label(m)
            if k <= 1: continue
            # 骨骼线经过的连通块
            seg = np.zeros_like(m); p0 = np.array([b['a'][0] * gx, b['a'][1] * gy]); p1 = np.array([b['b'][0] * gx, b['b'][1] * gy])
            keep = set()
            for t in np.linspace(0, 1, 40):
                q = p0 + (p1 - p0) * t; xi, yi = int(np.clip(q[0], 0, W - 1)), int(np.clip(q[1], 0, H - 1))
                if lab[yi, xi]: keep.add(lab[yi, xi])
            if not keep: sizes = ndi.sum(m, lab, range(1, k + 1)); keep = {int(np.argmax(sizes)) + 1}
            bad = m & ~np.isin(lab, list(keep))
            if bad.any():
                D2 = D.copy(); D2[i][bad] = 1e9
                asg[bad] = np.argmin(D2[:, bad], 0)
    parts = []; layers = {}
    rgb = im[..., :3]
    # 预先把原画 RGB 向外扩展（避免补色时混入黑边）
    for i, b in enumerate(B):
        own = (asg == i) & opaque
        m = own.astype(np.float32)
        if b['p'] is not None:  # 关节帽：父骨骼区域内、枢轴附近的像素也带上（重叠，防止转动时出现缝）
            pv = (b['piv'][0] * gx, b['piv'][1] * gy); cr = CAP[b['kind']] * G * b.get('capK', 1)
            d = np.hypot(X - pv[0], Y - pv[1]); cap = np.clip((cr - d) / (cr * 0.35), 0, 1) * opaque
            par = idx[b['p']]; cap *= ((asg == par) | own)
            m = np.maximum(m, cap)
        # 补洞：被其他部件遮挡的区域（形态闭运算 ∩ 原画不透明 ∩ 不属于自己）
        ck = max(3, int(CLOSE[b['kind']] * G) | 1)
        cl = cv2.morphologyEx(own.astype(np.uint8), cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (ck, ck))) > 0
        hole = cl & (A > 100) & (m < 0.5)
        if b['kind'] in ('body', 'spine'):
            hole |= (A > 100) & (m < 0.5) & ndi.binary_fill_holes(cl)
        # 子部件根部下方也补色：转动子部件（头/腿/尾）时露出的是“身体”而不是空洞
        ext = dict(body=0.75, spine=0.55, head=0.3, leg=0.15, arm=0.18, tail=0.25, wing=0.25).get(b['kind'], 0.15)
        kids = [j for j, c in enumerate(B) if c['p'] == b['n']]
        if kids:
            kd = np.zeros_like(own)
            for j in kids: kd |= (asg == j)
            ek = max(3, int(ext * G) | 1)
            hole |= cv2.dilate(own.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (ek, ek))) .astype(bool) & kd & (A > 100) & (m < 0.5)
        layer = np.zeros((H, W, 4), np.float32)
        mf = cv2.GaussianBlur(m, (0, 0), 0.9)
        mf = np.maximum(mf * (m > 0.02), m)
        layer[..., 3] = A * np.clip(mf, 0, 1)
        layer[..., :3] = rgb
        if hole.any():
            src = own & (A > 100)
            if src.any():
                _, (iy, ix) = ndi.distance_transform_edt(~src, return_indices=True)
                fill = rgb[iy, ix]
                fill = cv2.GaussianBlur(fill, (0, 0), max(2, G * 0.06))
                # 稍微压暗，看起来像被遮住的阴影面
                fill *= 0.9
                hw = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 1.2)
                hw = np.maximum(hw * (hole | (m < 0.5)), 0)
                newA = np.maximum(layer[..., 3], A * np.clip(hw, 0, 1))
                k = np.clip(hw, 0, 1)[..., None] * (1 - np.clip(mf, 0, 1)[..., None])
                layer[..., :3] = rgb * (1 - k) + fill * k
                layer[..., 3] = newA
        layers[b['n']] = layer
    # 打包图集
    crops = []
    for i, b in enumerate(B):
        L = layers[b['n']]; ys, xs = np.where(L[..., 3] > 3)
        if len(xs) == 0: crops.append(None); continue
        x0, x1, y0, y1 = max(0, xs.min() - 2), min(W, xs.max() + 3), max(0, ys.min() - 2), min(H, ys.max() + 3)
        crops.append((int(x0), int(y0), int(x1 - x0), int(y1 - y0)))
    order = sorted([i for i in range(n) if crops[i]], key=lambda i: -crops[i][3])
    AW = 2048 if W + H > 1500 else 1536; x = y = rowh = 0; place = {}
    for i in order:
        w, h = crops[i][2], crops[i][3]
        if x + w > AW: x = 0; y += rowh + 2; rowh = 0
        place[i] = (x, y); x += w + 2; rowh = max(rowh, h)
    AH = y + rowh
    atlas = np.zeros((AH, AW, 4), np.float32)
    for i in order:
        cx, cy, w, h = crops[i]; px, py = place[i]
        atlas[py:py + h, px:px + w] = layers[B[i]['n']][cy:cy + h, cx:cx + w]
    a8 = np.clip(atlas, 0, 255).astype(np.uint8)
    os.makedirs(outdir, exist_ok=True)
    Image.fromarray(a8, 'RGBA').save(f'{outdir}/{sp}.webp', quality=88, method=5)
    z = default_z(R, B)
    tot = max(1, int(opaque.sum())); hf = float(((asg == idx['head']) & opaque).sum()) / tot if 'head' in idx else 0
    out = dict(w=W, h=H, hf=round(hf, 3), type=R['type'], face=R.get('face', -1), aw=AW, ah=AH,
               bones=[dict(n=b['n'], p=b['p'], x=round(b['piv'][0] * gx, 1), y=round(b['piv'][1] * gy, 1),
                           ex=round(b['b'][0] * gx, 1), ey=round(b['b'][1] * gy, 1), k=b['kind'],
                           **{kk: b[kk] for kk in ('side', 'idx', 'ch', 'tn') if kk in b}) for b in B],
               parts=[dict(b=B[i]['n'], sx=place[i][0], sy=place[i][1], w=crops[i][2], h=crops[i][3], x=crops[i][0], y=crops[i][1]) for i in sorted(order, key=lambda i: z.index(B[i]['n']))])
    if R.get('lidBone'): out.setdefault('opts', {})
    for k in ('opts',):
        if k in R: out[k] = R[k]
    if dbg is not None:
        pal = np.array([[230, 60, 60], [60, 160, 230], [80, 200, 90], [230, 200, 40], [200, 80, 220], [40, 220, 220], [250, 140, 40], [140, 90, 40], [255, 120, 180], [120, 120, 255], [160, 230, 120], [90, 90, 90], [255, 255, 255], [0, 120, 80], [130, 0, 0], [0, 0, 130], [200, 200, 120], [100, 30, 160]] * 3, np.float32)
        col = pal[asg] * 0.55 + rgb * 0.45
        o = np.dstack([col, A]).clip(0, 255).astype(np.uint8)
        img = Image.fromarray(o, 'RGBA'); bg = Image.new('RGBA', img.size, (255, 255, 255, 255)); bg.alpha_composite(img)
        d = cv2.cvtColor(np.array(bg.convert('RGB')), cv2.COLOR_RGB2BGR)
        for b in B:
            p0 = (int(b['a'][0] * gx), int(b['a'][1] * gy)); p1 = (int(b['b'][0] * gx), int(b['b'][1] * gy))
            cv2.line(d, p0, p1, (0, 0, 0), 3); cv2.circle(d, (int(b['piv'][0] * gx), int(b['piv'][1] * gy)), 7, (0, 0, 255), -1)
            cv2.putText(d, b['n'], p1, cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
        cv2.imwrite(dbg, d)
    return out

if __name__ == '__main__':
    only = sys.argv[1:]
    outdir = f'{ROOT}/assets/rig'; dbgdir = '/tmp/rigdbg'; os.makedirs(dbgdir, exist_ok=True)
    dbfile = f'{ROOT}/tools/rig/built.json'
    allout = json.load(open(dbfile)) if os.path.exists(dbfile) else {}
    for sp, R in RIGS.items():
        if sp.startswith('_') or (only and sp not in only): continue
        allout[sp] = build(sp, R, outdir, f'{dbgdir}/{sp}.jpg'); print('ok', sp, len(allout[sp]['parts']))
    allout = {k: v for k, v in allout.items() if k in RIGS}
    json.dump(allout, open(dbfile, 'w'))
    with open(f'{ROOT}/js/rigs.js', 'w') as f:
        f.write('// 自动生成（tools/rig/build.py）：每只灵兽的骨骼与部件图集\nconst RIGS = ' + json.dumps(allout, separators=(',', ':')) + ';\n')
