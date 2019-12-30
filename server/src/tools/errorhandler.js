"use strict";

module.exports.errorhash = (error) => {
	const message = (error && error.hasOwnProperty("message")) ? error.message : error;
	return require('crypto').createHash('sha1').update(JSON.stringify(message)).digest('hex');
}

module.exports.SUCCESS = (res) => {
	return { err: null, res: res }
};

module.exports.ERROR = (code, header, error, includeraw) => {
	let message;
	let errobj;
	if (error && error.hasOwnProperty("err") && error.err.hasOwnProperty("hash")) {
		errobj = error.err;
	} else {
		message = error.hasOwnProperty("message") ? error.message : error;
		errobj = {
			date: new Date() / 1000,
			code: code,
			header: header,
			message: message,
			hash: this.errorhash(message),
		} 
	}
	return { err: errobj, res: null }
}
