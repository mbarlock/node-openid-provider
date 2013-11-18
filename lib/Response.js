var crypto = require('crypto');
var url = require('url');

var OpenIDResponseNoReturnUrlException = require('./Error.js').OpenIDResponseNoReturnUrlException;

/**
 * Response builder
 */
function Response(fields) {
	this._fields = fields || {};
}

Response.prototype.fields = function() {
	return this._fields;
}

Response.prototype.get = function(field) {
	return this._fields[field] || null;
}

Response.prototype.set = function(field, value) {
	this._fields[field] = value;
	return this;
}

Response.prototype.unset = function(field) {
	delete this._fields[field];
	return this;
}

Response.prototype.sign = function(hashAlgorithm, secretBuffer) {
	//get the form elements to be signed
	var signed = "";
	for(var key in this.fields()) {
		signed += key+",";
	}
	signed = signed.slice(0,-1);

	//sign the form
	var form = this.toForm();
	var hmac = crypto.createHmac(hashAlgorithm, secretBuffer.toString('binary'));
	hmac.update(form);

	//add the new fields
	this.set('signed', signed);
	this.set('sig', hmac.digest('base64'));

	return this;
}

Response.prototype.toForm = function() {
	var output = "";
	for(var key in this.fields()) {
		output += key+":"+this._fields[key]+"\n";
	}
	return output;
}

Response.prototype.toURL = function() {
	if(!this.get('return_to')) {
		throw new OpenIDResponseNoReturnUrlException();
	}
	var parsed_url = url.parse(this.get('return_to'), true);
	var namespaced_fields = this._openidNamespacedFields();
	for (var key in namespaced_fields) {
		parsed_url.query[key] = namespaced_fields[key];
	}
	delete parsed_url['search']; //force url.format to re-encode the querystring
	return url.format(parsed_url);
}

Response.prototype._openidNamespacedFields = function() {
	var NAMESPACE = "openid.";
	var out = {};
	for(var key in this._fields) {
		out[NAMESPACE+key] = this._fields[key];
	}
	return out;
}

module.exports = Response;