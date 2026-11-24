import os
import math
from PIL import Image, ImageDraw

def create_svg():
    # 512x512 SVG with rounded background and balanced agricultural-academic symbol
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#144A36" />
      <stop offset="100%" stop-color="#0E2D22" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#B28A38" />
      <stop offset="100%" stop-color="#D9AB4A" />
    </linearGradient>
    <linearGradient id="ivoryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#EAEFE8" />
    </linearGradient>
  </defs>

  <!-- Deep Green Rounded Tile -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect x="12" y="12" width="488" height="488" rx="100" fill="none" stroke="#1D684D" stroke-width="4" opacity="0.6" />

  <!-- Academic Foundation: Open Book Geometry -->
  <g id="academic-book">
    <!-- Left Page -->
    <path d="M 256 360 C 215 352 165 364 120 382 C 128 322 178 300 256 312 Z" 
          fill="url(#ivoryGrad)" opacity="0.95" />
    <!-- Right Page -->
    <path d="M 256 360 C 297 352 347 364 392 382 C 384 322 334 300 256 312 Z" 
          fill="url(#ivoryGrad)" opacity="0.95" />
    <!-- Book Spine Rib -->
    <path d="M 254 308 L 258 308 L 258 376 L 254 376 Z" fill="#0E2D22" opacity="0.4" />
  </g>

  <!-- Agricultural Sprouts & Grain Symmetry -->
  <g id="growth-leaves">
    <!-- Left Leaf (Flourishing Green / Ivory) -->
    <path d="M 256 295 C 190 295 138 238 152 165 C 205 165 250 215 256 295 Z" 
          fill="url(#ivoryGrad)" opacity="0.92" />
    
    <!-- Right Leaf (Achievement Gold) -->
    <path d="M 256 295 C 322 295 374 238 360 165 C 307 165 262 215 256 295 Z" 
          fill="url(#goldGrad)" />

    <!-- Center Upward Growth Stalk / Achievement Shoot -->
    <path d="M 256 305 C 251 250 250 190 256 120 C 262 190 261 250 256 305 Z" 
          fill="#FFFFFF" />

    <!-- Academic Star / Summit Diamond at the Top -->
    <path d="M 256 90 L 268 115 L 256 138 L 244 115 Z" 
          fill="url(#goldGrad)" />
  </g>
</svg>
'''
    return svg_content

def create_favicon_svg():
    # Streamlined favicon SVG for maximum clarity at 16-32px
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
  <rect width="64" height="64" rx="14" fill="#103B2D" />
  <!-- Academic Open Book Base -->
  <path d="M 32 46 C 26 44 20 46 14 49 C 16 41 22 38 32 40 Z" fill="#F8F8F4" />
  <path d="M 32 46 C 38 44 44 46 50 49 C 48 41 42 38 32 40 Z" fill="#F8F8F4" />
  <!-- Agricultural Twin Leaves -->
  <path d="M 32 38 C 22 38 17 30 19 21 C 26 21 31 27 32 38 Z" fill="#F8F8F4" />
  <path d="M 32 38 C 42 38 47 30 45 21 C 38 21 33 27 32 38 Z" fill="#D9AB4A" />
  <!-- Apex Diamond -->
  <polygon points="32,10 35,15 32,20 29,15" fill="#D9AB4A" />
</svg>
'''
    return svg_content

def render_pillow_assets():
    # Render with 4x supersampling (2048x2048) and scale down with Lanczos for ultra-crisp edges
    SS = 4
    canvas_size = 512 * SS
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Colors
    c_bg = (16, 59, 45, 255) # #103B2D
    c_border = (23, 107, 69, 180) # #176B45
    c_ivory = (248, 248, 244, 255) # #F8F8F4
    c_gold = (197, 155, 63, 255) # #C59B3F / #B28A38
    c_gold_light = (220, 180, 85, 255)
    c_white = (255, 255, 255, 255)

    # Draw rounded background
    radius = 112 * SS
    draw.rounded_rectangle([0, 0, canvas_size, canvas_size], radius=radius, fill=c_bg)
    draw.rounded_rectangle([12 * SS, 12 * SS, canvas_size - 12 * SS, canvas_size - 12 * SS], 
                           radius=100 * SS, outline=c_border, width=4 * SS)

    # Academic Open Book Base
    # Left page
    left_book = []
    for t in range(50):
        # top curve from (256, 312) to (120, 382)
        ratio = t / 49.0
        x = 256 - ratio * 136
        y = 312 + ratio * 50 + math.sin(ratio * math.pi) * 16
        left_book.append((x * SS, y * SS))
    for t in range(50):
        # bottom curve back to (256, 360)
        ratio = t / 49.0
        x = 120 + ratio * 136
        y = 382 - ratio * 20 - math.sin(ratio * math.pi) * 8
        left_book.append((x * SS, y * SS))
    draw.polygon(left_book, fill=c_ivory)

    # Right page
    right_book = []
    for t in range(50):
        ratio = t / 49.0
        x = 256 + ratio * 136
        y = 312 + ratio * 50 + math.sin(ratio * math.pi) * 16
        right_book.append((x * SS, y * SS))
    for t in range(50):
        ratio = t / 49.0
        x = 392 - ratio * 136
        y = 382 - ratio * 20 - math.sin(ratio * math.pi) * 8
        right_book.append((x * SS, y * SS))
    draw.polygon(right_book, fill=c_ivory)

    # Leaves
    # Left leaf (Ivory)
    left_leaf = []
    for t in range(60):
        ratio = t / 59.0
        # Outer curve from (256, 295) out to (152, 165)
        x = 256 - math.sin(ratio * math.pi * 0.7) * 115 - ratio * 10
        y = 295 - ratio * 130
        left_leaf.append((x * SS, y * SS))
    for t in range(60):
        ratio = t / 59.0
        # Inner curve back from (152, 165) to (256, 295)
        x = 152 + ratio * 104 - math.sin(ratio * math.pi) * 20
        y = 165 + ratio * 130
        left_leaf.append((x * SS, y * SS))
    draw.polygon(left_leaf, fill=c_ivory)

    # Right leaf (Gold)
    right_leaf = []
    for t in range(60):
        ratio = t / 59.0
        x = 256 + math.sin(ratio * math.pi * 0.7) * 115 + ratio * 10
        y = 295 - ratio * 130
        right_leaf.append((x * SS, y * SS))
    for t in range(60):
        ratio = t / 59.0
        x = 360 - ratio * 104 + math.sin(ratio * math.pi) * 20
        y = 165 + ratio * 130
        right_leaf.append((x * SS, y * SS))
    draw.polygon(right_leaf, fill=c_gold)

    # Center Shoot
    shoot = [
        (253 * SS, 305 * SS),
        (253 * SS, 140 * SS),
        (256 * SS, 115 * SS),
        (259 * SS, 140 * SS),
        (259 * SS, 305 * SS)
    ]
    draw.polygon(shoot, fill=c_white)

    # Top Diamond / Achievement Star
    diamond = [
        (256 * SS, 85 * SS),
        (270 * SS, 115 * SS),
        (256 * SS, 140 * SS),
        (242 * SS, 115 * SS)
    ]
    draw.polygon(diamond, fill=c_gold_light)

    # Downsample standard 512
    img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    img_512.save("public/icon-512.png", "PNG")

    # Downsample 192
    img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    img_192.save("public/icon-192.png", "PNG")

    # Downsample Apple Touch Icon 180
    img_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
    img_180.save("public/apple-touch-icon.png", "PNG")

    # Maskable PWA Icon (Solid background to edge with symbol in 80% safe zone)
    maskable_canvas = Image.new("RGBA", (canvas_size, canvas_size), c_bg)
    # Scale down the inner icon to 78% and paste into center
    scaled_w = int(canvas_size * 0.78)
    scaled_icon = img.resize((scaled_w, scaled_w), Image.Resampling.LANCZOS)
    paste_pos = ((canvas_size - scaled_w) // 2, (canvas_size - scaled_w) // 2)
    maskable_canvas.paste(scaled_icon, paste_pos, scaled_icon)
    maskable_512 = maskable_canvas.resize((512, 512), Image.Resampling.LANCZOS)
    maskable_512.save("public/icon-maskable-512.png", "PNG")

    # Multi-resolution ICO: 16x16, 32x32, 48x48
    ico_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
    ico_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
    ico_48 = img.resize((48, 48), Image.Resampling.LANCZOS)
    ico_32.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    ico_32.save("public/favicon.png", "PNG")
    print("Successfully generated all branding PNG/ICO assets.")

if __name__ == "__main__":
    os.makedirs("public", exist_ok=True)
    with open("public/logo.svg", "w", encoding="utf-8") as f:
        f.write(create_svg())
    with open("public/favicon.svg", "w", encoding="utf-8") as f:
        f.write(create_favicon_svg())
    render_pillow_assets()
