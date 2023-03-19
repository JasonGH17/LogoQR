# logo-qr

QRCode generator written in pure typescript.

Supports adding logos to the center of the generated QRCodes, while removing the unused modules behind the inserted image.

## ECC Levels

As of v1.0.0 this library only supports the H flag as an ECC option, the other flags will be implemented next version.

## Installing

`npm install --save logo-qr`

## Usage

Without a logo:

```js
import QRCode from "logo-qr";

new QRLogo(your-canvas-element, your-href, 'H')
	.setSize(350)                   // Sets canvas size
	.setPadding(10)                 // Sets qrcode outer padding
	.build();                       // Generates the qrcode
```

With a logo:

```js
import QRCode from "logo-qr";

const logo = new Image();
logo.src = "href-to-your-image";

new QRLogo(your-canvas-element, your-href, 'H')
	.setSize(350)                   // Sets canvas size
	.setPadding(10)                 // Sets qrcode outer padding
    .setLogo(logo)                  // Sets the logo to be used
    .setLogoDimensions([120, 120])  // Sets the logo's dimensions
	.build();                       // Generates the qrcode
```