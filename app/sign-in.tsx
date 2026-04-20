import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function SignInScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 32 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>play.calmo</Text>
      <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
        Login com Google — Fase 3
      </Text>
      <Pressable
        onPress={() => router.replace('/(app)/(tabs)')}
        style={{
          backgroundColor: '#E53535',
          borderRadius: 999,
          paddingVertical: 14,
          paddingHorizontal: 32,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
          Entrar como demo
        </Text>
      </Pressable>
    </View>
  );
}
