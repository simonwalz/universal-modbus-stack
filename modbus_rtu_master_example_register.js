#!/usr/bin/env node

const modbus_rtu_master = require("./modbus_rtu_master.js");

var c = new modbus_rtu_master.modbus_rtu_master({
	"path": process.argv[2] || '/dev/ttyUSB0',
	"baudRate": 9600,
	"stopBits": 1,
	"dataBits": 8,
	"parity": "even"
});
(!process.argv[3]) && c.send({
	"client": 1,
	"fc": 3,
	"address": 0,
	"length": 8
}, function(err, answer) {
	if (err) {
		console.error("Error:", err);
		c.close();
		return;
	}
	console.log("answer", answer);
	//console.log("answer", answer.data.readFloatBE(0));
	c.close();
});
process.argv[3] == 1 && c.send({
	"client": 1,
	"fc": 6,
	"address": 3,
	"value": 42
}, function(err, answer) {
	if (err) {
		console.error("Error:", err);
		c.close();
		return;
	}
	console.log("answer", answer);
	//console.log("answer", answer.data.readFloatBE(0));
	c.close();
});

process.argv[3] == 2 && c.send({
	"client": 1,
	"fc": 16,
	"address": 0,
	"length": 4,
	"data": new Buffer.from([0, 1, 0, 2, 0, 3, 0, 4]),
}, function(err, answer) {
	if (err) {
		console.error("Error:", err);
		c.close();
		return;
	}
	console.log("answer", answer);
	//console.log("answer", answer.data.readFloatBE(0));
	c.close();
});
