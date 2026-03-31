import { Colors, Fonts } from '@/constants/theme';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {

  const { login, status } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Ocultar error tras 3 segundos
  React.useEffect(() => {
    if (errorMsg) {
      const timeout = setTimeout(() => setErrorMsg(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [errorMsg]);

  const onLogin = async () => {
    const { email, password } = form;
    if (!email || !password) {
      setErrorMsg('Rellena todos los campos');
      return;
    }
    setIsPosting(true);
    const result = await login(email, password);
    setIsPosting(false);
    if (typeof result === 'string') {
      setErrorMsg(result);
      return;
    }
  };

  // Si ya está autenticado, redirigir a home
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status]);

  return (
    <View
      style={{
        minHeight: 700,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
      }}
    >
      <View
        style={{
          width: 420,
          backgroundColor: Colors.light.card,
          borderRadius: 18,
          padding: 40,
          flexDirection: 'column',
          alignItems: 'center',
          shadowColor: Colors.light.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Text
          style={{
            color: Colors.light.primary,
            fontSize: 32,
            fontWeight: 'bold',
            marginBottom: 24,
            fontFamily: Fonts.sans,
          }}
        >
          Login
        </Text>
        <TextInput
          placeholder="Email"
          placeholderTextColor={Colors.light.icon}
          style={{
            width: '100%',
            backgroundColor: Colors.light.background,
            color: Colors.light.text,
            padding: 14,
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 16,
            borderWidth: 1,
            borderColor: Colors.light.border,
            fontFamily: Fonts.sans,
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={value => setForm({ ...form, email: value })}
        />
        <View style={{ width: '100%', marginBottom: 24 }}>
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor={Colors.light.icon}
              style={{
                width: '100%',
                backgroundColor: Colors.light.background,
                color: Colors.light.text,
                padding: 14,
                borderRadius: 10,
                fontSize: 16,
                borderWidth: 1,
                borderColor: Colors.light.border,
                fontFamily: Fonts.sans,
                paddingRight: 40,
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={form.password}
              onChangeText={value => setForm({ ...form, password: value })}
            />
            <TouchableOpacity
              style={{ position: 'absolute', right: 10, top: 14 }}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color={Colors.light.icon} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          onPress={onLogin}
          disabled={isPosting}
          style={{
            width: '100%',
            backgroundColor: Colors.light.primary,
            padding: 16,
            borderRadius: 10,
            alignItems: 'center',
            marginBottom: 16,
            opacity: isPosting ? 0.7 : 1,
          }}
        >
          <Text
            style={{
              color: Colors.light.card,
              fontWeight: 'bold',
              fontSize: 18,
              fontFamily: Fonts.sans,
            }}
          >
            {isPosting ? 'Cargando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/auth/register')}
        >
          <Text
            style={{
              color: Colors.light.accent,
              textDecorationLine: 'underline',
              fontFamily: Fonts.sans,
            }}
          >
            ¿No tienes cuenta? Regístrate
          </Text>
        </TouchableOpacity>
        {errorMsg && (
          <Text
            style={{
              backgroundColor: '#e74c3c',
              color: '#fff',
              borderRadius: 8,
              padding: 12,
              marginTop: 20,
              width: '100%',
              textAlign: 'center',
              fontWeight: 'bold',
              fontFamily: Fonts.sans,
            }}
          >
            {errorMsg}
          </Text>
        )}
      </View>
    </View>
  );
}
