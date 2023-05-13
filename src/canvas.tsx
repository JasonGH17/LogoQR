import { useEffect, useRef } from 'react';

const useCanvas = (callback: (canvas: HTMLCanvasElement) => void) => {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = (ref.current as HTMLCanvasElement);
        callback(canvas);
    }, []);

    return ref;
}

export default useCanvas;