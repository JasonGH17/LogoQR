import { galRemainder } from './galois';
import { rsGeneratorPoly } from './reedsolomon';
import Renderer from './renderer';
import { btoh, bton, ntob } from './utils';

type ECLevel = 'Q' | 'L' | 'M' | 'H';

const sizes = {
	Q: [0],
	L: [0],
	M: [0],
	H: [
		-1, 9, 16, 26, 36, 46, 60, 66, 86, 100, 122, 140, 158, 180, 197, 223,
		253, 283, 313, 341, 385,
	],
};

class LogoQR {
	private href: Array<string>;
	private mode: string;
	private version: number = 0;
	private renderer: Renderer;
	private ec: ECLevel;

	constructor(canvas: HTMLCanvasElement, href: string, ec: ECLevel) {
		this.ec = ec;
		this.mode = this.qrMode(href);
		this.href = this.encodeHref(href);
		this.renderer = new Renderer(canvas, 100, this.version, ec);
	}

	private static readonly ECC_CW_B: { [index: string]: Array<number> } = {
		L: [
			-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24,
			28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30,
			30, 30, 30, 30, 30, 30, 30,
		],
		M: [
			-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28,
			28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
			28, 28, 28, 28, 28, 28, 28,
		],
		Q: [
			-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24,
			28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30,
			30, 30, 30, 30, 30, 30, 30,
		],
		H: [
			-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30,
			28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
			30, 30, 30, 30, 30, 30, 30,
		],
	};

	private static readonly ECC_BLOCKS: { [index: string]: Array<number> } = {
		L: [
			-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8,
			9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22,
			24, 25,
		],
		M: [
			-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14,
			16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40,
			43, 45, 47, 49,
		],
		Q: [
			-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21,
			20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56,
			59, 62, 65, 68,
		],
		H: [
			-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21,
			25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63,
			66, 70, 74, 77, 81,
		],
	};

	setSize(size: number) {
		this.renderer.setSize(size);
		return this;
	}

	setPadding(pixels: number) {
		this.renderer.setPadding(pixels);
		return this;
	}

	setLogo(image: HTMLImageElement) {
		this.renderer.setImage(image);
		return this;
	}

	setLogoDimensions(dim: [number, number]) {
		this.renderer.setImageDimensions(dim);
		return this;
	}

	private encodeHref(href: string): Array<string> {
		this.version = sizes[this.ec].findIndex((val) => href.length < val);

		const segment = new Array<string>(href.length);
		for (let i = 0; i < href.length; i++) {
			const char = href[i];
			segment[i] = ntob(char.charCodeAt(0));
		}
		return segment;
	}

	private qrMode(data: string): string {
		if (/^[0-9]*$/.test(data)) return '0001';
		else if (/^[0-9A-Z $%*+.\/:-]*$/.test(data)) return '0010';
		else return '0100';
	}

	private splitSegmentToBlocks(
		segment: Readonly<string>
	): Array<Array<string>> {
		const numBlocks: number = LogoQR.ECC_BLOCKS[this.ec][this.version];
		const nEccWords: number = LogoQR.ECC_CW_B[this.ec][this.version];

		let rawCodewords: number =
			(16 * this.version + 128) * this.version + 64;
		if (this.version >= 2) {
			const numAlign: number = Math.floor(this.version / 7) + 2;
			rawCodewords -= (25 * numAlign - 10) * numAlign - 55;
			if (this.version >= 7) rawCodewords -= 36;
		}
		rawCodewords = Math.floor(rawCodewords / 8);

		const numShortBlocks: number = numBlocks - (rawCodewords % numBlocks);
		const shortBlockLen: number = Math.floor(rawCodewords / numBlocks);

		const words = (segment.match(/.{1,8}/g) ?? []) as Array<string>;

		let result: Array<Array<string>> = [];
		for (
			let blockIndex = 0, off = 0;
			blockIndex < numBlocks;
			blockIndex++
		) {
			const end: number =
				off +
				shortBlockLen -
				nEccWords +
				(blockIndex < numShortBlocks ? 0 : 1);
			let block: Array<string> = words.slice(off, end);
			result.push(block);
			off = end;
		}
		return result;
	}

	private computeEcc(
		blocks: Readonly<Array<Array<string>>>
	): Array<Array<string>> {
		const blockEccLen: number = LogoQR.ECC_CW_B[this.ec][this.version];
		const gen = rsGeneratorPoly(blockEccLen);

		const ecc = blocks.map((block) => {
			let nblock = block.map(bton);
			return galRemainder(gen, nblock);
		});

		let result: Array<Array<number>> = [];
		ecc.forEach((block) => {
			result.push([]);
			block.forEach((val) => result[result.length - 1].push(val));
		});
		return result.map((block) => block.map(ntob));
	}

	private interleaveBlocks(
		data: Readonly<Array<Array<string>>>,
		ecc: Readonly<Array<Array<string>>>
	): string {
		let result: Array<string> = [];
		for (let i = 0; i < data[data.length - 1].length; i++)
			for (let block of data) if (i < block.length) result.push(block[i]);
		for (let i = 0; i < ecc[0].length; i++)
			for (let block of ecc) result.push(block[i]);
		return result.join('');
	}

	async build() {
		return new Promise((resolve: (value: void) => void, reject) => {
			let segment =
				this.mode +
				ntob(this.href.length) +
				this.href.join('') +
				'0000';

			for (
				let i = sizes[this.ec][this.version] - (this.href.length + 2);
				i > 0;
				i--
			) {
				segment +=
					i % 2 ===
					(sizes[this.ec][this.version] - this.href.length + 2) % 2
						? '11101100'
						: '00010001';
			}

			const blocks = this.splitSegmentToBlocks(segment);
			const ecc = this.computeEcc(blocks);
			const interleaved = this.interleaveBlocks(blocks, ecc);

			/* 
			// Log data
			console.log("ECC Blocks:");
			console.table(ecc.map(b => b.map(btoh)));
			console.log(interleaved);
			 */

			this.renderer.render(interleaved);

			resolve();
		});
	}
}

export default LogoQR;
