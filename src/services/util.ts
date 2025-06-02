export const fft = (signal: number[]) => {
    const N = signal.length;
    if (N <= 1) return [[signal[0], 0]];

    const even = fft(signal.filter((_, i) => i % 2 === 0));
    const odd = fft(signal.filter((_, i) => i % 2 !== 0));

    const result = Array(N);
    for (let k = 0; k < N / 2; k++) {
        const exp = (-2 * Math.PI * k) / N;
        const twiddle = [Math.cos(exp), Math.sin(exp)];
        // (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
        const oddVal = odd[k];
        const t = [
            twiddle[0] * oddVal[0] - twiddle[1] * oddVal[1],
            twiddle[0] * oddVal[1] + twiddle[1] * oddVal[0],
        ];
        result[k] = [even[k][0] + t[0], even[k][1] + t[1]];
        result[k + N / 2] = [even[k][0] - t[0], even[k][1] - t[1]];
    }
    return result;
}

export const fftMag = (phasors: number[][]) => {
    return phasors.map(([re, im]) => Math.sqrt(re * re + im * im));
}

// Ventana de Hanning
export const applyHanning = (signal: number[]) => {
    const N = signal.length;
    return signal.map((x, n) => {
        const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
        return x * w;
    });
}

export const filterHanning = (waveform: number[], nlines: number) => {
    const windowed = applyHanning(waveform);
    const phasors = fft(windowed);
    const magnitudes = fftMag(phasors);
    for (let i = 0; i < 4; i++) magnitudes[i] = 0;
    return magnitudes.slice(0, nlines);
}
