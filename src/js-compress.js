const fs = require('fs');
const path = require('path');
const Terser = require('terser');

const SRC_DIR = './assets/js';
const OUT_DIR = './public/js';

fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const files = fs.readdirSync(SRC_DIR);

  for (const file of files) {
    if (!file.endsWith('.js')) {
      continue;
    }

    const filePath = path.join(SRC_DIR, file);
    const outFilePath = path.join(OUT_DIR, file);

    try {
      const code = fs.readFileSync(filePath, 'utf8');
      const result = await Terser.minify(code);

      if (result.error) {
        console.error(`Error minifying ${file}:`, result.error);
      } else {
        fs.writeFileSync(outFilePath, result.code, 'utf8');
        console.log(`Minified ${file} -> ${outFilePath}`);
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
})();
