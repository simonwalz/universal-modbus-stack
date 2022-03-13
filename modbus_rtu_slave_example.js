#!/usr/bin/env node

const modbus_rtu_slave = require("./modbus_rtu_slave.js");

var s = new modbus_rtu_slave.modbus_rtu_slave({
	"path": process.argv[2] || '/dev/ttyUSB0',
	"baudRate": 9600,
	"stopBits": 1,
	"dataBits": 8,
	"parity": "even"
});

let counter_a = 0;
let data_a = Buffer.alloc(200);
let data_b = [
	true,
	false,
	false,
	false,
	false,
	false,
	false,
	false,
];
s.on("data", function(packet) {
	if (packet.client !== 1) return;
	if (packet.fc === 3 || packet.fc === 4) {
		let data = data_a.slice(packet.address, packet.address+packet.length*2);
		this.send(packet, {
			data: data,
		});
	} else if (packet.fc === 6) {
		data_a.writeUInt16BE(packet.value, packet.address*2);

		this.send(packet, {
			address: packet.address,
			value: packet.value,
		});

	} else if (packet.fc === 16) {
		packet.data.copy(data_a, packet.address, 0, packet.length*2);
		this.send(packet, {
			address: packet.address,
			length: packet.length,
		});
	} else if (packet.fc === 1 || packet.fc === 2) {
		let s = packet.address; // start
		let bytes = Math.ceil(packet.length/8);
		let data = Buffer.alloc(bytes);
		for (let i=0; i < packet.length; i++) {
			console.log("set", i, data_b[s+i], ((data_b[s+i]) << (i % 8)));
			data[Math.floor(i/8)] |= ((data_b[s+i]) << (i % 8));
		}
		console.log(data);

		this.send(packet, {
			data: data,
			bytes: bytes,
		});
	} else if (packet.fc === 5) {
		if (packet.value == 0xFF00) {
			data_b[packet.address] = true;
		}
		else if (packet.value == 0x0000) {
			data_b[packet.address] = false;
		}
		else if (packet.value == 0x5500) {
			data_b[packet.address] ^= true;
		}
		else {
			this.send(packet, {
				fc: 0x80 | packet.fc,
				exception_code: 0x03,
			});
			return;
		}

		this.send(packet, {
			value: packet.value,
		});
	} else if (packet.fc === 15) {
		let s = packet.address; // start
		let bytes = packet.bytes;
		let length = packet.length;
		let data = packet.data;
		for (let i=0; i<length; i++) {
			data_b[s+i] = !!(data[Math.floor(i/8)] & (1<<(i%8)));

		}
		this.send(packet, {
			address: packet.address,
			length: packet.length,
		});
	} else {
		throw new Error("Not implemented");
	}
});

