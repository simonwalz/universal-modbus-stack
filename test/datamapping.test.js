#!/usr/bin/env node

if (!process.env.DEBUG)
	console.debug = function(){};

const test = require('tape');
const { read, write } = require("../datamapping/");

let b = Buffer.from([192, 1, 2, 3, 4, 5, 6, 7]);

datatypes = ["uint16", "int16", "uint16BE", "int16BE", "uint16LE", "int16LE", "uint32BE", "int32BE", "uint24BE", "int24BE", "uint32BE", "int32BE", "uint48BE", "int48BE", "uint64BE", "int64BE", "floatBE", "floatLE", "float", "doubleBE", "doubleLE", "double", "int", "integer64" ];


let t2 = (dt) => {
	test('datamapping - ' + dt, function (t) {
		t.plan(2);
		let d = read(dt, b);
		console.debug(dt, d);
		let b2 = write(dt, d);
		let b1 = b.subarray(0, b2.length);
		console.debug(dt, b1, b2, Buffer.compare(b1, b2));
		t.ok(!Buffer.compare(b1, b2), "compare buffers");
		let d2 = read(dt, b2);
		t.equal(
			d,
			d2,
			"compare values");
	});
};
datatypes.forEach(t2);

test("set buffer", (t)=> {
	t.plan(1);
	b = Buffer.from([0, 1]);
	t.ok(1);
});
t2("boolean");
t2("bool");
test("set buffer", (t)=> {
	t.plan(1);
	b = Buffer.from([7, 0]);
	t.ok(1);
});
t2("uint8");
t2("int8");

test("set buffer", (t)=> {
	t.plan(1);
	b = Buffer.from([65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77]);
	t.ok(1);
});
t2("string(4)");
t2("string(8)");
t2("string(12)");

