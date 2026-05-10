import NextLink from "next/link";
import {
  Alert,
  Button,
  Card,
  Field,
  Heading,
  Input,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { login, loginWithGithub, loginWithGoogle, loginWithMagicLink, sendPasswordReset } from "./actions";

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
              <Input type="hidden" name="next" value={safeNext} />
              <Field.Root required>
                <Field.Label>Email</Field.Label>
                <Input name="email" type="email" />
              </Field.Root>
              <Field.Root required>
                <Field.Label>Mot de passe</Field.Label>
                <Input name="password" type="password" />
              </Field.Root>
              <Button type="submit">Se connecter</Button>
            </Stack>
          </form>

          <form action={loginWithGithub}>
            <Input type="hidden" name="next" value={safeNext} />
            <Button variant="outline" type="submit" w="full">
              Continuer avec GitHub
            </Button>
          </form>

          <form action={loginWithGoogle}>
            <Input type="hidden" name="next" value={safeNext} />
            <Button variant="outline" type="submit" w="full">
              Continuer avec Google
            </Button>
          </form>

          {/* <form action={loginWithMagicLink}>
            <Stack gap="3">
              <Input type="hidden" name="next" value={safeNext} />
              <Field.Root required>
                <Field.Label>Magic link</Field.Label>
                <Input name="email" type="email" placeholder="you@example.com" />
              </Field.Root>
              <Button variant="outline" type="submit" w="full">
                Recevoir un magic link
              </Button>
            </Stack>
          </form> */}

          {/* <form action={sendPasswordReset}>
            <Stack gap="3">
              <Field.Root required>
                <Field.Label>Réinitialiser le mot de passe</Field.Label>
                <Input name="email" type="email" placeholder="you@example.com" />
              </Field.Root>
              <Button variant="ghost" type="submit" w="full">
                Envoyer l&apos;email de réinitialisation
              </Button>
            </Stack>
          </form> */}

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
