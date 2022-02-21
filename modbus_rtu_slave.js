const util = require('util');
const EventEmitter = require('events').EventEmitter;

const modbus_datagram = require("./modbus_rtu_datagram.js");
const helper = require("./helper.js");

const SerialPort = require('serialport').SerialPort;

exports.modbus_rtu_slave = function(settings) {
	var _this = this;

	this.buffer = Buffer.from([]);

	this.port = new SerialPort(settings);
	this.port.on('data', function (data) {
		_this.buffer = Buffer.concat([_this.buffer, data]);

		while(_this.buffer.length !== 0) {
			let r = _this.parse(_this.buffer, true);
			if (!r) return;
			_this.buffer = r;
		}
	});

	EventEmitter.call(this);
};
util.inherits(exports.modbus_rtu_slave, EventEmitter);

exports.modbus_rtu_slave.prototype.parse = function(buffer, mode) {
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

		try {
			_this.emit("data", packet);
		} catch (err) {
			if (err.message === "Not implemented") {
				return _this.send(packet, {
					fc: 0x80 | packet.fc,
					exception_code: 0x01,
				});
			}
			if (err.code === "ERR_OUT_OF_RANGE") {
				return _this.send(packet, {
					fc: 0x80 | packet.fc,
					exception_code: 0x01,
				});
			}
			throw err;
		}


		buffer = buffer.slice(packet.datagram_length);
		//console.log("b", helper.log_datagram(buffer));

		return buffer;
	} catch(e) {
		if (e.message === "CRC not valid") {
			return Buffer.from([]);
		}
		// TODO: if not enough data red, do nothing.
		console.error("Error", e);
	}
	return Buffer.from([]);
};

exports.modbus_rtu_slave.prototype.send = function(packet, answer) {
	answer.mode = "reply";
	if (typeof answer.fc !== "number")
		answer.fc = packet.fc;
	if (typeof answer.client !== "number")
		answer.client = packet.client;
	console.debug("answer", helper.log_packet(answer));
	var datagram = modbus_datagram.encode(answer);

	this.port.write(datagram, function (err, result) {
		if (err) {
			console.log('Error while sending message', err);
		}
	});
};

exports.modbus_rtu_slave.prototype.close = function() {
	this.port.close();
};
