"use strict";
import crypto from "crypto";

export const errorhash = (error) => {
	const message = (error && error.hasOwnProperty("message")) ? error.message : error;
	return crypto.createHash('sha1').update(JSON.stringify(message)).digest('hex');
}

export const isSUCCESS = (res) => {
	return { err: null, res: res }
};

export const isERROR = (code, topic, header, error, includeraw) => {
	let message;
	let errobj;
	if (error && error.hasOwnProperty("err") && error.err.hasOwnProperty("hash")) {
		errobj = error.err;
	} else {
		message = error.hasOwnProperty("message") ? error.message : error;
		errobj = {
			date: new Date(),
			code: code,
			topic: topic,
			header: header,
			message: message,
			hash: errorhash(message),
		}
	}
	return { err: errobj, res: null }
}
