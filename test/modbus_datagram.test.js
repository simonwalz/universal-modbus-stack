#!/usr/bin/env node

if (!process.env.DEBUG)
	console.debug = function(){};

const test = require('tape');
const modbus_datagram = require("../modbus_rtu_datagram.js");

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

test('FC0 Error', function (t) {
	t.plan(1);
	var r = {
		"mode": "request",
		"client": 7,
		"fc": 0,
		"address": 12,
		"length": 4
	};
	t.throws(() => {
		var d = pipeline(r);
	}, {
		"name": "Error",
		"message": "unknown message"
	}, "exception");
});

for(let fc=1; fc<=4; fc++) {
	test('FC'+fc+' Request', function (t) {
		t.plan(1);
		var r = {
			"mode": "request",
			"client": 7,
			"fc": fc,
			"address": 12,
			"length": 4
		};
		var d = pipeline(r);
		t.deepEqual(clean_packet(d), r, "packet");
	});

	test('FC'+fc+' Request - less data', function (t) {
		t.plan(1);
		var r = {
			"mode": "request",
			"client": 7,
			"fc": fc
		};
		var d = pipeline(r);
		// insert defaults:
		r.address = 0;
		r.length = 0;
		t.deepEqual(clean_packet(d), r, "packet");
	});
	test('FC'+fc+' Reply', function (t) {
		t.plan(1);
		var r = {
			"mode": "reply",
			"client": 7,
			"fc": fc,
			"bytes": 2,
			"data": Buffer.from([0x1|0x20|0x80, 0x1|0x4|0x10|0x40])
		};
		var d = pipeline(r);
		t.deepEqual(clean_packet(d), r, "packet");
	});
	test('FC'+fc+' Reply -- no data', function (t) {
		t.plan(1);
		var r = {
			"mode": "reply",
			"client": 7,
			"fc": fc,
			"bytes": 2
		};
		t.throws(() => {
			var d = pipeline(r);
		}, {
			"name": "Error",
			"message": "No data provided"
		}, "exception");
	});
	test('FC'+fc+' Reply -- empty buffer', function (t) {
		t.plan(1);
		var r = {
			"mode": "reply",
			"client": 7,
			"fc": fc,
			"bytes": 2,
			"data": Buffer.from([])
		};
		var d = pipeline(r);
		r.data = Buffer.from([0, 0])
		t.deepEqual(clean_packet(d), r, "packet");
	});
	test('FC'+fc+' Reply -- no bytes', function (t) {
		t.plan(2);
		var r = {
			"mode": "reply",
			"client": 7,
			"fc": fc,
			"data": Buffer.from([0x1|0x20|0x80, 0x1|0x4|0x10|0x40])
		};
		var d = pipeline(r);
		t.deepEqual(clean_packet(d), r, "packet");
		t.equal(r.bytes, 2, "bytes");
	});
};

for(let fc=5; fc<=6; fc++) {
	test('FC'+fc+' Request', function (t) {
		t.plan(1);
		var r = {
			"mode": "request",
			"client": 7,
			"fc": fc,
			"address": 12,
			"value": 42
		};
		var d = pipeline(r);
		t.deepEqual(clean_packet(d), r, "packet");
	});
	test('FC'+fc+' Request -- no data', function (t) {
		t.plan(1);
		var r = {
			"mode": "request",
			"client": 7,
			"fc": fc,
			"address": 12
		};
		t.throws(() => {
			var d = pipeline(r);
		}, {
			"name": "Error",
			"message": "No data provided"
		}, "exception");
	});
	test('FC'+fc+' Request -- null data', function (t) {
		t.plan(1);
		var r = {
			"mode": "request",
			"client": 7,
			"fc": fc,
			"address": 12,
			"value": null
		};
		t.throws(() => {
			var d = pipeline(r);
		}, {
			"name": "Error",
			"message": "No data provided"
		}, "exception");
	});
	test('FC'+fc+' Request -- wrong data', function (t) {
		t.plan(1);
		var r = {
			"mode": "request",
			"client": 7,
			"fc": fc,
			"address": 12,
			"value": "Hello World"
		};
		t.throws(() => {
			var d = pipeline(r);
		}, {
			"name": "Error",
			"message": "No data provided"
		}, "exception");
	});
	test('FC'+fc+' Reply', function (t) {
		t.plan(1);
		var r = {
			"mode": "reply",
			"client": 7,
			"fc": fc,
			"address": 12,
			"value": 42
		};
		var d = pipeline(r);
		t.deepEqual(clean_packet(d), r, "packet");
	});
}

for(let fc=15; fc<=16; fc++) {
	test('FC'+fc+' Request', function (t) {
		t.plan(1);
		var r = {
			"mode": "request",
			"client": 7,
			"fc": fc,
			"address": 12,
			"length": 2,
			"data": Buffer.from([0x1|0x20|0x80, 0x1|0x4|0x10|0x40,
					0x42, 0x42])
		};
		var d = pipeline(r);
		if (fc===15) r.data=Buffer.from([0xa1]);
		t.deepEqual(clean_packet(d), r, "packet");
	});
	test('FC'+fc+' Request -- no length', function (t) {
		t.plan(1);
		var r = {
			"mode": "request",
			"client": 7,
			"fc": fc,
			"address": 12,
			"data": Buffer.from([0x1|0x20|0x80, 0x1|0x4|0x10|0x40,
					0x42, 0x42])
		};
		var d = pipeline(r);
		t.deepEqual(clean_packet(d), r, "packet");
	});
	test('FC'+fc+' Request -- no data', function (t) {
		t.plan(1);
		var r = {
			"mode": "request",
			"client": 7,
			"fc": fc,
			"address": 12
		};
		t.throws(() => {
			var d = pipeline(r);
		}, {
			"name": "Error",
			"message": "No data provided"
		}, "exception");
	});
	test('FC'+fc+' Request -- wrong data', function (t) {
		t.plan(1);
		var r = {
			"mode": "request",
			"client": 7,
			"fc": fc,
			"address": 12,
			"data": "Hello World"
		};
		t.throws(() => {
			var d = pipeline(r);
		}, {
			"name": "Error",
			"message": "No data provided"
		}, "exception");
	});
	test('FC'+fc+' Reply', function (t) {
		t.plan(1);
		var r = {
			"mode": "reply",
			"client": 7,
			"fc": fc,
			"address": 12,
			"length": 2
		};
		var d = pipeline(r);
		t.deepEqual(clean_packet(d), r, "packet");
	});
}
test('Exception', function (t) {
	t.plan(1);
	var r = {
		"mode": "reply",
		"client": 7,
		"fc": 129,
		"exception_code": 42
	};
	var d = pipeline(r);
	t.deepEqual(clean_packet(d), r, "packet");
});
test('decode -- not enough data', function (t) {
	t.plan(1);
	var packet = {
		"mode": "request",
		"client": 7,
		"fc": 1,
		"address": 12,
		"length": 4
	};
	var datagram = modbus_datagram.encode(packet);
	datagram = datagram.slice(0, 5);
	var decoded_packet = modbus_datagram.decode(
		datagram,
		packet.mode === "request"
	);
	t.equal(decoded_packet, null, "not enogh data");
});
