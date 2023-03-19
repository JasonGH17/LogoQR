type ECLevel = 'Q' | 'L' | 'M' | 'H';

class Renderer {
	private canvas: HTMLCanvasElement;
	private context: CanvasRenderingContext2D;
	private dim: number;
	private version: number;
	private padding: number = 0;
	private logo: HTMLImageElement = new Image();
	private logoWidth: number = 0;
	private logoHeight: number = 0;
	private pixelSize: number = 5;
	private nmods: number;
	private formatBits: number;
	private canvasData: Array<Array<number>>;
	private functionMods: Array<Array<number>>;

	private static readonly ECC_FORMAT_BITS: { [index: string]: number } = {
		L: 1,
		M: 0,
		Q: 3,
		H: 2,
	};

	/**
	 *
	 * @param canvas canvas where the QRCode will be rendered
	 * @param dim width and height of the final qrcode
	 */
	constructor(
		canvas: HTMLCanvasElement,
		dim: number,
		version: number,
		ec: ECLevel
	) {
		this.version = version;
		this.formatBits = Renderer.ECC_FORMAT_BITS[ec];

		canvas.width = dim;
		canvas.height = dim;

		this.nmods = version * 4 + 17;

		this.canvasData = Array.apply(null, new Array(this.nmods)) as Array<
			Array<number>
		>;
		this.functionMods = Array.apply(null, new Array(this.nmods)) as Array<
			Array<number>
		>;
		for (let i = 0; i < this.nmods; i++) {
			this.canvasData[i] = Array.apply(
				null,
				new Array(this.nmods)
			) as Array<number>;
			this.functionMods[i] = Array.apply(
				null,
				new Array(this.nmods)
			) as Array<number>;
		}

		this.canvas = canvas;
		this.context = canvas.getContext('2d') as CanvasRenderingContext2D;
		this.dim = dim;
	}

	setSize(size: number) {
		this.canvas.width = size;
		this.canvas.height = size;

		this.dim = size;
	}

	setPadding(padding: number) {
		this.padding = padding + (padding % 2);
	}

	setImage(img: HTMLImageElement) {
		this.logo = img;
		this.logoWidth = img.width;
		this.logoHeight = img.height;
	}

	setImageDimensions(dim: [number, number]) {
		this.logoWidth = dim[0];
		this.logoHeight = dim[1];
	}

	private drawRect(x: number, y: number, color: string) {
		this.context.fillStyle = color;
		this.context.fillRect(x, y, this.pixelSize, this.pixelSize);
	}

	private renderPositionModules() {
		const centers: Array<[number, number]> = [
			[3, 3],
			[this.nmods - 4, 3],
			[3, this.nmods - 4],
		];
		for (const [cx, cy] of centers) {
			for (let dy = -4; dy <= 4; dy++) {
				for (let dx = -4; dx <= 4; dx++) {
					const dist: number = Math.max(Math.abs(dx), Math.abs(dy));
					const x: number = cx + dx;
					const y: number = cy + dy;
					if (0 <= x && x < this.nmods && 0 <= y && y < this.nmods) {
						this.functionMods[x][y] = +(dist != 2 && dist != 4);
					}
				}
			}
		}
	}

	private renderTimingModules() {
		for (let n = 0; n < this.nmods; n++) {
			this.functionMods[6][n] = +(n % 2 === 0);
			this.functionMods[n][6] = +(n % 2 === 0);
		}
	}

	private renderAlignmentModules() {
		if (this.version == 1) return;
		const positions = [6];
		const numAlign: number = Math.floor(this.version / 7) + 2;
		const step: number =
			this.version == 32
				? 26
				: Math.ceil((this.nmods - 13) / (numAlign * 2 - 2)) * 2;
		for (let pos = this.nmods - 7; positions.length < numAlign; pos -= step)
			positions.splice(1, 0, pos);

		positions.forEach((cx, i) => {
			positions.forEach((cy, j) => {
				if (
					(i == 0 && j == 0) ||
					(i == 0 && j == numAlign - 1) ||
					(i == numAlign - 1 && j == 0)
				)
					return;
				for (let dy = -2; dy <= 2; dy++) {
					for (let dx = -2; dx <= 2; dx++) {
						this.functionMods[cx + dx][cy + dy] = +(
							Math.max(Math.abs(dx), Math.abs(dy)) != 1
						);
					}
				}
			});
		});
	}

	private renderTempFormatModules() {
		// TL
		for (let i = 0; i <= 5; i++) this.functionMods[8][i] = 0;
		this.functionMods[8][7] = 0;
		this.functionMods[8][8] = 0;
		this.functionMods[7][8] = 0;
		for (let i = 9; i < 15; i++) this.functionMods[14 - i][8] = 0;
		//TR
		for (let i = 0; i < 8; i++)
			this.functionMods[this.nmods - 1 - i][8] = 0;
		//BL
		for (let i = 8; i < 15; i++)
			this.functionMods[8][this.nmods - 15 + i] = 0;
		this.functionMods[8][this.nmods - 8] = 1;
	}

	private renderFormatModules(mask: number) {
		let bits: number = 0;
		let rem: number = (this.formatBits << 3) | mask;
		for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 1335);
		bits = ((this.formatBits << 3) | (mask << 10) | rem) ^ 21522;

		for (let i = 0; i <= 5; i++)
			this.functionMods[8][i] = +(((bits >>> i) & 1) != 0);
		this.functionMods[8][7] = +(((bits >>> 6) & 1) != 0);
		this.functionMods[8][8] = +(((bits >>> 7) & 1) != 0);
		this.functionMods[7][8] = +(((bits >>> 8) & 1) != 0);
		for (let i = 9; i < 15; i++)
			this.functionMods[14 - i][8] = +(((bits >>> i) & 1) != 0);

		for (let i = 0; i < 8; i++)
			this.functionMods[this.nmods - 1 - i][8] = +(
				((bits >>> i) & 1) !=
				0
			);
		for (let i = 8; i < 15; i++)
			this.functionMods[8][this.nmods - 15 + i] = +(
				((bits >>> i) & 1) !=
				0
			);
		this.functionMods[8][this.nmods - 8] = 1;
	}

	private renderDataModules(data: string) {
		let pattern: Array<[number, number]> = [];
		for (let row = this.nmods - 1; row >= 1; row -= 2) {
			if (row == 6) row = 5;
			for (let col = 0; col < this.nmods; col++) {
				for (let u = 0; u < 2; u++) {
					const x: number = row - u;
					const y: number = !((row + 1) & 2)
						? this.nmods - col - 1
						: col;
					if (this.functionMods[x][y] === undefined)
						pattern.push([x, y]);
				}
			}
		}

		pattern.forEach(([x, y], i) => {
			if (i < data.length) this.canvasData[x][y] = +data[i];
		});
	}

	private applyMask(mask: number) {
		let maskFunction: (x: number, y: number) => number;
		switch (mask) {
			case 0b000:
				maskFunction = (x: number, y: number) => +((x + y) % 2 === 0);
				break;
			case 0b001:
				maskFunction = (x: number, y: number) => +(y % 2 === 0);
				break;
			case 0b010:
				maskFunction = (x: number, y: number) => +(x % 3 === 0);
				break;
			case 0b011:
				maskFunction = (x: number, y: number) => +((x + y) % 3 === 0);
				break;
			case 0b100:
				maskFunction = (x: number, y: number) =>
					+((Math.floor(x) / 3 + Math.floor(y) / 2) % 2 === 0);
				break;
			case 0b101:
				maskFunction = (x: number, y: number) =>
					+(((x * y) % 2) + ((y * x) % 3) === 0);
				break;
			case 0b110:
				maskFunction = (x: number, y: number) =>
					+((((x * y) % 2) + ((x * y) % 3)) % 2 === 0);
				break;
			case 0b111:
				maskFunction = (x: number, y: number) =>
					+((((x + y) % 2) + ((x * y) % 3)) % 2 === 0);
				break;

			default:
				maskFunction = (x: number, y: number) => +((x + y) % 2 === 0);
				console.log('Invalid QRCode mask... Using default 0x00 mask');
				break;
		}

		let maskedData: Array<Array<number>> = new Array(this.nmods);
		this.canvasData.forEach((val, i) => (maskedData[i] = [...val]));

		return maskedData.map((x, i) =>
			x.map((y, u) =>
				y !== undefined
					? y ^ maskFunction(i, u)
					: this.functionMods[i][u] === undefined
					? 0 ^ maskFunction(i, u)
					: y
			)
		);
	}

	private computePenalties(dataMods: Array<Array<number>>): number {
		// Linear Run Penalties
		let lrp: number = 0;
		dataMods.forEach((x, i) => {
			let last = 0;
			let count = 0;
			x.forEach((y, u) => {
				const module = y === undefined ? this.functionMods[i][u] : y;

				if (last == module && last !== undefined) {
					count++;
					if (count === 5) lrp += 3;
					else if (count > 5) lrp++;
				} else {
					last = module;
					count = 1;
				}
			});
		});

		for (let i in dataMods) {
			let last = 0;
			let count = 0;
			for (let u in dataMods) {
				const module =
					dataMods[u][i] === undefined
						? this.functionMods[u][i]
						: dataMods[u][i];

				if (last !== undefined && last == module) {
					count++;
					if (count === 5) lrp += 3;
					else if (count > 5) lrp++;
				} else {
					last = module;
					count = 1;
				}
			}
		}

		// Black Balance Penalties
		let ones: number = dataMods.reduce(
			(acc, x) =>
				acc + x.reduce((acc, x) => acc + (x === undefined ? 0 : x), 0),
			0
		);
		ones += this.functionMods.reduce(
			(acc, x) =>
				acc + x.reduce((acc, x) => acc + (x === undefined ? 0 : x), 0),
			0
		);
		const balance = (ones * 100) / this.nmods ** 2;
		const bbp = Math.abs(Math.trunc(balance / 5 - 10)) * 10;

		// Box Pattern Penalties
		let bxp = 0;
		for (let r = 0; r < this.nmods - 1; r++) {
			for (let c = 0; c < this.nmods - 1; c++) {
				const module =
					dataMods[r][c] === undefined
						? this.functionMods[r][c]
						: dataMods[r][c];
				if (
					(dataMods[r][c + 1] === undefined
						? this.functionMods[r][c + 1]
						: dataMods[r][c + 1]) === module &&
					(dataMods[r + 1][c] === undefined
						? this.functionMods[r + 1][c]
						: dataMods[r + 1][c]) === module &&
					(dataMods[r + 1][c + 1] === undefined
						? this.functionMods[r + 1][c + 1]
						: dataMods[r + 1][c + 1]) === module
				) {
					bxp += 3;
				}
			}
		}

		// Finder Pattern Penalties
		let fpp = 0;
		for (let i = 0; i < this.nmods; i++) {
			for (let ci = 0; ci < this.nmods - 11; ci++) {
				if (
					[
						[1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0],
						[0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
					].some((pattern) =>
						pattern.every(
							(cell, ptr) =>
								cell ===
								(dataMods[i][ci + ptr] === undefined
									? this.functionMods[i][ci + ptr]
									: dataMods[i][ci + ptr])
						)
					)
				) {
					fpp += 40;
				}
			}
			for (let ri = 0; ri < this.nmods - 11; ri++) {
				if (
					[
						[1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0],
						[0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1],
					].some((pattern) =>
						pattern.every(
							(cell, ptr) =>
								cell ===
								(dataMods[i][ri + ptr] === undefined
									? this.functionMods[i][ri + ptr]
									: dataMods[i][ri + ptr])
						)
					)
				) {
					fpp += 40;
				}
			}
		}

		return lrp + bxp + bbp + fpp;
	}

	private inlayLogo() {
		const nLogoWMods = Math.ceil(this.logoWidth / this.pixelSize);
		const nLogoHMods = Math.ceil(this.logoHeight / this.pixelSize);

		for (
			let r = Math.ceil(this.nmods / 2 - nLogoHMods / 2);
			r < Math.ceil(this.nmods / 2 + nLogoHMods / 2);
			r++
		)
			for (
				let w = Math.ceil(this.nmods / 2 - nLogoWMods / 2);
				w < Math.ceil(this.nmods / 2 + nLogoWMods / 2);
				w++
			)
				if (this.canvasData[w][r] === undefined)
					this.functionMods[w][r] = 0;
				else this.canvasData[w][r] = 0;
	}

	render(data: string) {
		this.setSize(this.dim - (this.dim % this.nmods) + this.padding * 2);
		this.pixelSize = Math.round((this.dim - this.padding * 2) / this.nmods);

		this.context.fillStyle = 'white';
		this.context.fillRect(0, 0, this.dim, this.dim);

		this.renderTimingModules();
		this.renderPositionModules();
		this.renderAlignmentModules();
		this.renderTempFormatModules();
		this.renderDataModules(data);

		let MSM: number = 0;
		let MSMP: number = Infinity;
		for (let j = 0; j <= 0b111; j++) {
			const render = this.applyMask(j);
			this.renderFormatModules(j);

			const penalty = this.computePenalties(render);
			MSM = penalty < MSMP ? j : MSM;
			MSMP = Math.min(penalty, MSMP);
		}

		this.canvasData = this.applyMask(MSM);
		this.renderFormatModules(MSM);

		this.inlayLogo();

		for (let i = 0; i < this.nmods; i++)
			for (let u = 0; u < this.nmods; u++)
				this.drawRect(
					i * this.pixelSize + this.padding,
					u * this.pixelSize + this.padding,
					this.canvasData[i][u] !== undefined
						? !this.canvasData[i][u]
							? '#FFF'
							: '#000'
						: !this.functionMods[i][u]
						? '#FFF'
						: '#000'
				);

		this.logo.onload = () =>
			this.context.drawImage(
				this.logo,
				Math.ceil(
					this.canvas.width / 2 -
						this.logoWidth / 2 +
						this.pixelSize / 2
				),
				Math.ceil(
					this.canvas.height / 2 -
						this.logoHeight / 2 +
						this.pixelSize / 2
				),
				this.logoWidth,
				this.logoHeight
			);
	}
}

export default Renderer;
