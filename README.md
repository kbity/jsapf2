# jsapf2
APF2 (Aperture Picture Format 2) JavaScript Polyfill. Intended to replace apf2web.js and later support all APF2/A2K images.

## Versions
0.1.0 - Can decode APF2-LC images (APF2s with no flags)

0.2.0 - Can decode APF2 images (APF2s with no flags, or the l flag (2 color mode))

0.2.1 - Can decode APF images (Portal ARG APF Files)

0.2.2 - Can correctly decode APF2 images with transparency (t flag)

0.2.3 - Fix bug where transparency is added to non-t images

0.3.0 - Add support for Dual-Indexed APF2 images and RGBA palettes (All APF2-1994 should decode, but without animation)
