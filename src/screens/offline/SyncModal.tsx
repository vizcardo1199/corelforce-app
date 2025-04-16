import React from 'react';
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

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.title}>
                {item.assetDescription} - ID: {item.mawoiId}
            </Text>
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

                    <FlatList
                        data={surveys}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderItem}
                        style={{ maxHeight: 300 }}
                    />

                    <TouchableOpacity style={styles.syncBtn} onPress={() => onSync(surveys)}>
                        <Icon name="upload-cloud" size={20} color="#fff" />
                        <Text style={styles.syncText}>Sync</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const getStyles = (dark: boolean) => ({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
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

export default SyncModal;
