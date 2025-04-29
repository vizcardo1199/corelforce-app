import React from 'react';
import { Modal, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingModalProps {
    visible: boolean;
    progressText: string;
}

export const LoadingModalProgress: React.FC<LoadingModalProps> = ({ visible, progressText }) => {
    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.text}>{progressText}</Text>
                </View>
            </View>
        </Modal>
    );
};


const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    text: {
        marginTop: 10,
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
    },
});
