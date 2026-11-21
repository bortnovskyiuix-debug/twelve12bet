"""Re-shape the phone table artwork without redrawing it.

  python3 tools/table_tilt.py SRC.png OUT.webp TILT

TILT 1.0 = the artwork exactly as drawn (narrow top, strong taper); 0.0 = straight vertical sides (no taper),
same width and height. Anything between (or beyond) is a milder / stronger taper. Every image row is
scaled sideways around the centre so that the rail lands on the new outline; texture, gloss and facets are kept.
"""
import sys
import numpy as np
from PIL import Image

src, out, tilt = sys.argv[1], sys.argv[2], float(sys.argv[3])
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(np.float32); H, W, _ = a.shape
tbl = ((a[..., 2] - a[..., 0] > 45) & (a[..., 1] > 40))           # table pixels (blue), background is violet
ys = np.where(tbl.any(1))[0]; y0, y1 = ys.min(), ys.max()
xs = np.where(tbl.any(0))[0]; cx = (xs.min() + xs.max()) / 2.0; half = (xs.max() - xs.min() + 1) / 2.0
hw_art = np.array([ (np.where(r)[0].max() - np.where(r)[0].min() + 1) / 2.0 if r.any() else 0.0 for r in tbl ])
# the artwork's slanted side is a straight line; fit it on the middle of the table and extend it over every row
ym = np.arange(y0 + int((y1 - y0) * .25), y0 + int((y1 - y0) * .6)); slope, icpt = np.polyfit(ym, hw_art[ym], 1)
yy = np.arange(H, dtype=np.float32); side = np.minimum(slope * yy + icpt, half)       # never wider than the widest row
# tilt 0 makes that side vertical (every row as wide as the widest); tilt 1 leaves the artwork untouched
s = (1 + (1 - tilt) * (half / side - 1)).astype(np.float32)
k = 25; ker = np.exp(-0.5 * (np.arange(-3 * k, 3 * k + 1) / k) ** 2); ker /= ker.sum()
s = np.convolve(np.pad(s, 3 * k, mode='edge'), ker, mode='valid'); s = np.clip(s, 0.6, 2.4)
# inverse map: output x takes source x = cx + (x - cx) / s(y), bilinear
xo = np.arange(W, dtype=np.float32)[None, :]; sx = cx + (xo - cx) / s[:, None]; sx = np.clip(sx, 0, W - 1.001)
x0i = np.floor(sx).astype(np.int32); f = (sx - x0i)[..., None]; rows = np.arange(H)[:, None]
res = a[rows, x0i] * (1 - f) + a[rows, x0i + 1] * f
Image.fromarray(np.clip(res + .5, 0, 255).astype(np.uint8)).save(out, 'WEBP', quality=93, method=6)
m2 = ((res[..., 2] - res[..., 0] > 45) & (res[..., 1] > 40)); x2 = np.where(m2.any(0))[0]; yq = y0 + int((y1 - y0) * .12)
print('rail box x', x2.min(), x2.max(), 'y', y0, y1, '| top width at 12%%: %.0f%% of max' % (100 * (np.where(m2[yq])[0].max() - np.where(m2[yq])[0].min()) / (x2.max() - x2.min())))
