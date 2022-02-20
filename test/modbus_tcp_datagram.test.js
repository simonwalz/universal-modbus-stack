#!/usr/bin/env node

if (!process.env.DEBUG)
	console.debug = function(){};

const test = require('tape');
const modbus_datagram = require("../modbus_tcp_datagram.js");

const pipeline = function(packet) {
	return modbus_datagram.decode(
		modbus_datagram.encode(packet),
		packet.mode === "request"
	);
};
const clean_packet = function(packet) {
	delete(packet.datagram_length);
	return packet;
};

test('FC1 Request', function (t) {
	t.plan(1);
	var r = {
		"mode": "request",
		"client": 7,
		"fc": 1,
		"address": 12,
		"length": 4,
		"transaction_id": 42
	};
	var d = pipeline(r);
	t.deepEqual(clean_packet(d), r, "packet");
});

