import React from "react";
import ReactDOM from "react-dom/client";
import QRLogo from '../src';

const App: React.FC = () => {
	const logo = new Image();
	logo.src = '/examples/test.png';

	return <div>
		<h1>LogoQR Examples</h1>
		<div>
			<h2>No Logo:</h2>
			<QRLogo href="https://www.google.com" ec='H' canvasSize={350} padding={10} />
		
			<h2>With Logo:</h2>
			<QRLogo href="https://www.google.com" ec='H' canvasSize={350} padding={10} logo={logo} logoDim={[120, 120]} />
		</div>
	</div>;
}

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLDivElement
);

root.render(<App />);
