const EventEmitter = require('events').EventEmitter;

const modbus_datagram = require("./modbus_rtu_datagram.js");
const helper = require("./helper.js");

const SerialPort = require('serialport').SerialPort;

class modbus_rtu_master extends EventEmitter {
	constructor(settings) {
		super();
		var _this = this;

		this.timeout = 3000;

		this.buffer = Buffer.from([]);
		this.callback = null;
		this._write_buffer = [];
		this._write_timer = null;

		this.port = new SerialPort(settings);
		this.port.on('data', function (data) {
			_this.buffer = Buffer.concat([_this.buffer, data]);

			while(_this.buffer.length !== 0) {
				let r = _this.parse(_this.buffer, false);
				if (!r) return;
				_this.buffer = r;
			}
		});
	};

	parse(buffer, mode) {
		var _this = this;
		if (buffer.length == 0) return Buffer.from([]);
		if (buffer.length < 3) {
			console.debug("rest buffer", helper.log_datagram(buffer));
			return Buffer.from([]);
		}
		try {
			var packet = modbus_datagram.decode(buffer, mode);
			if (!packet) return null;

			buffer = buffer.slice(packet.datagram_length);

			//console.log("b", helper.log_datagram( buffer.slice(0,
			//		packet.buffer_length)));
			//console.debug(new Date(), helper.log_packet(packet));

			var c = _this.callback;
			if (!c) throw new Error("Unhandled answer recieved.");
			_this.callback = null;

			var error = null;
			if (c.packet.mode === packet.mode)
				error = new Error("Non matching responce mode");
			if (packet.fc >= 128)
				error = new Error("Modbus Exception: " +
						packet.exception_code);
			if (c.packet.client !== packet.client)
				error =new Error("Client does not match");
			if (c.packet.fc !== packet.fc)
				error =new Error("Function codes do not match");

			clearTimeout(this._write_timer);
			this._write_buffer.shift();
			this._write();
			c.callback.call(this, error, packet);

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

	send(packet, callback) {
		packet.mode = "request";

		this._write_buffer.push({
			packet: packet,
			callback: callback,
		});

		if (this._write_buffer.length === 1) {
			this._write();
		}
	};

	_write() {
		var _this = this;
		if (this._write_buffer.length < 1) return;

		var data = this._write_buffer[0];

		this.callback = data;

		this.port.write(modbus_datagram.encode(data.packet), function(err) {
			if (err) {
				console.log('Error while sending message', err);
			}
		});

		this._write_timer = setTimeout(function() {
			_this._write_buffer.shift();
			_this.callback = null;
			_this._write();
			data.callback(new Error("Timeout."));
		}, this.timeout);
	};

	close() {
		this.port.close();
	};
}:
exports.modbus_rtu_master = modbus_rtu_master;
