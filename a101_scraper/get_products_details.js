var { catch_product } = require("./catch_product");
var { catch_home_product_links } = require("./catch_home_product_links");
var { catch_kapida_product_links_from_sitemaps } = require("./catch_home_product_links_xml");

var product_tracking = require("../schemas/product_tracking");

var should_run = require("../functions/should_run");

var { create_product } = require("../insert_operations/create_product");
var { update_product_tracking_track_date } = require("../update_operations/update_product_tracking");

async function get_tracking_products(){
    var product_trackings = await product_tracking.find().lean();
    if( !product_trackings.length ) throw "product_tracking empty. ";

    for(var i = 0; i < product_trackings.length; i++){
        var product_tracking_row = product_trackings[i];

        var { url, time_range, track_date } = product_tracking_row;

        var is_product_tracking_active = should_run(time_range, new Date(), track_date);

        product_tracking_row.should_run = is_product_tracking_active;

        continue;
    };

    product_trackings = product_trackings.filter(function(item){ return item.should_run === true });
    if( !product_trackings.length ) throw "product_tracking empty. ";

    return product_trackings;
};

async function get_products_details(){
    var request_start_date = new Date();
    
    var product_trackings =  await get_tracking_products(); //await catch_kapida_product_links_from_sitemaps();
    var product_count = 0;

    for(var i = 0; i < product_trackings.length; i++){

        var row = product_trackings[i];

        var { _id, url } = row;
        var product_tracking_id = _id.toString();

        var data = await catch_product(url, product_tracking_id);
        if( !data ) continue;

        await create_product(data);
        await update_product_tracking_track_date(product_tracking_id);

        product_count = product_count + 1;

        await new Promise(function(resolve){
            setTimeout(resolve, 5000);
        });
    };

    var request_end_date = new Date();    
    var result = { 
        success: true, 
        tracked_product_count: product_count, 
        request_start_date, 
        request_end_date 
    };

    return result;
};

module.exports = { get_products_details };