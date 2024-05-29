exports.log_buffer = function(b) {
	let m = b.toString('hex').match(/../g);
	if (!m) return "<>";
	return m.join(' ');
}
exports.log_datagram = exports.log_buffer;
exports.log_packet = function(object) {
	var object_copy = JSON.parse(JSON.stringify(object));
	if (typeof object.data !== "undefined") {
		object_copy.data = exports.log_buffer(object.data);
	}
	return object_copy;
}

