#!/usr/bin/env node

exports.get_datatype = function(datatype) {
	return datatype
			.replace(/-swap$/i, "")
			.replace(/^u/, "U")
			.replace(/le$/, "LE")
			.replace(/be$/, "BE")
			.replace(/^bool$/i, "boolean")
			.replace(/integer/i, "Int")
			.replace(/number/i, "Int")
			.replace(/int/i, "Int")
			.replace(/float/i, "Float")
			.replace(/double/i, "Double")
			.replace(/^(U?)Int(16)?$/, "$1Int16BE")
			.replace(/^(U?)Int([0-9]+)$/, "$1Int$2BE")
			.replace(/^(U?)Int8BE$/, "$1Int8")
			.replace(/^(Float|Double)$/, "$1BE")
			.replace(/^(U?Int64)/, "Big$1");
}

exports.read = function(datatype, buffer) {
	if (typeof datatype !== "string") datatype = "uint16";
	if (datatype.match(/-swap$/i)) {
		buffer.swap16();
	}
	datatype = exports.get_datatype(datatype);
	if (datatype === "boolean") {
		var d = buffer.readUInt16BE(0);
		return d[0] != 0;
	}
	if (datatype === "UInt24BE") {
		return buffer.readUIntBE(0, 3);
	}
	if (datatype === "UInt24LE") {
		return buffer.readUIntLE(0, 3);
	}
	if (datatype === "Int24BE") {
		return buffer.readIntBE(0, 3);
	}
	if (datatype === "Int24LE") {
		return buffer.readIntLE(0, 3);
	}
	if (datatype === "UInt48BE") {
		return buffer.readUIntBE(0, 6);
	}
	if (datatype === "UInt48LE") {
		return buffer.readUIntLE(0, 6);
	}
	if (datatype === "Int48BE") {
		return buffer.readIntBE(0, 6);
	}
	if (datatype === "Int48LE") {
		return buffer.readIntLE(0, 6);
	}
	let m = datatype.match(/^string\((?<length>[0-9]+)\)$/i);
	if (m) {
		return buffer.toString("utf-8", 0, +m.groups.length);
	}
	if (typeof buffer["read" + datatype] === "function") {
		return buffer["read" + datatype](0);
	}
	throw new Error("datatype unknown: " + datatype);
	//return buffer.readUInt16BE(0);
};

exports.datatype_get_size = function(datatype) {
	if (datatype.match(/^Double|^Big(?:U)?Int64[BL]E$/))
		return 8;
	if (datatype.match(/^(?:U)?Int48[BL]E$/))
		return 6;
	if (datatype.match(/^Float|^(?:U)?Int32[BL]E$/))
		return 4;
	if (datatype.match(/^(?:U)?Int24[BL]E$/))
		return 3;
	if (datatype.match(/^(?:U)?Int(16|8)[BL]E$/))
		return 2;
	if (datatype.match(/^(?:U)?Int8$|^boolean$/))
		return 2;
	let m = datatype.match(/^string\((?<length>[0-9]+)\)/);
	if (m) {
		return +m.groups.length;
	}
	throw new Error("datatype unknown (get size): " + datatype);
}

exports.write = function(datatype, value) {
	if (typeof datatype !== "string") datatype = "uint16";
	let do_swap = datatype.match(/-swap$/i);
	datatype = exports.get_datatype(datatype);
	let buffer_size = exports.datatype_get_size(datatype);
	let buffer = Buffer.alloc(buffer_size);

	let m = datatype.match(/^string\((?<length>[0-9]+)\)$/i);
	if (m) {
		buffer.write(value, 0, +m.groups.length, "utf-8");
	}
	else if (datatype === "boolean") {
		buffer.writeUInt16BE((value ? 1 : 0), 0);
	}
	else if (datatype === "UInt24BE") {
		buffer.writeUIntBE(value, 0, 3);
	}
	else if (datatype === "UInt24LE") {
		buffer.writeUIntLE(value, 0, 3);
	}
	else if (datatype === "Int24BE") {
		buffer.writeIntBE(value, 0, 3);
	}
	else if (datatype === "Int24LE") {
		buffer.writeIntLE(value, 0, 3);
	}
	else if (datatype === "UInt48BE") {
		buffer.writeUIntBE(value, 0, 6);
	}
	else if (datatype === "UInt48LE") {
		buffer.writeUIntLE(value, 0, 6);
	}
	else if (datatype === "Int48BE") {
		buffer.writeIntBE(value, 0, 6);
	}
	else if (datatype === "Int48LE") {
		buffer.writeIntLE(0, 6);
	}
	else if (typeof buffer["write" + datatype] === "function") {
		buffer["write" + datatype](value, 0);
	} else {
		throw new Error("datatype unknown: " + datatype);
	}

	if (do_swap) {
		buffer.swap16();
	}
	return buffer;
};
