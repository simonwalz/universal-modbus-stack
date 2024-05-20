const net = require('net');
const EventEmitter = require('events').EventEmitter;
const modbus_datagram = require("./modbus_tcp_datagram.js");
const helper = require("./helper.js");

class modbus_tcp_server extends EventEmitter {
	constructor(port, hostname) {
		super();
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
		this.server.listen(port || 502, hostname || 'localhost', function(err) {
			_this.emit("open", err);
		});
	};

	send(client, packet, answer) {
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

	close() {
		this.server.close();
	};
};

exports.modbus_tcp_server = modbus_tcp_server;
