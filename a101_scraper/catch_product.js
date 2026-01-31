const { chromium } = require("playwright");
const { ObjectId } = require("mongodb");

async function catch_product(URL, product_tracking_id) {

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
        await page.waitForTimeout(800);
        var closeBtn = page.locator('button:has-text("Kapat"), button[aria-label="close"]');
        if (await closeBtn.count()) await closeBtn.first().click({ timeout: 1000 });
    } catch (err) {}

    var title = (await page.locator("h1").first().innerText().catch(function () { return null; })) || null;
    if (title) title = title.trim();

    var breadcrumbs = [];
    try {
        var bc = page.locator("nav a");
        var bcCount = await bc.count();
        for (var i = 0; i < bcCount; i++) {
            var t = (await bc.nth(i).innerText()).trim();
            if (t) breadcrumbs.push(t);
        }
    } catch {}

    if (!breadcrumbs.length) {
        try {
            var bc2 = page.locator(".breadcrumb a, .breadcrumbs a, [aria-label*=breadcrumb] a");
            var bc2Count = await bc2.count();
            for (var i = 0; i < bc2Count; i++) {
                var t2 = (await bc2.nth(i).innerText()).trim();
                if (t2) breadcrumbs.push(t2);
            }
        } catch {}
    }

    breadcrumbs = [...new Set(breadcrumbs)];

    var images = [];
    try {
        var imgs = page.locator("img");
        var imgCount = await imgs.count();
        for (var i = 0; i < imgCount; i++) {
            var src = await imgs.nth(i).getAttribute("src");
            if (src && src.includes("cdn") && src.includes("/files/")) images.push(src);
        }
        images = [...new Set(images)];
    } catch {}

    var parsePriceText = function (txt) {
        if (!txt) return null;
        var m = String(txt).match(/₺\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
        if (!m) return null;
        return Number(m[1].replace(/\./g, "").replace(",", "."));
    };

    var extractPricesByStyle = async function () {
        var items = [];
        try {
            items = await page.evaluate(function () {
                var out = [];
                var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
                while (walker.nextNode()) {
                    var el = walker.currentNode;
                    if (!el) continue;

                    var txt = (el.innerText || "").trim();
                    if (!txt) continue;

                    var m = txt.match(/₺\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
                    if (!m) continue;

                    var cs = window.getComputedStyle(el);

                    out.push({
                        text: m[0],
                        fontSize: parseFloat(cs.fontSize) || 0,
                        deco: (cs.textDecorationLine || "").toLowerCase(),
                        weight: parseInt(cs.fontWeight, 10) || 0
                    });
                }
                return out;
            });
        } catch {}

        var parsed = [];
        for (var i = 0; i < items.length; i++) {
            var p = parsePriceText(items[i].text);
            if (p != null && !isNaN(p)) {
                parsed.push({
                    price: p,
                    fontSize: items[i].fontSize || 0,
                    deco: items[i].deco || "",
                    weight: items[i].weight || 0
                });
            }
        }

        var bestCurrent = null;
        var bestOriginal = null;

        for (var i = 0; i < parsed.length; i++) {
            var it = parsed[i];

            if (it.deco.indexOf("line-through") >= 0) {
                if (!bestOriginal) bestOriginal = it;
                else if (it.fontSize > bestOriginal.fontSize) bestOriginal = it;
                else if (it.fontSize === bestOriginal.fontSize && it.price > bestOriginal.price) bestOriginal = it;
                continue;
            }

            if (!bestCurrent) bestCurrent = it;
            else if (it.fontSize > bestCurrent.fontSize) bestCurrent = it;
            else if (it.fontSize === bestCurrent.fontSize && it.weight > bestCurrent.weight) bestCurrent = it;
            else if (it.fontSize === bestCurrent.fontSize && it.weight === bestCurrent.weight && it.price > bestCurrent.price) bestCurrent = it;
        }

        if (bestCurrent && bestOriginal && bestOriginal.price <= bestCurrent.price) {
            bestOriginal = null;
        }

        return {
            current: bestCurrent ? bestCurrent.price : null,
            original: bestOriginal ? bestOriginal.price : null
        };
    };

    var prices = await extractPricesByStyle();
    var currentPrice = prices.current;
    var originalPrice = prices.original;

    var priceText = currentPrice != null ? ("₺" + String(currentPrice).replace(".", ",")) : null;

    var discountRate = null;
    if (currentPrice != null && originalPrice != null && originalPrice > currentPrice) {
        discountRate = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }

    var badges = [];
    try {
        var badgeEls = page.locator("text=/İNDİRİM|ALDIN/i");
        var bCount = await badgeEls.count();
        for (var i = 0; i < bCount; i++) {
            var bt = (await badgeEls.nth(i).innerText()).trim();
            if (bt) badges.push(bt);
        }
    } catch {}

    badges = [...new Set(badges)];

    var availability = "unknown";
    try {
        if (await page.locator("text=/Tükendi/i").count()) availability = "out_of_stock";
        else availability = "in_stock";
    } catch {}

    var productCode = null;
    try {
        var m = URL.match(/_p-(\d+)/);
        if (m) productCode = m[1];
    } catch {}

    var data = {
        product_tracking_id: new ObjectId(product_tracking_id),
        source: "a101",
        product_code: productCode,
        name: title,
        brand: title ? title.split(" ")[0] : null,
        category_path: breadcrumbs,
        images: images,
        price: {
            current: currentPrice,
            original: originalPrice,
            discount_rate: discountRate,
            currency: "TRY"
        },
        availability: availability,
        collected_at: new Date().toISOString(),
        raw: {
            price_text: priceText,
            badges: badges
        }
    };

    await browser.close();

    return data;
};

module.exports = { catch_product };