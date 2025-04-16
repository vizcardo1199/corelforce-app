export const roundDecimals = (value: number, decimals: number = 3) => {
    return Math.round(value * 10 ** decimals) / 10 ** decimals;
};
export const roundedDecimal = (value: number, decimals: number) => {
    return Math.round(value * 10 ** decimals) / 10 ** decimals;
};

export const crestFactor = (arr: number[]) => {
    const valMaxY = Math.max(...arr);
    const valMeanY = meanOverall(arr);
    let calc = arr.reduce(
        (sum, num) => sum + (valMeanY - num) * (valMeanY - num),
        0,
    );
    calc = calc / arr.length;
    calc = Math.sqrt(calc);
    return roundDecimals(valMaxY / calc) || 0;
};

export const peakToPeak = (arr: number[]) => {
    const valMaxY = Math.max(...arr);
    const valMinY = Math.min(...arr);
    return {
        pkTopk: roundDecimals(Math.abs(valMaxY) + Math.abs(valMinY)) || 0,
        max: roundDecimals(valMaxY) || 0,
        min: roundDecimals(valMinY) || 0,
    };
};

export const  spectraVelocity = (input: number[]) => {
    const fixedMultiplier = 2000; // Ajusta este valor según tus necesidades
    const fullTurn = 360; // Ajusta este valor según tus necesidades

    // Convertir la entrada en un array de números
    const accelSAsMeasureY = input.map(Number).filter((x) => !isNaN(x));

    // Inicializar row_number
    let rowNumber = 0;

    // Aplicar la fórmula por primera vez
    const resultsOnce = accelSAsMeasureY.map((value) => {
        rowNumber += 1;
        return fixedMultiplier * (value / (fullTurn * rowNumber));
    });

    // Convertir los primeros 5 valores en 0
    for (let i = 0; i < 5; i++) {
        if (i < accelSAsMeasureY.length) {
            accelSAsMeasureY[i] = 0;
        }
        if (i < resultsOnce.length) {
            resultsOnce[i] = 0;
        }
    }

    // Convertir el resultado en una cadena separada por comas
    return resultsOnce;
};

export const spectraDisplacement = (input: number[]) => {
    const fixedMultiplier = 2000; // Ajusta este valor según tus necesidades
    const fullTurn = 360; // Ajusta este valor según tus necesidades

    // Convertir la entrada en un array de números
    const accelSAsMeasureY = input.map(Number).filter((x) => !isNaN(x));

    // Aplicar la fórmula por primera vez
    let rowNumber = 0;
    const resultsOnce = accelSAsMeasureY.map((value) => {
        rowNumber += 1;
        return fixedMultiplier * (value / (fullTurn * rowNumber));
    });

    // Aplicar la fórmula por segunda vez
    rowNumber = 0;
    const resultsTwice = resultsOnce.map((value) => {
        rowNumber += 1;
        return fixedMultiplier * (value / (fullTurn * rowNumber));
    });

    // Convertir los primeros 5 valores en 0
    for (let i = 0; i < 5; i++) {
        if (i < resultsTwice.length) {
            resultsTwice[i] = 0;
        }
    }

    // Convertir el resultado en una cadena separada por comas
    return resultsTwice;
};


export const meanOverall = (numeros: number[]) => {
    const suma = numeros.reduce((acumulador, numero) => acumulador + numero, 0);
    return roundDecimals(suma / numeros.length);
};

export const calculateOverall = (arr: number[]) => {
    const sumOfSquares = arr.reduce((sum, num) => sum + num ** 2, 0);
    const result = Math.sqrt(sumOfSquares);
    return roundDecimals(result);
};

export const processBandsInfo = (rpm: number, velocitySpectra: any[] , bandParam: any) => {
    const records = velocitySpectra.filter(
        (ds) =>
            bandParam.lower * rpm < ds.vs_measure_x &&
            ds.vs_measure_x < bandParam.upper * rpm,
    );

    const sum = records
        .map((ds) => ds.vs_measure_y * ds.vs_measure_y)
        .reduce((a, b) => a + b, 0);

    const value = Math.sqrt(sum) * 1.0;
    if (isNaN(value)) {
        return null;
    }
    return {
        biv_code: bandParam.code,
        biv_label: bandParam.label,
        biv_value: value,
    };
};
