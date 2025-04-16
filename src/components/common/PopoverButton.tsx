import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    LayoutRectangle,
    findNodeHandle,
    UIManager,
} from 'react-native';
import {POPOVER_COLLECT_INFO} from "../../types/popover-collect-info";
import BandIcon from "../../../assets/bands.svg";

export const PopoverButton: React.FC<POPOVER_COLLECT_INFO> = ({id, crestFactor, lastCrest, peakToPeak, lastPkPk, isOpen,
                                                                  onToggle}) => {
    const [showPopover, setShowPopover] = useState(false);
    const [buttonLayout, setButtonLayout] = useState<LayoutRectangle | null>(null);
    const buttonRef = useRef(null);

    const handleButtonPress = () => {
        const handle = findNodeHandle(buttonRef.current);
        if (handle) {
            UIManager.measure(handle, (_x, _y, _width, _height, pageX, pageY) => {
                setButtonLayout({ x: pageX, y: pageY, width: _width, height: _height });
                onToggle(id!);
            });
        }
    };



    return (
            <View style={styles.container}>
                <TouchableOpacity  style={styles.button} onPress={handleButtonPress} ref={buttonRef    }>
                    <BandIcon></BandIcon>
                </TouchableOpacity>

                {isOpen && buttonLayout && (
                    <View style={[styles.popover, {
                        top: 60,
                        left: -250
                    }]}>
                        <Text style={[styles.popoverText, styles.mainText]}>Crest Factor: {crestFactor}</Text>
                        <Text style={styles.popoverText}>Last measure: {lastCrest}</Text>
                        <Text style={[styles.popoverText, styles.mainText]}>PK-PK: {peakToPeak}</Text>
                        <Text style={styles.popoverText}>Last measure: {lastPkPk}</Text>
                    </View>
                )}
            </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        width: 65,
    },
    mainText: {
        fontSize: 19,
        color: '#333',
        fontWeight: 'bold',
    },
    button: {
        flex: 1,
        borderWidth: 2,
        borderColor: 'green',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginLeft: 10,
    },
    buttonText: {
        color: '#fff',
    },
    popover: {
        position: 'absolute',
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        zIndex: 10,
    },
    popoverText: {
        color: '#333',
    },
});

