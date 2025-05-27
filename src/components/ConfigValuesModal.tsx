import React, {useEffect, useState} from "react";
import {Modal, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {getSurveyVariables, saveSurveyVariables} from "../api/services/utilService";
import {SurveyVariables} from "../types/survey-variables";
import {Picker} from "@react-native-picker/picker";
import {LINES_VALUES, SAMPLES_VALUES} from "../config/constants";

export const ConfigValuesModal: React.FC<{ visible: boolean; onClose: () => void;}> = ({ visible, onClose }) => {

    const [rpm, setRpm] = useState<any>(null);
    const [fMax, setFMax] = useState<number>(null);
    const [lines, setLines] = useState<number>(null);
    const [rev, setRev] = useState<number>(null);
    const [samples, setSamples] = useState<number>(null);
    const [ip, setIp] = useState<string>(null);
    const [waiting, setWaiting] = useState<number>(null);

    useEffect(() => {
        if (visible) {
            console.log("Modal is visible");
            getSurveyVariables()
                .then((surveyVariables) => {
                    setRpm(surveyVariables.rpm);
                    setIp(surveyVariables.ip);
                    setFMax(surveyVariables.fMax);
                    setLines(surveyVariables.lines);
                    setRev(surveyVariables.rev);
                    setSamples(surveyVariables.samples);
                    setWaiting(surveyVariables.waiting);
                    console.log(surveyVariables);
                })
                .catch((error) => {
                    console.error("Error al obtener los datos recolectados", error);
                });
        } else {
            console.log("Modal is hidden, cleaning up states");
            setRpm(null);
            setFMax(null);
            setLines(null);
            setRev(null);
            setSamples(null);
            setWaiting(null);
        }
    }, [visible]);


    const closeModal = () => {
        setRpm(null);
        setFMax(null);
        setLines(null);
        setRev(null);
        setSamples(null);
        setWaiting(null);
        onClose();
    }

    const saveValues = () => {
        const surveyVariables: SurveyVariables = {
            rpm,
            fMax,
            lines,
            rev,
            samples,
            waiting,
        };
        saveSurveyVariables(surveyVariables)
            .then(() => {
                console.log('Variables guardadas en el dispositivo');
            })
            .catch((error) => {
                console.error("Error al guardar los datos recolectados", error);
            })
            .finally(() => {
                onClose();

            });

    }




    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.contentContainer}>
                    <View style={styles.header}>
                        <Text style={styles.headerText}>Configure Values</Text>
                    </View>

                    <View style={styles.searchContainer}>
                        <Text
                            style={[
                                styles.label
                            ]}
                        >
                            IP
                        </Text>
                        <TextInput
                            style={[
                                styles.input
                            ]}
                            value={ip?.toString()}
                            onChangeText={(text) => setIp((text))}
                        />
                    </View>

                    <View style={styles.searchContainer}>
                        <Text
                            style={[
                                styles.label
                            ]}
                        >
                            RPM
                        </Text>
                        <TextInput
                            style={[
                                styles.input
                            ]}
                            value={rpm?.toString()}
                            onChangeText={(text) => setRpm(Number(text))}
                        />
                    </View>

                    <View style={styles.searchContainer}>
                        <Text
                            style={[
                                styles.label
                            ]}
                        >
                            FMAX
                        </Text>
                        <TextInput
                            style={[
                                styles.input
                            ]}
                            value={fMax?.toString()}
                            onChangeText={(text) => setFMax(Number(text))}
                        />
                    </View>
                    <View style={styles.searchContainer}>
                        <Text
                            style={[
                                styles.label
                            ]}
                        >
                            LINES
                        </Text>
                        <View style={styles.pickerViewContainer}><Picker
                            selectedValue={lines}
                            style={styles.picker}
                            onValueChange={(value) => setLines(value)}

                        >
                            {LINES_VALUES.map((option: number) => (
                                <Picker.Item
                                    style={styles.pickerItem}
                                    key={option}
                                    label={option.toString()}
                                    value={option}
                                />
                            ))}
                        </Picker></View>
                    </View>

                    <View style={styles.searchContainer}>
                        <Text
                            style={[
                                styles.label
                            ]}
                        >
                            REV
                        </Text>
                        <TextInput
                            style={[
                                styles.input
                            ]}
                            value={rev?.toString()}
                            onChangeText={setRev}
                        />
                    </View>
                    <View style={styles.searchContainer}>
                        <Text
                            style={[
                                styles.label
                            ]}
                        >
                            SAMPLES
                        </Text>
                        <View style={styles.pickerViewContainer}><Picker
                            selectedValue={samples}
                            style={styles.picker}
                            onValueChange={(value) => setSamples(value)}

                        >
                            {SAMPLES_VALUES.map((option: number) => (
                                <Picker.Item
                                    style={styles.pickerItem}
                                    key={option}
                                    label={option.toString()}
                                    value={option}
                                />
                            ))}
                        </Picker></View>
                    </View>

                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity style={styles.saveButton} onPress={saveValues}>
                            <Text style={styles.closeButtonText}>Save</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    saveButton: {
        alignSelf: 'center',
        padding: 12,
        marginTop: 10,
        backgroundColor: '#0023c4', // Un color llamativo
        borderRadius: 25,
        width: '40%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,

    },
    buttonsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        marginTop: 20,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fondo oscuro más opaco
        justifyContent: 'center',
        alignItems: 'center',
    },
    picker: {
        height: 50,
        width: '100%', // Usar el 100% del contenedor asignado

    },
    pickerItem: {
        width: '100%',
    },
    pickerViewContainer: {
        borderWidth: 2,
        borderColor: "#9096a6",
        borderRadius: 10,
        marginTop: 10,
        flex: 1.5,
    },
    contentContainer: {
        width: '85%',
        height: '85%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        flex: 0.2,
    },
    header: {
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingVertical: 12,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        marginBottom: 15,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    listContainer: {
        flexGrow: 1,
        paddingBottom: 10,
    },
    closeButton: {
        alignSelf: 'center',
        padding: 12,
        marginTop: 10,
        backgroundColor: '#ff5722', // Un color llamativo
        borderRadius: 25,
        width: '50%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputSearch: {
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        flex: 1,
    },
    input: {
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        flex: 1.5,
    },
});
