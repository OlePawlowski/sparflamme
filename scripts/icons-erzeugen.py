"""Erzeugt die App-Symbole aus derselben Geometrie wie public/favicon.svg.

Hintergrund ist bewusst weiss: ein transparentes Symbol wird auf dem
iOS-Homescreen schwarz hinterlegt, was die Kundin gemeldet hat.

Aufruf:  python3 scripts/icons-erzeugen.py
"""
from PIL import Image, ImageDraw

GRUEN = (63, 122, 88)
BERNSTEIN = (168, 118, 42)
ROT = (168, 68, 58)
TINTE = (30, 28, 26)
WEISS = (255, 255, 255)

# Vierfach zeichnen und herunterrechnen: ergibt weiche Kanten ohne Zusatzpaket.
UEBERABTASTUNG = 4


def zeichne(kante: int, rand: float = 0.0) -> Image.Image:
    """kante = Zielkantenlaenge in Pixeln. rand = Anteil Luft ringsum (0..0.2)."""
    gross = kante * UEBERABTASTUNG
    bild = Image.new("RGB", (gross, gross), WEISS)
    d = ImageDraw.Draw(bild)

    # Die SVG-Vorlage rechnet in einem 64er-Raster.
    inhalt = gross * (1 - 2 * rand)
    s = inhalt / 64
    off = gross * rand

    def p(x, y):
        return (off + x * s, off + y * s)

    def kasten(x, y, w, h):
        return [p(x, y), p(x + w, y + h)]

    # Ring mit Luecke oben rechts, wie in der SVG-Vorlage.
    r, cx, cy = 22, 32, 32
    d.arc(kasten(cx - r, cy - r, 2 * r, 2 * r), start=-37.2, end=295.6,
          fill=GRUEN, width=max(1, round(4 * s)))
    for (dx, dy, rr) in ((49.5, 18.7, 2.2), (41.5, 12.15, 1.4)):
        d.ellipse(kasten(dx - rr, dy - rr, 2 * rr, 2 * rr), fill=GRUEN)

    # Batterie: Nippel, Koerper, drei Balken.
    d.rounded_rectangle(kasten(29, 17.5, 6, 4.5), radius=1.5 * s, fill=TINTE)
    d.rounded_rectangle(kasten(24.75, 20.5, 14.5, 24.75), radius=3.5 * s,
                        fill=WEISS, outline=TINTE, width=max(1, round(2.5 * s)))
    for y, farbe in ((23.4, GRUEN), (30.4, BERNSTEIN), (37.4, ROT)):
        d.rounded_rectangle(kasten(27.5, y, 9, 5), radius=1.2 * s, fill=farbe)

    return bild.resize((kante, kante), Image.LANCZOS)


if __name__ == "__main__":
    # Homescreen-Symbole brauchen Luft am Rand, sonst beschneidet iOS sie.
    zeichne(180, rand=0.10).save("public/apple-touch-icon.png")
    zeichne(192, rand=0.10).save("public/icon-192.png")
    zeichne(512, rand=0.10).save("public/icon-512.png")
    # Maskierbare Kacheln werden zugeschnitten, daher mehr Luft.
    zeichne(512, rand=0.18).save("public/icon-512-maskable.png")
    print("Symbole erzeugt in public/")
