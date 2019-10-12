#!/usr/bin/env node

const modbus_tcp_client = require("./modbus_tcp_client.js");

var c = new modbus_tcp_client.modbus_tcp_client("localhost", 8502);
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
