import { Alert, Box, Heading, Text } from "@chakra-ui/react";

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;

  return (
    <Box>
      <Heading size="lg" mb="4">
        Authentification échouée
      </Heading>
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Impossible de terminer la connexion</Alert.Title>
          <Alert.Description>
            Réessayez la connexion ou l&apos;inscription.
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
      {reason ? (
        <Text mt="4" fontFamily="mono" fontSize="sm" color="fg.muted">
          {reason}
        </Text>
      ) : null}
      <Text mt="4" color="fg.muted">
        Vérifiez aussi votre configuration OAuth et les URLs de redirection Supabase.
      </Text>
    </Box>
  );
}
