const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const ejs = require('ejs');
const minify = require('html-minifier').minify;

// Directories
const COMPONENTS_DIR = './components';
const CONTENT_DIR = './content';
const PUBLIC_DIR = './public';

const layoutFile = './assets/templates/layout.ejs';
const excludeStripExtension = ['index.html', '404.html'];
const me = 'Phillip Harrington';

// Ensure output directory exists
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Utility: Load templates dynamically
const loadTemplates = () => {
  const templates = {};

  // Load from components directory
  const files = fs.readdirSync(COMPONENTS_DIR);
  files.forEach((file) => {
    const tagName = path.basename(file, path.extname(file)); // e.g., "my-header"
    const templatePath = path.join(COMPONENTS_DIR, file);
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    templates[tagName] = templateHtml.trim();
  });

  // Load inline components from the layout file
  const layoutHtml = fs.readFileSync(layoutFile, 'utf8');
  const inlineComponentRegex = /<template name="(.+?)">([\s\S]+?)<\/template>/g;
  let match;
  while ((match = inlineComponentRegex.exec(layoutHtml)) !== null) {
    const tagName = match[1];
    const templateHtml = match[2].trim();
    templates[tagName] = templateHtml;
  }

  return templates;
};

// Utility: Render a single template
const renderTemplate = (template, attributes, content) => {
  const data = { ...attributes, content };
  return ejs.render(template, data);
};

// Utility: Recursively render custom tags
const renderCustomTags = (dom, templates) => {
  let hasCustomTags = true;

  while (hasCustomTags) {
    hasCustomTags = false;
    Object.keys(templates).forEach((tagName) => {
      const elements = Array.from(
        dom.window.document.getElementsByTagName(tagName),
      );

      if (elements.length > 0) {
        hasCustomTags = true;
      }

      elements.forEach((element) => {
        const attributes = Array.from(element.attributes).reduce(
          (acc, attr) => {
            acc[attr.name] = attr.value !== '' ? attr.value : true;
            return acc;
          },
          {},
        );
        const content = element.innerHTML.trim();

        // Render the template
        const template = templates[tagName];
        const rendered = renderTemplate(template, attributes, content);

        // Replace the element with rendered HTML
        const placeholder = dom.window.document.createElement('div');
        placeholder.innerHTML = rendered;

        element.replaceWith(...placeholder.childNodes);
      });
    });
  }
};

// Get general meta content by name
const getMetaContent = (dom, name) => {
  const meta = dom.window.document.querySelector(`meta[name="${name}"]`);
  return meta ? meta.content : null;
};

// Get Open Graph (og) tags
const getOgContent = (dom, property) => {
  const meta = dom.window.document.querySelector(
    `meta[property="${property}"]`,
  );
  return meta ? meta.content : null;
};

// Process HTML files
const templates = loadTemplates();
const layoutHtml = fs.readFileSync(layoutFile, 'utf8');

fs.readdirSync(CONTENT_DIR).forEach((file) => {
  if (file.endsWith('.html')) {
    const filePath = path.join(CONTENT_DIR, file);

    let outputFile = file;
    if (!excludeStripExtension.includes(file)) {
      // Remove .html extension
      outputFile = file.replace(/\.html$/, '');
    }

    const outPath = path.join(PUBLIC_DIR, outputFile);

    // Read and parse the HTML
    const html = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(html, {
      features: {
        QuerySelector: true,
      },
    });

    // Render custom tags
    renderCustomTags(dom, templates);

    // Get the title & slap my name on the end,
    // unless it starts with my name
    let title = dom.window.document.title;
    if (title.substring(0, 18) !== me) {
      title = `${title} | ${me}`;
    }

    // Select the <main> tag
    const mainElement = dom.window.document.querySelector('main');
    // Get the contents of the <main> tag
    const yield = mainElement ? mainElement.innerHTML.trim() : '';

    // Meta tags
    const metaDescription = getMetaContent(dom, 'description');
    const metaKeywords = getMetaContent(dom, 'keywords');

    const ogTitle = getOgContent(dom, 'og:title');
    const ogDescription = getOgContent(dom, 'og:description');
    const ogImage = getOgContent(dom, 'og:image');

    const data = {
      title,
      yield,
      metaDescription,
      metaKeywords,
      ogTitle,
      ogDescription,
      ogImage,
      path: outputFile,
    };

    // put the processed html into the layout
    let outputHtml = ejs.render(layoutHtml, data);
    const outputDom = new JSDOM(outputHtml);

    renderCustomTags(outputDom, templates);
    outputHtml = outputDom.serialize();

    // Minify and write the transformed HTML
    const minifiedHtml = minify(outputHtml, {
      removeAttributeQuotes: true,
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeTagWhitespace: true,
    });

    fs.writeFileSync(outPath, minifiedHtml, 'utf8');
    console.log(`Processed: ${filePath} into ${outPath}`);
  }
});
