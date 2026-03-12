import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage almacenamiento persistente (guardar, leer o borrar)
export class StorageAdapter {
  static async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  }

  static async getItem(key: string) {
    return await AsyncStorage.getItem(key);
  }

  static async deleteItem(key: string) {
    await AsyncStorage.removeItem(key);
  }

}
