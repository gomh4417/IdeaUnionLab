import { useEffect, useState } from 'react';

export default function useImage(url) {
    const [image, setImage] = useState(null);

    useEffect(() => {
        if (!url) return;
        const img = new window.Image();
        img.crossOrigin = 'Anonymous'; // CORS 문제 방지
        img.src = url;
        img.onload = () => setImage(img);
    }, [url]);

    return [image];
}
