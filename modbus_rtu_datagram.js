const crc16modbus = require("crc/crc16modbus");
const modbus_datagram = require("./modbus_datagram.js");
const helper = require("./helper.js");

exports.decode = function(datagram, mode) {
	var p = modbus_datagram.decode(datagram, mode);
	if (!p) return null;
	if (datagram.length < p.datagram_length+2) return null;
	var crc = datagram.readUInt16LE(p.datagram_length);
	var d = datagram.slice(0, p.datagram_length);
	var crc_calc = crc16modbus(d);
	if (crc_calc !== crc) {
		console.debug("datagram", helper.log_datagram(datagram));
		console.debug("CRC", crc_calc, crc);
		throw new Error("CRC not valid");
	}
	p.datagram_length += 2;
	return p;
};

exports.encode = function(packet) {
	var datagram = modbus_datagram.encode(packet);
	c = Buffer.alloc(datagram.length+2);
	datagram.copy(c);
	var crc = crc16modbus(datagram);
	c.writeUInt16LE(crc, datagram.length);
	return c;
};

