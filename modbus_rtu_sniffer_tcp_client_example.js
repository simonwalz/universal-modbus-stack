#!/usr/bin/env node

const modbus_rtu_sniffer_tcp_client = require("./modbus_rtu_sniffer_tcp_client.js");

var c = new modbus_rtu_sniffer_tcp_client.modbus_rtu_sniffer_tcp_client(
		"172.20.20.206", 8899);
c.on("data", function(packet) {
	console.log(packet);
});
