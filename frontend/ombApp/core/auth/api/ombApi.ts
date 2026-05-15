import axios from 'axios';
import { Platform } from 'react-native';

const API_URL =
  Platform.OS === 'web'
    ? process.env.EXPO_PUBLIC_API_URL_WEB
    : Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_API_URL_IOS
    : process.env.EXPO_PUBLIC_API_URL_ANDROID;

export const ombApi = axios.create({
  baseURL: API_URL,
});