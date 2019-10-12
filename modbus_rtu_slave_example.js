#!/usr/bin/env node

const modbus_rtu_slave = require("./modbus_rtu_slave.js");

var s = new modbus_rtu_slave.modbus_rtu_slave(process.argv[2] || '/dev/ttyUSB0', {
	"baudRate": 9600,
	"stopBits": 1,
	"dataBits": 8,
	"parity": "even"
});

let counter_a = 0;
let data_a = Buffer.alloc(200);
s.on("data", function(packet) {
	if (packet.client !== 1) return;
	if (packet.fc !== 4) {
		throw new Error("Not implemented");
	}
	if (++counter_a > 100) counter_a = 0;
	data_a.writeFloatBE(counter_a, 0);
	data_a.writeFloatBE(counter_a, 2*2);

	data = data_a.slice(packet.address, packet.address+packet.length*2);
	this.send(packet, {
		data: data,
	});
});

