#!/usr/bin/env node

const modbus_rtu_master = require("./modbus_rtu_master.js");

var c = new modbus_rtu_master.modbus_rtu_master({
	"path": process.argv[2] || '/dev/ttyUSB0',
	"baudRate": 9600,
	"stopBits": 1,
	"dataBits": 8,
	"parity": "even"
});
c.send({
	"client": 1,
	"fc": 4,
	"address": 0,
	"length": 42
}, function(err, answer) {
	if (err) {
		console.error("Error:", err);
		c.close();
		return;
	}
	console.log("answer", answer);
	console.log("answer", answer.data.readFloatBE(0));
	c.close();
});
