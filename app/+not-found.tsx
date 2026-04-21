import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Não encontrado' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>Página não encontrada</Text>
        <Link href="/">
          <Text style={{ fontSize: 14, textDecorationLine: 'underline' }}>Voltar ao início</Text>
        </Link>
      </View>
    </>
  );
}
