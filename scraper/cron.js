const cron = require("node-cron");

var { get_products_details } = require("../scraper/get_products_details");

cron.schedule("0 18 * * *", async () => {
    try {
        console.log("The scheduled automation operation has started. " + new Date());
        
        var result = await get_products_details();
        console.log(JSON.stringify(result));
    } catch (err) {
        console.error(err.message);
    }
});