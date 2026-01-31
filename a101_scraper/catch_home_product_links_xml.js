const axios = require("axios");
const cheerio = require("cheerio");

var SITEMAP_INDEX = "https://www.a101.com.tr/sitemap.xml";

async function fetch_xml(url) {
    var res = await axios.get(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "tr-TR,tr;q=0.9"
        },
        timeout: 20000
    });
    return res.data;
}

function parse_sitemap_locs(xmlText) {
    var $ = cheerio.load(xmlText, { xmlMode: true });
    var locs = [];
    $("sitemap > loc, url > loc").each((_, el) => {
        var t = $(el).text().trim();
        if (t) locs.push(t);
    });
    return locs;
}

async function catch_kapida_product_links_from_sitemaps() {
    var indexXml = await fetch_xml(SITEMAP_INDEX);
    var sitemapUrls = parse_sitemap_locs(indexXml);

    var productSitemaps = [];
    for (var i = 0; i < sitemapUrls.length; i++) {
        var u = sitemapUrls[i];
        if (u.includes("/sitemaps/") && u.includes("products-kapida")) productSitemaps.push(u);
    };

    var links = [];

    for (var i = 0; i < productSitemaps.length; i++) {
        var smUrl = productSitemaps[i];
        var smXml = await fetch_xml(smUrl);
        var locs = parse_sitemap_locs(smXml);

        for (var j = 0; j < locs.length; j++) {
            var href = locs[j];
            if (href.includes("/kapida/") && href.includes("_p-")) links.push(href);
        }
    };

    links = [...new Set(links)];

    return links;
};

module.exports = { catch_kapida_product_links_from_sitemaps };