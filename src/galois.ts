type gf = number;

function galExponent(n: number): gf {
	n = Math.abs(n);
	if (!n) return 1;
	const calc = 2 * galExponent(n - 1);
	return calc ^ (calc > 255 ? 285 : 0);
}

function galAdd(a: gf, b: gf): gf {
	return a ^ b;
}

function galMult(a: gf, b: gf): gf {
	let ns = new Uint8Array(2);
	ns[0] = a;
	ns[1] = b;
	let acc = 0;
	for (; ns[1]; ns[1] >>= 1) {
		if (ns[1] & 1) acc ^= ns[0];
		if (ns[0] & 0x80) ns[0] = (ns[0] << 1) ^ 0b11101;
		else ns[0] <<= 1;
	}
	return acc;
}

function galRemainder(
	coeff: Readonly<Array<gf>>,
	data: Readonly<Array<gf>>
): Array<gf> {
	let result: Array<gf> = new Array(coeff.length + 1).fill(0);
	for (let byte of data) {
		const factor: number = galAdd(byte, result.shift() as gf);
		result.push(0);
		coeff.forEach((val, i) => {
			result[i] = galAdd(result[i], galMult(val, factor));
		});
	};
	result.pop();
	return result;
}

export { galExponent, galAdd, galMult, galRemainder };
