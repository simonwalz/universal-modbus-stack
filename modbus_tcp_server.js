const net = require('net');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const modbus_datagram = require("./modbus_tcp_datagram.js");
const helper = require("./helper.js");

exports.modbus_tcp_server = function(port, hostname) {
	var _this = this;
	this.callbacks = [];

	this.server = net.createServer(function(client) {
		client.setKeepAlive(true);
		client.on('data', function(data) {
			var packet = modbus_datagram.decode(data, true);
			if (packet.mode !== "request") return;
			try {
				_this.emit("data", packet, client);
			} catch (err) {
				if (err.message === "Not implemented") {
					return _this.send(client, packet, {
						fc: 0x80 | packet.fc,
						exception_code: 0x01,
					});
				}
				if (err.code === "ERR_OUT_OF_RANGE") {
					return _this.send(client, packet, {
						fc: 0x80 | packet.fc,
						exception_code: 0x01,
					});
				}
				throw err;
			}
		});
	});
	this.server.listen(port || 502, hostname || '127.0.0.1');
	EventEmitter.call(this);
};
util.inherits(exports.modbus_tcp_server, EventEmitter);

exports.modbus_tcp_server.prototype.send = function(client, packet, answer) {
	answer.mode = "reply";
	answer.transaction_id = packet.transaction_id;
	answer.client = packet.client;
	if (typeof answer.fc !== "number")
		answer.fc = packet.fc;
	if (typeof answer.client !== "number")
		answer.client = packet.client;
	console.debug("answer", helper.log_packet(answer));
	var datagram = modbus_datagram.encode(answer);
	client.write(datagram);
};

exports.modbus_tcp_server.prototype.close = function() {
	this.server.close();
};
