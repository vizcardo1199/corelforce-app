import {diffInMinutes, findPointForCollectData} from './utilService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SurveyStore} from '../../types/survey-store';
import {Survey} from '../../types/survey';
import {CollectData} from '../../types/collect-data';
import {SurveySync} from '../../types/survey-sync';

export const mapSurveyForSync = (mawoisStore) => {
    const syncSurvey = groupPointsByDate(mawoisStore);
    const surveys = [];
    syncSurvey.forEach((mawoi) => {
        let { mawoi: mawoiMemory } = findPointForCollectData(mawoi.id);
        mawoi.groupedPoints.forEach((points) => {
            let details = {
                mawoiDescription: mawoi.description,
                mawoiId: mawoi.id,
                date: points[0].date,
                points: points.map((point) => point.description),
                vars: points
                    .map((point) => {
                        let pointX = null;
                        let pointY = null;
                        let pointZ = null;

                        if (mawoiMemory.isMonoaxial) {
                            pointX = mawoiMemory.points.find(
                                (p) => p.code == point.description,
                            );
                        } else {
                            pointX = mawoiMemory.points.find(
                                (p) =>
                                    p.code == point.description + 'X' ||
                                    p.code == point.description + 'H',
                            );
                            pointY = mawoiMemory.points.find(
                                (p) =>
                                    p.code == point.description + 'Y' ||
                                    p.code == point.description + 'V',
                            );
                            pointZ = mawoiMemory.points.find(
                                (p) =>
                                    p.code == point.description + 'Z' ||
                                    p.code == point.description + 'A',
                            );
                        }

                        let pointsWithVars = [];
                        if (pointX) {
                            pointsWithVars.push({
                                pointId: pointX.id,
                                ...point.vars,
                            });
                        }
                        if (pointY) {
                            pointsWithVars.push({
                                pointId: pointY.id,
                                ...point.vars,
                            });
                        }
                        if (pointZ) {
                            pointsWithVars.push({
                                pointId: pointZ.id,
                                ...point.vars,
                            });
                        }
                        return pointsWithVars;
                    })
                    .flat(),
                waveform: [],
                spectrum: [],
            };
            points.forEach((point) => {
                let pointX = null;
                let pointY = null;
                let pointZ = null;

                if (mawoiMemory.isMonoaxial) {
                    pointX = mawoiMemory.points.find(
                        (p) => p.code == point.description,
                    );
                } else {
                    pointX = mawoiMemory.points.find(
                        (p) =>
                            p.code == point.description + 'X' ||
                            p.code == point.description + 'H',
                    );
                }

                if (pointX) {
                    point.NEXT_X_W.forEach((value) => {
                        details.waveform.push({
                            pointId: pointX.id,
                            pointCode: pointX.code,
                            measure_y: value,
                        });
                    });
                    point.NEXT_X_S.forEach((value) => {
                        details.spectrum.push({
                            pointId: pointX.id,
                            pointCode: pointX.code,
                            measure_y: value,
                        });
                    });
                }

                pointY = mawoiMemory.points.find(
                    (p) =>
                        p.code == point.description + 'Y' ||
                        p.code == point.description + 'V',
                );
                if (pointY) {
                    point.NEXT_Y_W.forEach((value) => {
                        details.waveform.push({
                            pointId: pointY.id,
                            pointCode: pointY.code,
                            measure_y: value,
                        });
                    });
                    point.NEXT_Y_S.forEach((value) => {
                        details.spectrum.push({
                            pointId: pointY.id,
                            pointCode: pointY.code,
                            measure_y: value,
                        });
                    });
                }
                pointZ = mawoiMemory.points.find(
                    (p) =>
                        p.code == point.description + 'Z' ||
                        p.code == point.description + 'A',
                );
                if (pointZ) {
                    point.NEXT_Z_W.forEach((value) => {
                        details.waveform.push({
                            pointId: pointZ.id,
                            pointCode: pointZ.code,
                            measure_y: value,
                        });
                    });
                    point.NEXT_Z_S.forEach((value) => {
                        details.spectrum.push({
                            pointId: pointZ.id,
                            pointCode: pointZ.code,
                            measure_y: value,
                        });
                    });
                }
            });
            surveys.push(details);
        });
    });
    return surveys;
};
export const mapByAssetsGroup = async (plantId: number): Promise<SurveySync[]> => {
    const surveysString = await AsyncStorage.getItem('surveys');
    let allSurveys: SurveyStore[] = JSON.parse(surveysString || '[]');

    allSurveys = allSurveys.filter((survey: SurveyStore) => survey.plantId === plantId);

    return generateSurveysToSync(generateSurveys(allSurveys));
};

export const saveCollectDataSynced = async (uuids: string[]) => {
    const surveysString = await AsyncStorage.getItem('surveys');
    let allSurveys: SurveyStore[] = JSON.parse(surveysString || '[]');

    allSurveys = allSurveys.map((survey: SurveyStore) => {
        const collects = survey.collects!.filter((collect: CollectData) => uuids.includes(collect.uuid!));
        collects.forEach((collect: CollectData) => {
            collect.synced = true;
        });

        return survey;
    });

    await AsyncStorage.setItem('surveys', JSON.stringify(allSurveys));
};

export const generateSurveysToSync = (data: Survey[]): SurveySync[] => {
    return data.map((survey: Survey) => {
        const detail: SurveySync = {
            date: survey.startDate,
            mawoiId: survey.assetId,
            assetDescription: survey.assetDescription,
            points: survey.points.map((point) => point.code),
            vars: [],
            waveform: [],
            spectrum: [],
            uuids: data.map((survey) => survey.points.map((point) => point.uuid)).flat(),
        };


        survey.points.forEach((point) => {
            const { pointDescription, code, pointId, collect } = point;
            const vars = collect.vars;

            let pointX: typeof point | null | undefined = null;
            let pointY: typeof point | null | undefined = null;
            let pointZ: typeof point | null | undefined = null;

            // Asignar ejes según si es monoaxial
            if (survey.isMonoaxial) {
                pointX = point; // único eje
            } else {
                // Buscar los ejes correspondientes en los demás puntos del mismo survey
                pointX = survey.points.find(
                    (p) =>
                        (p.code.endsWith('X') || p.code.endsWith('H')) && p.code == point?.code
                );
                pointY = survey.points.find(
                    (p) =>
                        (p.code.endsWith('Y') || p.code.endsWith('V'))  && p.code == point?.code
                );
                pointZ = survey.points.find(
                    (p) =>
                        (p.code.endsWith('Z') || p.code.endsWith('A'))  && p.code == point?.code
                );
            }


            if (vars) {
                if (pointX) {detail.vars.push({
                    pointId: pointX.pointId.toString(), fmax: point.collect?.vars?.fMax.toString()!,
                    rpm: point.collect.vars?.rpm.toString()!,
                    revolution: point.collect.vars?.rev.toString()!,
                });}
                if (pointY) {detail.vars.push({
                    pointId: pointY.pointId.toString(), fmax: point.collect?.vars?.fMax.toString()!,
                    rpm: point.collect.vars?.rpm.toString()!,
                    revolution: point.collect.vars?.rev.toString()!,
                });}
                if (pointZ) {detail.vars.push({
                    pointId: pointZ.pointId.toString(), fmax: point.collect?.vars?.fMax.toString()!,
                    rpm: point.collect.vars?.rpm.toString()!,
                    revolution: point.collect.vars?.rev.toString()!,
                });}
            }

            // 👉 waveform & spectrum por eje
            if (pointX) {
                collect.NEXT_X_W?.forEach((value) =>
                    detail.waveform.push({
                        pointId: pointX?.pointId!,
                        pointCode: pointX?.code!,
                        measure_y: value,
                    })
                );
                collect.NEXT_X_S?.forEach((value) =>
                    detail.spectrum.push({
                        pointId: pointX?.pointId!,
                        pointCode: pointX?.code!,
                        measure_y: value,
                    })
                );
            }

            if (pointY) {
                collect.NEXT_Y_W?.forEach((value) =>
                    detail.waveform.push({
                        pointId: pointY?.pointId!,
                        pointCode: pointY?.code!,
                        measure_y: value,
                    })
                );
                collect.NEXT_Y_S?.forEach((value) =>
                    detail.spectrum.push({
                        pointId: pointY?.pointId!,
                        pointCode: pointY?.code!,
                        measure_y: value,
                    })
                );
            }

            if (pointZ) {
                collect.NEXT_Z_W?.forEach((value) =>
                    detail.waveform.push({
                        pointId: pointZ?.pointId!,
                        pointCode: pointZ?.code!,
                        measure_y: value,
                    })
                );
                collect.NEXT_Z_S?.forEach((value) =>
                    detail.spectrum.push({
                        pointId: pointZ?.pointId!,
                        pointCode: pointZ?.code!,
                        measure_y: value,
                    })
                );
            }
        });

        return detail;
    });
};

export const  generateSurveys = (data: SurveyStore[]): Survey[] => {
    const MILIS_15_MIN = 15 * 60 * 1000;
    const surveys: Survey[] = [];

    // Paso 1: obtener collectData no sincronizados
    const unsyncedData: {
        assetId: number;
        assetDescription: string;
        isMonoaxial: boolean;
        pointId: number;
        pointDescription: string;
        pointCode: string;
        collect: CollectData;
    }[] = [];

    for (const store of data) {
        const { assetId, isMonoaxial, pointCode, pointId, collects, assetDescription, pointDescription } = store;

        console.log(assetId, pointId, assetDescription, pointDescription, pointCode);
        if (!assetId || !pointId || !collects || !assetDescription || !pointDescription  || !pointCode) {continue;}

        collects
            .filter((c) => c.synced === false && c.date)
            .forEach((collect) => {
                unsyncedData.push({ assetId, pointId, collect, assetDescription, pointDescription, isMonoaxial, pointCode });
            });
    }


    const assetInfoById: Record<number, { assetDescription: string, isMonoaxial: boolean }> = {};
    unsyncedData.forEach(({ assetId, assetDescription, isMonoaxial }) => {
        if (!assetInfoById[assetId]) {
            assetInfoById[assetId] = {assetDescription, isMonoaxial};
        }
    });
    // Paso 2: agrupar por assetId
    const groupedByAsset: Record<number, { pointId: number; collect: CollectData, pointDescription: string, pointCode: string }[]> = {};
    for (const item of unsyncedData) {
        if (!groupedByAsset[item.assetId]) {groupedByAsset[item.assetId] = [];}
        groupedByAsset[item.assetId].push({ pointId: item.pointId, collect: item.collect, pointDescription: item.pointDescription, pointCode: item.pointCode });
    }

    // Paso 3: para cada assetId agrupar por ventanas de 15 minutos
    for (const assetIdStr in groupedByAsset) {
        const assetId = Number(assetIdStr);
        const {assetDescription, isMonoaxial} = assetInfoById[assetId];
        const collectsList = groupedByAsset[assetId];

        // Ordenar por fecha
        collectsList.sort((a, b) =>
            new Date(a.collect.time!).getTime() - new Date(b.collect.time!).getTime()
        );

        let currentGroup: Survey['points'] = [];
        let startTime: number | null = null;

        for (const { pointId, pointCode, collect, pointDescription } of collectsList) {
            const collectTime = new Date(collect.time!).getTime();

            // Si no hemos iniciado grupo, iniciamos
            if (startTime === null) {
                startTime = collectTime;
                currentGroup.push({ pointId, code: pointCode, collect, pointDescription, uuid: collect.uuid! });
                continue;
            }

            // Si estamos en la misma ventana de 15min y el pointId no está ya agregado
            const isSameWindow = collectTime - startTime <= MILIS_15_MIN;
            const isPointAlreadyIncluded = currentGroup.some((p) => p.pointId === pointId);

            if (isSameWindow && !isPointAlreadyIncluded) {
                currentGroup.push({ pointId, code: pointCode, collect, pointDescription, uuid: collect.uuid! });
            } else {
                // Cerramos grupo anterior y comenzamos uno nuevo
                const startDate = new Date(startTime).getTime();
                const endDate = new Date(currentGroup[currentGroup.length - 1].collect.date!).getTime();

                surveys.push({ assetId, assetDescription, startDate, endDate, points: currentGroup, isMonoaxial });

                // Nuevo grupo
                currentGroup = [{ pointId, collect, pointDescription, code: pointCode, uuid: collect.uuid! }];
                startTime = collectTime;
            }
        }

        // Agregar último grupo
        if (currentGroup.length > 0) {
            const startDate = new Date(startTime).getTime();
            const endDate = new Date(currentGroup[currentGroup.length - 1].collect.date!).getTime();
            surveys.push({ assetId, startDate, endDate, points: currentGroup, assetDescription, isMonoaxial });
        }
    }

    return surveys;
};
export const groupPointsByDate = (mawois, rangeInMinutes = 15) => {
    const result = [];

    mawois.forEach((mawoi) => {
        const groupedPoints = [];
        let currentGroup = [];

        // Ordenar los puntos por fecha
        const sortedPoints = mawoi.points.sort(
            (a, b) => new Date(a.date) - new Date(b.date),
        );

        sortedPoints.forEach((point, index) => {
            if (currentGroup.length === 0) {
                currentGroup.push(point);
            } else {
                const lastPoint = currentGroup[currentGroup.length - 1];
                const minutesDiff = diffInMinutes(lastPoint.date, point.date);
                const pointExistsInGroup = currentGroup.some((p) => p.id === point.id);

                if (minutesDiff <= rangeInMinutes && !pointExistsInGroup) {
                    // Si la diferencia es menor o igual a 15 minutos y el punto no existe en el grupo actual
                    currentGroup.push(point);
                } else {
                    // Si no, agrupa los puntos actuales y comienza un nuevo grupo
                    groupedPoints.push([...currentGroup]);
                    currentGroup = [point];
                }
            }

            // Si es el último punto, agrega el grupo actual a los grupos
            if (index === sortedPoints.length - 1) {
                groupedPoints.push([...currentGroup]);
            }
        });

        // Crear el nuevo objeto con el description e id del mawoi y el array de puntos agrupados
        result.push({
            id: mawoi.id,
            description: mawoi.description,
            groupedPoints: groupedPoints,
        });
    });

    return result;
};
