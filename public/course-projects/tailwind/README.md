# Tailwind v4 student planner
The included output.css lets you open index.html immediately.
To change utilities or theme values, install a supported Node.js release with npm,
then run these commands in this extracted folder:

    npm install
    npm run build

Open index.html. For automatic rebuilding while editing, use `npm run dev` and
keep that terminal running. Ctrl+C stops the watcher. This is the v4 CLI workflow;
do not mix in v3 initialization commands. Dependencies download from npm.

## Your tasks
- Explain the CSS property behind each layout utility.
- Change the brand and paper theme values in input.css. Rebuild and check contrast.
- Add a third card with a long title, using complete utility class names.
- Check 320px, tablet, desktop, 200% zoom, keyboard focus, and reduced motion.
- Check light and dark system appearances. The default dark variant follows your
  system preference; there is intentionally no inactive theme-toggle button.
- Compare this with your plain CSS version: readability, reuse, build steps, and
  maintenance. Write two decisions and one bug you fixed, then commit your source.
- Run the one-time build and verify index.html and output.css work together.

## Source and output
Edit index.html and input.css. Do not maintain edits only in output.css: rebuilding
replaces it. The explicit @source directive scans index.html in this folder.

## Honest limits
This is a static learning project. Inputs are not saved or submitted. A disabled
button labels that limit. Project work is self-reviewed, not graded automatically.

References: https://tailwindcss.com/docs/installation/tailwind-cli
https://tailwindcss.com/docs/theme
