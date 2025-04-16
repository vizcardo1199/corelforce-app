import React from 'react';
import { Modal, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingModalProps {
    visible: boolean;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ visible }) => (
    <Modal animationType="fade" transparent={true} visible={visible}>
        <View style={styles.loadingModalContainer}>
            <View style={styles.loadingModalView}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingModalText}>Loading...</Text>
            </View>
        </View>
    </Modal>
);

const styles = StyleSheet.create({
    loadingModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    loadingModalView: {
        width: 200,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    loadingModalText: {
        marginTop: 10,
        fontSize: 16,
        color: '#007bff',
        fontWeight: 'bold',
    },
});
