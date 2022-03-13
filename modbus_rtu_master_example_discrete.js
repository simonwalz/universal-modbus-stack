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
	"fc": 1,
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
false && process.argv[3] && c.send({
	"client": 1,
	"fc": 5,
	"address": 1,
	"value": 0xFF00
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

true && process.argv[3] && c.send({
	"client": 1,
	"fc": 15,
	"address": 0,
	"length": 8,
	"data": new Buffer.from([0xF0]),
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
