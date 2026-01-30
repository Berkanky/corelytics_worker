var auditlog = require("../schemas/audit_log");

const { ObjectId } = require('mongodb');
const onFinished = require('on-finished');

//Şifreleme.
var sha_256 = require("../encryption_modules/sha_256");

//Fonksiyonlar.
var get_geo_country = require("../functions/get_geo_country");

var { ISSUER } = process.env;
if( !ISSUER ) throw "ISSUER required. ";

async function create_audit_log(req, res, next) {

  try { 

    onFinished(res, async(err, res) => {

      var req_body = {};
      var req_params = {};

      if( req?.body ) Object.assign(req_body, req.body);
      if( req?.params ) Object.assign(req_params, req.params);

      var new_audit_log_obj = {   
        user_id: req?.UserId ? new ObjectId(req.UserId) : null,
        request_id: req?.id || null,
        session_id: req?.session_id ? sha_256(req.session_id) : null,
        action: req?.action_name || null,
        success: res?.statusCode > 199 && res.statusCode < 400 ? true : false,
        http_status: res?.statusCode || null,
        ip_address: req?.source_ip || null,
        user_agent: req.headers["user-agent"],
        geo_country: get_geo_country(req),
        method: req?.method || null,
        path: req?.path || null,
        //request_params: Object.keys(req_params).length > 0 ? JSON.stringify(hide_sensitive_key(req_params)) : null,
        //request_body: Object.keys(req_body).length > 0 ? JSON.stringify(hide_sensitive_key(req_body)) : null,
        provider: ISSUER,
      };

      var new_audit_log = new auditlog(new_audit_log_obj);
      await new_audit_log.save(); 
    });
  } catch (err) { 
    console.error(err);
  } finally{
    return next();
  }
};

module.exports = create_audit_log;