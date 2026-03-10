const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

    console.log('Navigating...');
    await page.goto('http://localhost:5175/', { waitUntil: 'networkidle0' });

    const content = await page.content();
    console.log('Root HTML:', await page.evaluate(() => document.getElementById('root')?.innerHTML));

    await browser.close();
})();
