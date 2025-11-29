# Fetching WOFF2 fonts for the project

This project uses self-hosted WOFF2 fonts stored under `/public/fonts`.

To download the WOFF2 files used by the project, run the bundled script:

```bash
./scripts/download-fonts.sh
```

What the script does:
- Requests the Google Fonts CSS for `Inter` and `Playfair Display` (weights used by the project).
- Parses the CSS to extract the WOFF2 URLs and downloads each file into `/public/fonts`.

After running the script:
- Inspect `/public/fonts` and rename files to the desired canonical names (the CSS in `src/app/globals.css` references specific filenames). Example:

```bash
mv public/fonts/abcdef1234.woff2 public/fonts/Inter-Variable.woff2
mv public/fonts/ghijkl5678.woff2 public/fonts/PlayfairDisplay-Regular.woff2
mv public/fonts/mnopqr9012.woff2 public/fonts/PlayfairDisplay-Italic.woff2
```

If you prefer not to rename files, update `src/app/globals.css` to point to the exact filenames downloaded.

Notes:
- This script downloads fonts from Google Fonts to your machine; ensure you are comfortable with the font license.
- The script is safe to run locally and will skip downloading files that already exist.