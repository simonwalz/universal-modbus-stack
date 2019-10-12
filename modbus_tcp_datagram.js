const modbus_datagram = require("./modbus_datagram.js");

exports.encode = function(packet) {
	var datagram = modbus_datagram.encode(packet);
	var tcp_datagram_length = 6+datagram.length;
	var tcp_datagram = Buffer.alloc(tcp_datagram_length);
	tcp_datagram.writeUInt16BE(packet.transaction_id, 0);
	tcp_datagram.writeUInt16BE(0x0000, 2); // protocol
	tcp_datagram.writeUInt16BE(datagram.length, 4);
	datagram.copy(tcp_datagram, 6);

	return tcp_datagram;
};

exports.decode = function(tcp_datagram, mode) {
	if (!Buffer.isBuffer(tcp_datagram))
		throw new Error("No tcp datagram provided");

	if (tcp_datagram < 6) return null;
	var transaction_id = tcp_datagram.readUInt16BE(0);
	var protocol = tcp_datagram.readUInt16BE(2);
	var datagram_length = tcp_datagram.readUInt16BE(4);
	if (protocol !== 0x0000) throw new Error("unknown protocol version");
	var datagram = tcp_datagram.slice(6, 6+datagram_length);
	var packet = modbus_datagram.decode(datagram, mode);
	if (!packet) return null;
	packet.transaction_id = transaction_id;
	return packet;
};
