import QRLogo from '../src';

const canvas1 = document.getElementById('cnv1') as HTMLCanvasElement;
const canvas2 = document.getElementById('cnv2') as HTMLCanvasElement;

const logo = new Image();
logo.src = '/examples/logo.png';

new QRLogo(canvas1, 'https://developer.mozilla.org/en-US/', 'H')
	.setSize(350)
	.setPadding(10)
	.build();

new QRLogo(canvas2, 'https://developer.mozilla.org/en-US/', 'H')
	.setSize(350)
	.setPadding(10)
	.setLogo(logo)
	.setLogoDimensions([120, 120])
	.build();
