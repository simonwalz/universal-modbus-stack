const helper = require("./helper.js");

exports.decode = function(datagram, mode) {
	if (!Buffer.isBuffer(datagram))
		throw new Error("No datagram provided");
	if (datagram.length < 3) return null;
	var p = {
		"mode": "unknown",
		"client": datagram.readUInt8(0),
		"fc": datagram.readUInt8(1),
		"datagram_length": 0
	}
	if (mode && (p.fc === 1 || p.fc === 2)) {
		p.mode = "request";
		p.datagram_length = 6;
		if (datagram.length < p.datagram_length) return null;
		p.address = datagram.readUInt16BE(2);
		p.length = datagram.readUInt16BE(4);
	}
	else if (!mode && (p.fc === 1 || p.fc === 2)) {
		p.mode = "reply";
		p.bytes = datagram.readUInt8(2);
		p.datagram_length = 3+p.bytes;
		if (datagram.length < p.datagram_length) return null;
		p.data = datagram.slice(3, 3 + p.bytes);
	}
	else if (mode && (p.fc === 3 || p.fc === 4)) {
		p.mode = "request";
		p.datagram_length = 6;
		if (datagram.length < p.datagram_length) return null;
		p.address = datagram.readUInt16BE(2);
		p.length = datagram.readUInt16BE(4);
	}
	else if (!mode && (p.fc === 3 || p.fc === 4)) {
		p.mode = "reply";
		p.bytes = datagram.readUInt8(2);
		p.datagram_length = 3+p.bytes;
		if (datagram.length < p.datagram_length) return null;
		p.data = datagram.slice(3, 3 + p.bytes);
	}
	else if (mode && (p.fc === 5 || p.fc === 6)) {
		p.mode = "request";
		p.datagram_length = 6;
		if (datagram.length < p.datagram_length) return null;
		p.address = datagram.readUInt16BE(2);
		p.value = datagram.readUInt16BE(4);
	}
	else if (!mode && (p.fc === 5 || p.fc === 6)) {
		p.mode = "reply";
		p.datagram_length = 6;
		if (datagram.length < p.datagram_length) return null;
		p.address = datagram.readUInt16BE(2);
		p.value = datagram.readUInt16BE(4);
	}
	else if (mode && (p.fc === 15 || p.fc === 16)) {
		p.mode = "request";
		if (datagram.length < 6) return null;
		p.address = datagram.readUInt16BE(2);
		p.length = datagram.readUInt16BE(4);
		p.bytes = datagram.readUint8(6);
		p.datagram_length = 7 + p.bytes;
		if (datagram.length < p.datagram_length) return null;
		p.data = datagram.slice(7, 7 + p.bytes);
	}
	else if (!mode && (p.fc === 15 || p.fc === 16)) {
		p.mode = "reply";
		p.datagram_length = 6;
		if (datagram.length < p.datagram_length) return null;
		p.address = datagram.readUInt16BE(2);
		p.length = datagram.readUInt16BE(4);
	}
	else if (!mode && (p.fc >= 129)) {
		p.mode = "reply";
		p.datagram_length = 3;
		if (datagram.length < p.datagram_length) return null;
		p.exception_code = datagram.readUInt8(2);
	}
	else {
		console.debug("datagram", helper.log_datagram(datagram));
		throw new Error("unknown message");
	}

	return p;
};

exports.encode = function(p) {
	var datagram_length;
	var c;
	if (p.mode === "request" && (p.fc === 1 || p.fc === 2)) {
		datagram_length = 6;
		c = Buffer.alloc(datagram_length);
		c.writeUInt8(p.client, 0);
		c.writeUInt8(p.fc, 1);
		c.writeUInt16BE(p.address, 2);
		c.writeUInt16BE(p.length, 4);
	}
	else if (p.mode === "reply" && (p.fc === 1 || p.fc === 2)) {
		if (!Buffer.isBuffer(p.data))
			throw new Error("No data provided");
		if (typeof p.bytes === "undefined") p.bytes = p.data.length;
		datagram_length = 3+p.bytes;
		c = Buffer.alloc(datagram_length);
		c.writeUInt8(p.client, 0);
		c.writeUInt8(p.fc, 1);
		c.writeUInt8(p.bytes, 2);
		p.data.copy(c, 3, 0, Math.min(p.data.length, p.bytes));
	}
	else if (p.mode === "request" && (p.fc === 3 || p.fc === 4)) {
		datagram_length = 6;
		c = Buffer.alloc(datagram_length);
		c.writeUInt8(p.client, 0);
		c.writeUInt8(p.fc, 1);
		c.writeUInt16BE(p.address, 2);
		c.writeUInt16BE(p.length, 4);
	}
	else if (p.mode === "reply" && (p.fc === 3 || p.fc === 4)) {
		if (!Buffer.isBuffer(p.data))
			throw new Error("No data provided");
		if (typeof p.bytes === "undefined") p.bytes = p.data.length;
		datagram_length = 3+p.bytes;
		c = Buffer.alloc(datagram_length);
		c.writeUInt8(p.client, 0);
		c.writeUInt8(p.fc, 1);
		c.writeUInt8(p.bytes, 2);
		p.data.copy(c, 3, 0, Math.min(p.data.length, p.bytes));
	}
	else if (p.mode === "request" && (p.fc === 5 || p.fc === 6)) {
		datagram_length = 6;
		c = Buffer.alloc(datagram_length);
		c.writeUInt8(p.client, 0);
		c.writeUInt8(p.fc, 1);
		c.writeUInt16BE(p.address, 2);
		if (typeof p.value !== "number" && typeof p.value !== "boolean")
			throw new Error("No data provided");
		c.writeUInt16BE(p.value, 4);
	}
	else if (p.mode === "reply" && (p.fc === 5 || p.fc === 6)) {
		datagram_length = 6;
		c = Buffer.alloc(datagram_length);
		c.writeUInt8(p.client, 0);
		c.writeUInt8(p.fc, 1);
		c.writeUInt16BE(p.address, 2);
		if (typeof p.value !== "number" && typeof p.value !== "boolean")
			throw new Error("No data provided");
		c.writeUInt16BE(p.value, 4);
	}
	else if (p.mode === "request" && (p.fc === 15 || p.fc === 16)) {
		if (!Buffer.isBuffer(p.data))
			throw new Error("No data provided");
		if (p.fc === 15) {
			if (typeof p.length !== "number") {
				p.bytes = p.data.length;
				p.length = p.bytes * 8;
			} else {
				p.bytes = Math.ceil(p.length / 8);
			}
		}
		if (p.fc === 16) {
			if (typeof p.length !== "number") {
				p.bytes = p.data.length;
				p.length = Math.ceil(p.bytes / 2);
			} else {
				p.bytes = p.length * 2;
			}
			p.bytes = p.length * 2;
		}
		p.bytes = Math.min(p.bytes, 255);
		datagram_length = 7 + p.bytes;
		c = Buffer.alloc(datagram_length);
		c.writeUInt8(p.client, 0);
		c.writeUInt8(p.fc, 1);
		c.writeUInt16BE(p.address, 2);
		c.writeUInt16BE(p.length, 4);
		c.writeUInt8(p.bytes, 6);
		p.data.copy(c, 7, 0, Math.min(p.data.length, p.bytes));
	}
	else if (p.mode === "reply" && (p.fc === 15 || p.fc === 16)) {
		datagram_length = 6;
		c = Buffer.alloc(datagram_length);
		c.writeUInt8(p.client, 0);
		c.writeUInt8(p.fc, 1);
		c.writeUInt16BE(p.address, 2);
		c.writeUInt16BE(p.length, 4);
	}
	else if (p.mode === "reply" && (p.fc >= 129)) {
		datagram_length = 3;
		c = Buffer.alloc(datagram_length);
		c.writeUInt8(p.client, 0);
		c.writeUInt8(p.fc, 1);
		c.writeUInt8(p.exception_code, 2);
	}
	else {
		console.debug("packet", helper.log_packet(p));
		throw new Error("unknown message");
	}

	return c;
};

