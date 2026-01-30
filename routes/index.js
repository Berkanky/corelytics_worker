const express = require("express");
const app = express.Router();

//joi schemas
var create_product_tracking_service_schema = require("../joi_schemas/create_product_tracking_service_schema");

//middlewares
var rate_limiter = require("../middleware/rate_limiter");

//shemas
var product_tracking = require("../schemas/product_tracking");

app.get(
    "/health",
    async(req, res) => { 
        try{
          return res.status(200).json({
            issuer: 'corelytics',
            success: true,
            request_date: new Date()
          });
        }catch(err){
            console.log(err);
            return res.status(500).json({message: err });
        }
    }
);

app.post(
  "/create-product-tracking",
  rate_limiter,
  async(req, res) => {

    var { url, time_range } = req.body;
    
    var { error } = create_product_tracking_service_schema.validate(req.body, { abortEarly: false });
    if( error) return res.status(400).json({errors: error.details.map(detail => detail.message), success: false });
      
    try{

      var product_tracking_filter = { url: url };

      var product_tracking_detail = await product_tracking.findOne(product_tracking_filter);
      if( product_tracking_detail ) return res.status(409).json({ message:' This product has already been added to the watchlist.', success: false });

      var new_product_tracking_obj = {
        url: url,
        created_date: new Date(),
        time_range: time_range,
        track_count: 0
      };

      var new_product_tracking = new product_tracking(new_product_tracking_obj);
      await new_product_tracking.save();

      return res.status(200).json({ message:' The product to be tracked has been successfully created.', success: true });
    }catch(err){
      console.error(err);
      return res.status(500).json({ message:' create-product-tracking service error. ', success: false });
    }
  }
);

module.exports = app;