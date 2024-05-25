const net = require('net');
const EventEmitter = require('events').EventEmitter;
const modbus_datagram = require("./modbus_tcp_datagram.js");

class modbus_tcp_client extends EventEmitter {
	constructor(hostname, port) {
		super();
		this.connect(hostname, port);
	}
	connect(hostname, port) {
		var _this = this;
		this.transaction_id = 0;
		this.callbacks = [];
		this.client = new net.Socket();
		this.client.setKeepAlive(true);
		this.client.connect(port, hostname || "127.0.0.1", function() {
			_this.emit("connected");
		});
		this.client.on("data", function(data) {
			try {
				var packet = modbus_datagram.decode(data, false);
				var c = _this.callbacks[packet.transaction_id];
				if (!c) throw Error("Unknown transaction id");
				delete(_this.callbacks[packet.transaction_id]);
				var error = null;
				if (c.packet.mode === packet.mode)
					error = new Error("Non matching responce mode");
				if (c.packet.client !== packet.client)
					error =new Error("Client does not match");
				if (packet.fc >= 128)
					error = new Error("Modbus Exception: " +
							packet.exception_code);
				if (c.packet.fc !== packet.fc)
					error =new Error("Function codes do not match");
				c.callback.call(this, error, packet);
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

	send(packet, callback) {
		packet.mode = "request";
		packet.transaction_id = ++this.transaction_id;
		this.callbacks[this.transaction_id] = {
			callback: callback,
			packet: packet,
		};
		this.client.write(modbus_datagram.encode(packet));
	};

	close() {
		this.__closed = true;
		this.client.end();
	};
};

exports.modbus_tcp_client = modbus_tcp_client;

