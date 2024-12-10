const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const ejs = require('ejs');
const minify = require('html-minifier').minify;

const COMPONENTS_DIR = './components';
const LAYOUTS_DIR = './layouts';
const CONTENT_DIR = './content';
const PUBLIC_DIR = './public';

const excludeStripExtension = ['index.html', '404.html'];
const me = 'Phillip Harrington';

fs.mkdirSync(PUBLIC_DIR, { recursive: true });

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

const components = loadComponents();

const extractHeadData = (dom) => {
  const head = dom.window.document.head;

  const title = head.querySelector('title')?.textContent || 'Untitled';
  const metaTags = Array.from(head.querySelectorAll('meta'))
    .map((meta) => meta.outerHTML)
    .join('\n');

  return { title, metaTags };
};

const renderComponents = (dom, components, data = {}) => {
  let hasCustomTags = true;

  while (hasCustomTags) {
    hasCustomTags = false;

    Object.keys(components).forEach((tagName) => {
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
        const yield = element.innerHTML.trim();

        // Render the template
        const template = components[tagName];
        const rendered = ejs.render(template, {
          ...attributes,
          ...data,
          yield,
        });

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
    // Remove extension
    outputFile = file.replace(/\.html$/, '');
  }

  const outputPath = path.join(PUBLIC_DIR, outputFile);

  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);

  const { title, metaTags } = extractHeadData(dom);

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
    // the og:url
    url: outputFile !== 'index.html' ? outputFile : '',
  });

  const layoutDom = new JSDOM(renderedLayout);

  renderComponents(layoutDom, components);

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
