const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3004;
const PUBLIC_DIR = path.join(__dirname, "../public");

// Middleware to serve extensionless requests
app.use((req, res, next) => {
  // Ignore requests with extensions (e.g., .css, .js, .png)
  if (path.extname(req.path)) {
    return next();
  }

  const filePath = path.join(PUBLIC_DIR, req.path);

  // Check if the requested file exists
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      // Serve the file with Content-Type text/html
      res.sendFile(filePath, { headers: { "Content-Type": "text/html" } });
    } else {
      next(); // Proceed to the fallback if the file doesn't exist
    }
  });
});

// Serve static files for everything else (e.g., CSS, JS, images)
app.use(express.static(PUBLIC_DIR));

// Fallback for 404
app.use((req, res) => {
  const notFoundPage = path.join(PUBLIC_DIR, "404.html");
  fs.stat(notFoundPage, (err, stats) => {
    if (!err && stats.isFile()) {
      // Serve the 404.html file
      res
        .status(404)
        .sendFile(notFoundPage, { headers: { "Content-Type": "text/html" } });
    } else {
      // If 404.html is missing, send a default plain-text response
      res.status(404).send("404 Not Found");
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
