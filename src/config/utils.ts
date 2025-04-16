import {
  ACCELERATION_TYPE_VALUES,
  AMPLITUDE_VALUES,
  DISPLACEMENT_TYPE_VALUES,
  FREQUENCY_VALUES,
  LANGUAGE_VALUES,
  VELOCITY_TYPE_VALUES,
} from './constants';

export const resolveAmplitude = (key: number) => {
  return AMPLITUDE_VALUES.find((a) => a.key == key)?.value ?? ' -- ';
};

export const resolveFrequency = (key: number) => {
  return FREQUENCY_VALUES.find((a) => a.key == key)?.value ?? ' -- ';
};

export const resolveVelocity = (key: number) => {
  return VELOCITY_TYPE_VALUES.find((a) => a.key == key)?.value ?? ' -- ';
};

export const resolveAcceleration = (key: number) => {
  return ACCELERATION_TYPE_VALUES.find((a) => a.key == key)?.value ?? ' -- ';
};

export const resolveDisplacement = (key: number) => {
  return DISPLACEMENT_TYPE_VALUES.find((a) => a.key == key)?.value ?? ' -- ';
};

export const resolveLanguage = (key: number) => {
  return LANGUAGE_VALUES.find((a) => a.key == key)?.value ?? ' -- ';
};

export const waveformDisplacement = (input: number[]) => {
  // Convertir la entrada en un array de números
  const acceleration = input.map(Number).filter((x) => !isNaN(x));

  // Definir el número de repeticiones
  const numRepetitions = 1;

  // Repetir los datos el número especificado de veces
  const accelerationSets = Array(numRepetitions).fill(acceleration);

  // Intervalo de tiempo entre muestras
  const dt = 0.01; // Intervalo de tiempo en segundos

  // Calcular el desplazamiento para cada conjunto de datos de aceleración
  const displacements = accelerationSets.map((accData) => {
    // Integración para obtener la velocidad
    let velocity = cumulativeTrapezoidalIntegration(accData, dt);

    // Centrar la velocidad en 0
    const meanVelocity =
        velocity.reduce((sum, val) => sum + val, 0) / velocity.length;
    velocity = velocity.map((v) => v - meanVelocity);

    // Integración para obtener el desplazamiento
    const displacement = cumulativeTrapezoidalIntegration(velocity, dt);

    return displacement;
  });

  // Convertir el resultado en una cadena separada por comas
  return displacements[0]; // Imprimir solo la primera repetición
};

export const waveformVelocity = (input: number[]) => {
  // Supongamos que tienes la data de aceleración en un array
  const acceleration = input.map(Number).filter((x) => !isNaN(x)); // Convertir la entrada en un array de números

  // Definir el número de repeticiones
  const numRepetitions = 1; // Puedes cambiar este valor según tus necesidades

  // Repetir los datos el número especificado de veces
  const accelerationSets = Array(numRepetitions).fill(acceleration);

  // Intervalo de tiempo entre muestras
  const dt = 0.01; // Intervalo de tiempo en segundos, ajusta según tus datos

  // Calcular la velocidad para cada conjunto de datos de aceleración
  const velocities = accelerationSets.map((accData) => {
    // Integración para obtener la velocidad
    let velocity = cumulativeTrapezoidalIntegration(accData, dt);

    // Centrar la velocidad en 0
    const meanVelocity =
        velocity.reduce((sum, val) => sum + val, 0) / velocity.length;
    velocity = velocity.map((v) => v - meanVelocity);

    return velocity;
  });

  // Convertir el resultado en una cadena separada por comas
  return velocities[0]; // Solo se imprime la primera repetición para simplificar
};

export const cumulativeTrapezoidalIntegration = (data, dx) => {
  const integral = [0];

  for (let i = 1; i < data.length; i++) {
    const trapezoidArea = ((data[i] + data[i - 1]) / 2) * dx;
    integral.push(integral[i - 1] + trapezoidArea);
  }

  return integral;
};


