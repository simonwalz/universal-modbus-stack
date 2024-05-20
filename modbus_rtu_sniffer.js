const EventEmitter = require('events').EventEmitter;

const modbus_datagram = require("./modbus_rtu_datagram.js");
const helper = require("./helper.js");

class modbus_rtu_sniffer extends EventEmitter {
	constructor(settings) {
		super();

		this.buffer = Buffer.from([]);

		this.mode = true; // true = Request, false = Response
	};

	parse(data) {
		this.buffer = Buffer.concat([this.buffer, data]);

		while(this.buffer.length !== 0) {
			let r = this.parse_sub(this.buffer, this.mode);
			if (!r) return;
			this.mode = !this.mode;
			this.buffer = r;
		}
	}

	parse_sub(buffer, mode, oneshot) {
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

	close() {
		this.port.close();
	};
};

exports.modbus_rtu_sniffer = modbus_rtu_sniffer;
