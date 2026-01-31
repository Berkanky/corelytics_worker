const { chromium } = require("playwright");

var URL = "https://www.a101.com.tr/";

async function catch_home_product_links() {

    var browser = await chromium.launch({ headless: true });
    var context = await browser.newContext({
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        locale: "tr-TR",
    });

    var page = await context.newPage();
    await page.goto(URL, { waitUntil: "networkidle" });

    try {
        await page.waitForTimeout(1200);
        var closeBtn = page.locator('button:has-text("Kapat"), button[aria-label="close"]');
        if (await closeBtn.count()) await closeBtn.first().click({ timeout: 1000 });
    } catch {}

    var previousHeight = 0;

    for (var i = 0; i < 10; i++) {
        var currentHeight = await page.evaluate(() => document.body.scrollHeight);
        if (currentHeight === previousHeight) break;
        previousHeight = currentHeight;
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1200);
    }

    var links = [];

    try {
        var anchors = page.locator("a[href]");
        var count = await anchors.count();

        for (var i = 0; i < count; i++) {
            var href = await anchors.nth(i).getAttribute("href");
            if (!href) continue;

            if (
                href.includes("/kapida/") &&
                href.includes("_p-")
            ) {
                if (!href.startsWith("http")) {
                    href = "https://www.a101.com.tr" + href;
                }
                links.push(href);
            }
        }
    } catch {}

    links = [...new Set(links)];

    await browser.close();

    return links;
};

module.exports = { catch_home_product_links };