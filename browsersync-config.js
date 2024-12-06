const browserSync = require("browser-sync").create();
const path = require("path");
const fs = require("fs");

const PUBLIC_DIR = "./public";

browserSync.init({
  server: {
    baseDir: PUBLIC_DIR,
    index: "index.html",
    middleware: [
      (req, res, next) => {
        const filePath = path.join(PUBLIC_DIR, req.originalUrl);

        // if they want the index.html or a file that exists, serve it
        if (req.originalUrl === "/" || path.extname(filePath)) {
          return next();
        }

        // Check for file without an extension, they're probably html
        fs.stat(filePath, (err, stats) => {
          if (!err && stats.isFile()) {
            res.setHeader("Content-Type", "text/html");
            res.write(fs.readFileSync(filePath));
            return res.end();
          }

          const notFoundPage = path.join(PUBLIC_DIR, "404.html");
          fs.stat(notFoundPage, (err, stats) => {
            if (!err && stats.isFile()) {
              res.statusCode = 404;
              res.write(fs.readFileSync(notFoundPage));
              return res.end();
            }
          });
        });
      },
    ],
  },
  files: [
    `${PUBLIC_DIR}/**/*`, // Watch for changes in the public directory
  ],
  port: 3004,
  notify: false, // Turn off the Browsersync notification if not needed
});
