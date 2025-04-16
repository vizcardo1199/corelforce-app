import {BleManager, Device} from 'react-native-ble-plx';

const manager = new BleManager();

interface IBluetoothProps {
    manager: BleManager;
    device: Device | null;
}
export const BLUETOOTH_PROPS: IBluetoothProps = {
    manager,
    device: null,
};
