import { Colors, Fonts } from '@/constants/theme';
import { authRegister } from '@/core/auth/actions/auth-actions';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  // Ocultar error tras 3 segundos
  React.useEffect(() => {
    if (errorMsg) {
      const timeout = setTimeout(() => setErrorMsg(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [errorMsg]);
  React.useEffect(() => {
    if (successMsg) {
      const timeout = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [successMsg]);


  const onRegister = async () => {
    const { email, password, confirmPassword } = form;
    if (!email || !password || !confirmPassword) {
      setErrorMsg('Rellena todos los campos');
      setSuccessMsg(null);
      setIsPosting(false);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      setSuccessMsg(null);
      setIsPosting(false);
      return;
    }
    setIsPosting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const user = await authRegister({ email, password });
      if (user) {
        setSuccessMsg('¡Registro exitoso! Ya puedes iniciar sesión.');
        setTimeout(() => router.replace('/auth/login'), 1500);
      } else {
        setErrorMsg('No se pudo registrar el usuario');
      }
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.msg || 'No se pudo registrar el usuario');
    } finally {
      setIsPosting(false);
    }
  };

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
          Registro
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
        <View style={{ width: '100%', marginBottom: 16 }}>
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
        <View style={{ width: '100%', marginBottom: 24 }}>
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder="Repetir contraseña"
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
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              value={form.confirmPassword}
              onChangeText={value => setForm({ ...form, confirmPassword: value })}
            />
            <TouchableOpacity
              style={{ position: 'absolute', right: 10, top: 14 }}
              onPress={() => setShowConfirmPassword((v) => !v)}
            >
              <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color={Colors.light.icon} />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          onPress={onRegister}
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
            {isPosting ? 'Registrando...' : 'Registrarse'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.replace('/auth/login')}
        >
          <Text
            style={{
              color: Colors.light.accent,
              textDecorationLine: 'underline',
              fontFamily: Fonts.sans,
            }}
          >
            ¿Ya tienes cuenta? Inicia sesión
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
        {successMsg && (
          <Text
            style={{
              backgroundColor: '#27ae60',
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
            {successMsg}
          </Text>
        )}
      </View>
    </View>
  );
}