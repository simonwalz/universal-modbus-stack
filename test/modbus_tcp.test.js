#!/usr/bin/env node

if (!process.env.DEBUG)
	console.debug = function(){};

const test = require('tape');

const server = require("../modbus_tcp_server_example.js");
const modbus_tcp_client = require("../modbus_tcp_client.js");

test('modbus tcp, check server started', function(t) {
	t.plan(1);

	if (server.server.server.listening) {
		t.ok(1, "already running");
	} else {
		server.server.on("open", function(err) {
			t.equal(err, undefined, "running");
		});
	}
});

test('modbus tcp, client 1', function (t) {
	t.plan(4);
	var c = new modbus_tcp_client.modbus_tcp_client("localhost", 8502);

	c.send({
		"client": 1,
		"fc": 4,
		"address": 0,
		"length": 42
	}, function(err, answer) {
		if (err) {
			console.error("Error:", err);
			t.ok(0, "failed");
			c.close();
			server.server.close();
			return;
		}
		t.equal(answer.client, 1, "client");
		t.equal(answer.fc, 4, "fc");
		t.equal(answer.bytes, 84, "bytes");
		t.equal(answer.data.readFloatBE(0), 1, "data[0]");
		c.close();
		server.server.close();
	});
});
