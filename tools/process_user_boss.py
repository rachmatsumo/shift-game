#!/usr/bin/env python3
"""
Convert user AI-generated boss image into a transparent RGBA game sprite.
- Cleans black background without dark halos.
- Preserves smooth outer nebula glows, stardust wisps, and neon highlights.
- Keeps interior dark carapace and mouth cavity 100% opaque.
"""
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

def process_boss(src_path, dst_path):
    orig = Image.open(src_path).convert('RGB')
    arr = np.array(orig, dtype=np.float32)
    h, w, _ = arr.shape
    max_c = np.max(arr, axis=2)

    # 1. Flood fill from 4 borders to identify exterior background
    # Any border-connected pixel with max_c < 8 is outer void
    is_outer_void = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if max_c[0, x] < 8 and not is_outer_void[0, x]:
            is_outer_void[0, x] = True; q.append((0, x))
        if max_c[h-1, x] < 8 and not is_outer_void[h-1, x]:
            is_outer_void[h-1, x] = True; q.append((h-1, x))
    for y in range(h):
        if max_c[y, 0] < 8 and not is_outer_void[y, 0]:
            is_outer_void[y, 0] = True; q.append((y, 0))
        if max_c[y, w-1] < 8 and not is_outer_void[y, w-1]:
            is_outer_void[y, w-1] = True; q.append((y, w-1))

    while q:
        y, x = q.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not is_outer_void[ny, nx] and max_c[ny, nx] < 8:
                    is_outer_void[ny, nx] = True
                    q.append((ny, nx))

    # 2. Build solid interior mask:
    # Any pixel not connected to outer void, OR with strong brightness (max_c >= 45)
    # is part of the creature.
    creature_mask = (~is_outer_void) | (max_c >= 8)

    # 3. Create alpha channel:
    # Outer black void: 0
    # Interior / solid body: 255
    # Outer glow / wisps: smooth transition based on brightness
    alpha = np.zeros((h, w), dtype=np.float32)
    
    # Interior solid pixels (not connected to outer void)
    alpha[~is_outer_void] = 255.0

    # For pixels that touch the outer boundary with subtle glow / stardust:
    # Use unmultiplied alpha formula for additive glows:
    # alpha = min(255, (max_c / 60.0)**0.85 * 255)
    glow_pixels = is_outer_void & (max_c >= 8)
    alpha[glow_pixels] = np.clip((max_c[glow_pixels] / 70.0) ** 0.85 * 255.0, 0, 255.0)

    # Also for pixels with max_c < 45 near the outer edge, allow a gentle feathering
    # to avoid hard jagged pixel steps
    rgb = np.copy(arr)
    
    # For semi-transparent pixels (0 < alpha < 255), unmultiply the color
    # so that when canvas blends source-over, the color isn't darkened by black
    semi = (alpha > 0) & (alpha < 255)
    a_norm = alpha[semi] / 255.0
    for c in range(3):
        rgb[semi, c] = np.clip(rgb[semi, c] / np.maximum(a_norm, 0.15), 0, 255)

    # Assemble RGBA
    out_arr = np.zeros((h, w, 4), dtype=np.uint8)
    out_arr[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out_arr[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)

    out_img = Image.fromarray(out_arr, mode='RGBA')

    # Find bounding box of non-zero alpha and crop tightly with 8px padding
    bbox = out_img.getbbox()
    if bbox:
        pad = 8
        crop_box = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad)
        )
        cropped = out_img.crop(crop_box)
        print(f"Original size: ({w}, {h}), Cropped size: {cropped.size}, Bbox: {bbox}")
        cropped.save(dst_path, "PNG", optimize=True)
        return crop_box, cropped.size
    else:
        out_img.save(dst_path, "PNG", optimize=True)
        return (0, 0, w, h), (w, h)

if __name__ == "__main__":
    src = "/home/abdul-rachmat/.gemini/antigravity/brain/5132f33e-3352-4ecd-bffe-93d56481061b/.user_uploaded/media_1795534433616_eb39620a.jpg"
    dst = "assets/boss_colossus.png"
    crop_box, size = process_boss(src, dst)
    print("Done processing boss sprite ->", dst, "Size:", size)
