#!/usr/bin/env node

const modbus_tcp_server = require("./modbus_tcp_server.js");

var s = new modbus_tcp_server.modbus_tcp_server(8502);

let counter_a = 0;
let data_a = Buffer.alloc(200);
s.on("data", function(packet, client) {
	if (packet.client !== 1) return;
	if (packet.fc !== 4) {
		throw new Error("Not implemented");
	}
	if (++counter_a > 100) counter_a = 0;
	data_a.writeFloatBE(counter_a, 0);
	data_a.writeFloatBE(counter_a, 2*2);

	data = data_a.slice(packet.address, packet.address+packet.length*2);
	this.send(client, packet, {
		data: data,
	});
});
exports.server = s;

