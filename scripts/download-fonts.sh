#!/usr/bin/env bash
set -euo pipefail

# Downloads WOFF2 font files referenced by Google Fonts CSS into /public/fonts
# Usage: ./scripts/download-fonts.sh
# Note: This script runs locally and downloads files from fonts.googleapis.com / gstatic.

OUTDIR="public/fonts"
CSS_URL="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap"

mkdir -p "$OUTDIR"
TMP_CSS=$(mktemp)

echo "Fetching Google Fonts CSS..."
curl -s -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100 Safari/537.36" "$CSS_URL" -o "$TMP_CSS"

echo "Parsing CSS and downloading WOFF2 files to $OUTDIR"
grep -o "url([^)]*)" "$TMP_CSS" | sed "s/url(//;s/)//;s/'//g" | while read -r url; do
  filename=$(basename "${url%%\?*}")
  dest="$OUTDIR/$filename"
  if [ -f "$dest" ]; then
    echo "Skipping existing $dest"
    continue
  fi
  echo "Downloading: $url -> $dest"
  curl -s -L -o "$dest" "$url"
done

rm -f "$TMP_CSS"

cat <<EOF
Done.

Files downloaded to: $OUTDIR

Next steps:
- Inspect the filenames in $OUTDIR. If you want canonical names used in the project, rename them, for example:
  mv public/fonts/<downloaded-file>.woff2 public/fonts/Inter-Variable.woff2
  mv public/fonts/<downloaded-file>.woff2 public/fonts/PlayfairDisplay-Regular.woff2

- Then run your dev server:
  npm run dev

EOF
