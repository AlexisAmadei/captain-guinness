import NextLink from "next/link";
import {
  Alert,
  Button,
  Card,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { login, loginWithGithub, loginWithGoogle } from "./actions";
import { LoginCredentialsFields } from "./LoginCredentialsFields";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message, next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <Card.Root>
      <Card.Header>
        <Heading size="lg">Connexion</Heading>
        <Text color="fg.muted">Accédez à votre compte</Text>
      </Card.Header>
      <Card.Body>
        <Stack gap="4">
          {error ? (
            <Alert.Root status="error">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Échec de connexion</Alert.Title>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          {message ? (
            <Alert.Root status="success">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{message}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ) : null}

          <form action={login}>
            <Stack gap="3">
              <input type="hidden" name="next" value={safeNext} />
              <LoginCredentialsFields />
              <Button type="submit">Se connecter</Button>
            </Stack>
          </form>

          <form action={loginWithGithub}>
            <input type="hidden" name="next" value={safeNext} />
            <Button variant="outline" type="submit" w="full">
              Continuer avec GitHub
            </Button>
          </form>

          <form action={loginWithGoogle}>
            <input type="hidden" name="next" value={safeNext} />
            <Button variant="outline" type="submit" w="full">
              Continuer avec Google
            </Button>
          </form>

          <Text fontSize="sm" color="fg.muted">
            Pas encore de compte ?{" "}
            <Link asChild>
              <NextLink href={`/auth/register?next=${encodeURIComponent(safeNext)}`}>Créer un compte</NextLink>
            </Link>
          </Text>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
