const net = require('net');
const util = require('util');
const modbus_rtu_sniffer = require("./modbus_rtu_sniffer.js");

exports.modbus_rtu_sniffer_tcp_client = function(hostname, port) {
	var _this = this;
	this.client = new net.Socket();
	this.client.setKeepAlive(true);
	this.client.connect(port, hostname || "127.0.0.1", function() {
		_this.emit("connected");
	});
	this.client.on("data", function(data) {
		try {
			_this.parse(data);
		} catch(err) {
			console.warn("Error:", err);
		}
	});
	this.client.on('close', function() {
		//console.log('Connection closed');
		if (!_this.__closed) {
			setTimeout(function() {
				exports.modbus_rtu_sniffer_tcp_client.call(_this);
			}, 1000);
		}
	});
	modbus_rtu_sniffer.modbus_rtu_sniffer.call(this);
};
util.inherits(exports.modbus_rtu_sniffer_tcp_client, modbus_rtu_sniffer.modbus_rtu_sniffer);

exports.modbus_rtu_sniffer_tcp_client.prototype.close = function() {
	this.__closed = true;
	this.client.end();
};

