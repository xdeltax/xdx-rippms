module.exports = (error) => {
	const message = (error && error.hasOwnProperty("message")) ? error.message : error;
	return require('crypto').createHash('sha1').update(JSON.stringify(message)).digest('hex');
}
