var product = require("../schemas/product");

async function create_product(data){
    if( !data ) return false;

    var images = [];
    if( 'images' in data ){
        if( (data.images).length ) {
            images = (data.images).map(function(item){ return { url: item } });
        }
    }

    var price = {};
    if( 'price' in data ){
        var current = data?.price?.current || null;
        var original = data?.price?.original || null;
        var discount_rate = data?.price?.discount_rate || null;
        var currency = data?.price?.currency || null;

        Object.assign(price,{ current, original, discount_rate, currency });
    }

    var raw = {};
    if( 'raw' in data ){
        var price_text = data?.raw?.price_text || null;
        var badges = [];
        badges = data?.raw?.badges || [];

        Object.assign(raw, price_text, badges);
    }

    var new_product_obj = {
        product_tracking_id: data?.product_tracking_id || null,
        source: data?.source || null,
        product_code: data?.product_code || null,
        url: data?.url || null,
        name: data?.name || null,
        brand: data?.brand || null,
        category_path: data?.category_path && data?.category_path.length ? data.category_path : [],
        images: images,
        price: price,
        availability:data?.availability || null,
        collected_at: new Date(),
        raw: raw,
        created_date: new Date()
    };

    var new_product = new product(new_product_obj);
    await new_product.save();

    return true;
};

module.exports = { create_product };