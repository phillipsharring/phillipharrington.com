const fs = require("fs");
const path = require("path");
const minify = require("html-minifier").minify;

const contentDir = "./content";
const publicDir = "./public";
const templateFile = "./assets/templates/layout.html";
const excludeStripExtension = ["index.html", "404.html"];

const templateContent = fs.readFileSync(templateFile, "utf8");

fs.readdirSync(contentDir).forEach((fileName) => {
  if (fileName.endsWith(".html")) {
    let outputFileName = fileName;
    if (!excludeStripExtension.includes(fileName)) {
      // Remove .html extension
      outputFileName = fileName.replace(/\.html$/, "");
    }

    let outputContent = templateContent;

    const content = fs.readFileSync(path.join(contentDir, fileName), "utf8");

    const titleMatch = /<title[^>]*>((.|[\n\r])*)<\/title>/im.exec(content);
    const title = titleMatch ? titleMatch[1] : "";
    outputContent = outputContent.replace("{{title}}", title);

    const mainContentMatch = /<main[^>]*>((.|[\n\r])*)<\/main>/im.exec(content);
    const mainContent = mainContentMatch ? mainContentMatch[1] : "";
    outputContent = outputContent.replace("{{content}}", mainContent);

    const minifiedContent = minify(outputContent, {
      removeAttributeQuotes: true,
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeTagWhitespace: true,
    });

    if (minifiedContent !== outputContent) {
      console.log("Minified " + outputFileName);
    }

    fs.writeFileSync(
      path.join(publicDir, outputFileName),
      minifiedContent,
      "utf8",
    );
  }
});
