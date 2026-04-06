import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const puppeteer = require('/tmp/pup-test/node_modules/puppeteer/lib/cjs/puppeteer/puppeteer.js');

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

// Auto-increment filename
let n = 1;
let filename;
do {
  filename = label
    ? path.join(screenshotDir, `screenshot-${n}-${label}.png`)
    : path.join(screenshotDir, `screenshot-${n}.png`);
  n++;
} while (fs.existsSync(filename));

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: filename, fullPage: false });
console.log(`Screenshot saved: ${filename}`);
await browser.close();
