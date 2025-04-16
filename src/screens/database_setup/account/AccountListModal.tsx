import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
// import { AccountScreen } from './AccountScreen';

export const AccountListModal: React.FC<{ visible: boolean; onClose: () => void; onSelectAccount: (account: any) => void }> = ({ visible, onClose, onSelectAccount }) => {
    const handleAccountSelect = (account: any) => {
        onSelectAccount(account);
        onClose(); // Cierra el modal después de seleccionar la cuenta
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.contentContainer}>
                    {/*<AccountScreen navigation={{ navigate: handleAccountSelect }} type={'modal'} />*/}
                    {/* Puedes usar la navegación para manejar la selección de la cuenta */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        width: '90%',
        height: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
    },
    closeButton: {
        alignSelf: 'center',
        padding: 10,
        marginTop: 10,
        backgroundColor: '#007bff',
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

