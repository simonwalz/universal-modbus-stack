const net = require('net');
const modbus_rtu_sniffer = require("./modbus_rtu_sniffer.js");

class modbus_rtu_sniffer_tcp_client extends modbus_rtu_sniffer {
	constructor(hostname, port) {
		super();
		this.connect(hostname, port);
	}
	connect(hostname, port) {
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
					_this.connect(hostname, port);
				}, 1000);
			}
		});
	};

	close() {
		this.__closed = true;
		this.client.end();
	};

};
exports.modbus_rtu_sniffer_tcp_client = modbus_rtu_sniffer_tcp_client;
