const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const ejs = require('ejs');
const minify = require('html-minifier').minify;

// Directories
const COMPONENTS_DIR = './components';
const LAYOUTS_DIR = './layouts';
const CONTENT_DIR = './content';
const PUBLIC_DIR = './public';

const excludeStripExtension = ['index.html', '404.html'];
const me = 'Phillip Harrington';

// Ensure output directory exists
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Utility: Load components dynamically
const loadComponents = () => {
  const components = {};

  const files1 = fs.readdirSync(LAYOUTS_DIR);
  const files2 = fs.readdirSync(COMPONENTS_DIR);
  const allFiles = { layouts: files1, components: files2 };

  Object.entries(allFiles).forEach(([dir, files]) => {
    files.forEach((file) => {
      const tagName = path.basename(file, path.extname(file));
      const templatePath = path.join(dir, file);
      const templateHtml = fs.readFileSync(templatePath, 'utf8');
      components[tagName] = templateHtml.trim();
    });
  });

  return components;
};

// Process component files
const components = loadComponents();

// Extract metadata and variables from <head>
const extractHeadData = (dom) => {
  const head = dom.window.document.head;

  const title = head.querySelector('title')?.textContent || 'Untitled';
  const metaTags = Array.from(head.querySelectorAll('meta'))
    .map((meta) => meta.outerHTML)
    .join('\n');

  return { title, metaTags };
};

// Utility: Render a single template
const renderTemplate = (template, attributes, content) => {
  const data = { ...attributes, content };
  return ejs.render(template, data);
};

// Recursively render custom components
const renderComponents = (dom, components, data = {}) => {
  let hasCustomTags = true;

  while (hasCustomTags) {
    hasCustomTags = false;

    Object.keys(components).forEach((tagName) => {
      const elements = Array.from(
        dom.window.document.getElementsByTagName(tagName),
      );

      //
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
        const yield = element.innerHTML.trim();

        // Render the template
        const template = components[tagName];
        const rendered = ejs.render(template, {
          ...attributes,
          ...data,
          yield,
        });

        // Replace the element with rendered HTML
        const placeholder = dom.window.document.createElement('div');
        placeholder.innerHTML = rendered;

        element.replaceWith(...placeholder.childNodes);
      });
    });
  }
};

fs.readdirSync(CONTENT_DIR).forEach((file) => {
  if (!file.endsWith('.html')) {
    return;
  }

  const filePath = path.join(CONTENT_DIR, file);

  let outputFile = file;
  if (!excludeStripExtension.includes(file)) {
    // Remove .ejs extension
    outputFile = file.replace(/\.html$/, '');
  }

  const outputPath = path.join(PUBLIC_DIR, outputFile);

  // Read content file and create JSDOM
  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);

  // Extract metadata and variables
  const { title, metaTags } = extractHeadData(dom);

  // Replace <layout> tag with the layout component
  const layoutElement = dom.window.document.querySelector('layout');
  if (!layoutElement) {
    console.error(`No <layout> tag found in ${filePath}`);
    return;
  }

  const layoutTemplate = components['default'];
  const renderedLayout = ejs.render(layoutTemplate, {
    title: title.startsWith(me) ? title : `${title} | ${me}`,
    meta: metaTags,
    yield: layoutElement.innerHTML.trim(),
    url: outputFile !== 'index.html' ? outputFile : '',
  });

  const layoutDom = new JSDOM(renderedLayout);

  // Render nested components recursively
  renderComponents(layoutDom, components);

  // Minify and write output
  const minifiedHtml = minify(layoutDom.serialize(), {
    removeAttributeQuotes: true,
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeTagWhitespace: true,
  });

  fs.writeFileSync(outputPath, minifiedHtml, 'utf8');
  console.log(`Processed: ${filePath} -> ${outputPath}`);
});
