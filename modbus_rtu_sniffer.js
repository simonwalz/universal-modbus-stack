const util = require('util');
const EventEmitter = require('events').EventEmitter;

const modbus_datagram = require("./modbus_rtu_datagram.js");
const helper = require("./helper.js");

exports.modbus_rtu_sniffer = function(settings) {
	var _this = this;

	this.buffer = Buffer.from([]);

	this.mode = true; // true = Request, false = Response

	EventEmitter.call(this);
};
util.inherits(exports.modbus_rtu_sniffer, EventEmitter);

exports.modbus_rtu_sniffer.prototype.parse = function(data) {
	this.buffer = Buffer.concat([this.buffer, data]);

	while(this.buffer.length !== 0) {
		let r = this.parse_sub(this.buffer, this.mode);
		if (!r) return;
		this.mode = !this.mode;
		this.buffer = r;
	}
}

exports.modbus_rtu_sniffer.prototype.parse_sub = function(buffer, mode, oneshot) {
	var _this = this;
	if (buffer.length == 0) return Buffer.from([]);
	if (buffer.length < 3) {
		console.debug("rest buffer", helper.log_datagram(buffer));
		return Buffer.from([]);
	}
	try {
		var packet = modbus_datagram.decode(buffer, mode);
		if (!packet) return null;
		//console.log("b", helper.log_datagram( buffer.slice(0,
		//		packet.buffer_length)));
		console.debug(new Date(), helper.log_packet(packet));

		_this.emit("data", packet);

		buffer = buffer.slice(packet.datagram_length);
		//console.log("b", helper.log_datagram(buffer));

		return buffer;
	} catch(e) {
		if (oneshot) return Buffer.from([]);
		if (e.message === "CRC not valid") {
			let r = this.parse_sub(buffer, !mode, true);
			if (r) this.mode = !this.mode;
			return r;
		}
		// TODO: if not enough data red, do nothing.
		console.error("Error", e);
	}
	return Buffer.from([]);
};

exports.modbus_rtu_sniffer.prototype.close = function() {
	this.port.close();
};
