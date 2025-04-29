import React, { useRef, useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const SyncModal = ({ visible, onClose, surveys, onSync }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const styles = getStyles(isDark);

    const listRef = useRef<FlatList>(null);
    const [syncCompleted, setSyncCompleted] = useState(false);
    const [syncSummary, setSyncSummary] = useState({ success: 0, failed: 0 });

    const handleSync = async (surveys) => {
        const { successCount, failedCount } = await onSync(surveys);

        console.log('Success count', successCount);
        // Guardar resultados
        setSyncSummary({ success: successCount, failed: failedCount });
        setSyncCompleted(true);

        // Scroll automático hacia arriba
        setTimeout(() => {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 500); // pequeño delay para asegurar que la lista ya haya renderizado
    };
    useEffect(() => {
        if (visible) {
            // Reset states when the modal is opened
            setSyncCompleted(false);
            setSyncSummary({ success: 0, failed: 0 });
        }
    }, [visible]);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.rowBetween}>
                <Text style={styles.title}>
                    {item.assetDescription} - ID: {item.mawoiId}
                </Text>
                {item.synced === true && <Icon name="check-circle" size={20} color="green" />}
                {item.synced === false && <Icon name="x-circle" size={20} color="red" />}
            </View>

            <Text style={styles.date}>
                Date: {new Date(item.date).toLocaleString()}
            </Text>
            <Text style={styles.points}>Points: {item.points.join(', ')}</Text>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Icon name="x" size={22} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>

                    <Text style={styles.header}>Synchronize survey</Text>

                    {syncCompleted && (
                        <Text style={styles.summaryText}>
                            ✅ {syncSummary.success} successful | ❌ {syncSummary.failed} failed
                        </Text>
                    )}

                    <FlatList
                        ref={listRef}
                        data={surveys}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderItem}
                        style={{ maxHeight: 300 }}
                    />

                    {!syncCompleted && (
                        <TouchableOpacity style={styles.syncBtn} onPress={() => handleSync(surveys)}>
                            <Icon name="upload-cloud" size={20} color="#fff" />
                            <Text style={styles.syncText}>Sync</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default SyncModal;

const getStyles = (dark: boolean) => ({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 10,
        color: '#666',
    },
    modal: {
        width: '85%',
        backgroundColor: dark ? '#1e1e1e' : '#fff',
        borderRadius: 16,
        padding: 16,
        position: 'relative',
    },
    closeBtn: {
        position: 'absolute',
        right: 10,
        top: 10,
        zIndex: 1,
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: dark ? '#fff' : '#000',
    },
    card: {
        backgroundColor: dark ? '#2c2c2e' : '#f2f2f2',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    title: {
        fontWeight: '600',
        fontSize: 16,
        color: dark ? '#fff' : '#000',
    },
    date: {
        fontSize: 14,
        marginTop: 4,
        color: dark ? '#ccc' : '#555',
    },
    points: {
        fontSize: 14,
        marginTop: 2,
        fontWeight: 'bold',
        color: dark ? '#eee' : '#222',
    },
    syncBtn: {
        backgroundColor: '#0033cc',
        paddingVertical: 12,
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    syncText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
});

