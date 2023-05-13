import React from "react";
import useCanvas from "./canvas";
import QRCode from "./qrcode";
import type { ECLevel } from "./qrcode";

const LogoQR: React.FC<{ href: string, ec: ECLevel, logoDim?: [number, number], canvasSize?: number, padding?: number, logo?: HTMLImageElement }> = (props) => {
    const ref = useCanvas((canvas) => {
        const qr = new QRCode(canvas, props.href, props.ec);

        if (props.canvasSize) qr.setSize(props.canvasSize);
        if (props.padding) qr.setPadding(props.padding)
        if (props.logo) qr.setLogo(props.logo)
        if (props.logoDim) qr.setLogoDimensions(props.logoDim)

        qr.build().then(() => console.log("ready"));
    })

    return <canvas ref={ref} />
}

export default LogoQR;