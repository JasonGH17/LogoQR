import { galMult } from './galois';

/**
 * Generates the generator polynomial needed for Reed-Solomon error correction code computation
 * @param degree
 * @returns 
 */
function rsGeneratorPoly(degree: number): Array<number> {
	let result: Array<number> = [];
	for (let i = 0; i < degree - 1; i++) result.push(0);
	result.push(1);

	let root = 1;
	for (let i = 0; i < degree; i++) {
		for (let j = 0; j < result.length; j++) {
			result[j] = galMult(result[j], root);
			if (j + 1 < result.length) result[j] ^= result[j + 1];
		}
		root = galMult(root, 2);
	}
	return result;
}

export { rsGeneratorPoly };
