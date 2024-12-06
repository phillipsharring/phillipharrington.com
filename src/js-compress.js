const fs = require("fs");
const path = require("path");
const Terser = require("terser");

const SRC_DIR = "./assets/js"; // Source JavaScript files
const OUT_DIR = "./public/js"; // Destination for minified files

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  // Read all JavaScript files from the source directory
  const files = fs.readdirSync(SRC_DIR);

  for (const file of files) {
    if (file.endsWith(".js")) {
      const filePath = path.join(SRC_DIR, file);
      const outFilePath = path.join(OUT_DIR, file);

      try {
        // Read the file
        const code = fs.readFileSync(filePath, "utf8");

        // Minify the JavaScript file
        const result = await Terser.minify(code);

        if (result.error) {
          console.error(`Error minifying ${file}:`, result.error);
        } else {
          // Write the minified file to the output directory
          fs.writeFileSync(outFilePath, result.code, "utf8");
          console.log(`Minified ${file} -> ${outFilePath}`);
        }
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
  }
})();
