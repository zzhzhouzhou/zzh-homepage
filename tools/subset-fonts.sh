#!/usr/bin/env bash
# Re-subset the OFL fonts (run after changing copy). HarmonyOS Sans is NOT touched: its licence forbids
# modifying/subsetting, so public/fonts/HarmonyOS_Sans_Condensed_*.ttf are the official files, copied as-is.
# Needs: pip install fonttools brotli ; sources in ../fonts-src (JBM.ttf, v3/*.ttf)
set -e
F=${FONT_SRC:-../fonts-src}
SYM="◀▶●○■□▲△▼→←↑↓↗↘·—–…×°§¶†‡▸│∞№“”‘’″′"
pyftsubset $F/v3/InstrumentSerif-Regular.ttf --unicodes="U+0020-007E,U+00A0-00FF" --text="—–’‘“”…·№" --layout-features='kern,liga' --flavor=woff2 --output-file=public/fonts/instrument-serif.woff2
pyftsubset $F/v3/InstrumentSerif-Italic.ttf --unicodes="U+0020-007E,U+00A0-00FF" --text="—–’‘“”…·№" --layout-features='kern,liga' --flavor=woff2 --output-file=public/fonts/instrument-serif-italic.woff2
fonttools varLib.instancer $F/v3/BigShouldersStencil.ttf wght=800 opsz=72 -o /tmp/bss.ttf -q
pyftsubset /tmp/bss.ttf --unicodes="U+0020-007E,U+00B7,U+2192" --layout-features='kern' --flavor=woff2 --output-file=public/fonts/stencil.woff2
pyftsubset $F/JBM.ttf --unicodes="U+0020-007E,U+00A0-00FF" --text="$SYM" --layout-features='kern' --flavor=woff2 --output-file=public/fonts/jbmono.woff2
ls -la public/fonts
