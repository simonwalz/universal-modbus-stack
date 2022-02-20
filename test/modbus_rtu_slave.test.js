#!/usr/bin/env node

if (!process.env.DEBUG)
	console.debug = function(){};

const test = require('tape');
const proxyquire = require('proxyquire');

var cb_data = null;
var cb_write = null;

const modbus_datagram = require("../modbus_rtu_datagram.js");
const modbus_rtu_slave = proxyquire('../modbus_rtu_slave.js', {
	serialport: function() {
		return {
			on: function(eventname, callback) {
				cb_data = callback;
			},
			write: function(data, callback) {
				if (cb_write)
					cb_write(data);
				if (typeof callback === "function")
					callback(null);
			},
		};
	}
});
var s = new modbus_rtu_slave.modbus_rtu_slave();

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
let data_b = Buffer.alloc(200);
let counter_b = 0;
s.on("data", function(packet) {
	if (packet.client !== 2) return;
	if (packet.fc !== 4) {
		throw new Error("Not implemented");
	}
	if (++counter_b > 100) counter_b = 0;
	data_b.writeFloatBE(counter_b, 0);
	data_b.writeFloatBE(counter_b, 2*2);

	data = data_b.slice(packet.address, packet.address+packet.length*2);
	this.send(packet, {
		data: data,
	});
});



test('modbus rtu slave, client 1', function (t) {
	t.plan(4);

	var buffer = modbus_datagram.encode({
		"mode": "request",
		"client": 1,
		"fc": 4,
		"address": 0,
		"length": 42
	});
	cb_write = function(data) {
		var d = modbus_datagram.decode(data, false);
		t.equal(d.client, 1, "client");
		t.equal(d.fc, 4, "fc");
		t.equal(d.bytes, 84, "bytes");
		t.equal(d.data.readFloatBE(0), 1, "data[0]");
	};
	cb_data(buffer);
});

test('modbus rtu slave, client 1 -- request 2', function (t) {
	t.plan(4);

	var buffer = modbus_datagram.encode({
		"mode": "request",
		"client": 1,
		"fc": 4,
		"address": 0,
		"length": 42
	});
	cb_write = function(data) {
		var d = modbus_datagram.decode(data, false);
		t.equal(d.client, 1, "client");
		t.equal(d.fc, 4, "fc");
		t.equal(d.bytes, 84, "bytes");
		t.equal(d.data.readFloatBE(0), 2, "data[0]");
	};
	cb_data(buffer);
});

test('modbus rtu slave, client 2', function (t) {
	t.plan(4);

	var buffer = modbus_datagram.encode({
		"mode": "request",
		"client": 2,
		"fc": 4,
		"address": 0,
		"length": 42
	});
	cb_write = function(data) {
		var d = modbus_datagram.decode(data, false);
		t.equal(d.client, 2, "client");
		t.equal(d.fc, 4, "fc");
		t.equal(d.bytes, 84, "bytes");
		t.equal(d.data.readFloatBE(0), 1, "data[0]");
	};
	cb_data(buffer);
});


test('modbus rtu slave, partial send', function (t) {
	t.plan(4);

	var buffer = modbus_datagram.encode({
		"mode": "request",
		"client": 1,
		"fc": 4,
		"address": 0,
		"length": 42
	});
	cb_write = function(data) {
		var d = modbus_datagram.decode(data, false);
		t.equal(d.client, 1, "client");
		t.equal(d.fc, 4, "fc");
		t.equal(d.bytes, 84, "bytes");
		t.equal(d.data.readFloatBE(0), 3, "data[0]");
	};
	b1 = buffer.slice(0, 5);
	b2 = buffer.slice(5);
	cb_data(b1);
	cb_data(b2);
});

