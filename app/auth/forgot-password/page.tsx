import NextLink from "next/link";
import { Button, Card, Field, Heading, Input, Link, Stack, Text } from "@chakra-ui/react";
import { sendPasswordReset } from "../login/actions";

export const metadata = {
  title: "Mot de passe oublié — Captain",
};

type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <Card.Root>
      <Card.Header>
        <Heading size="lg">Mot de passe oublié</Heading>
        <Text color="fg.muted">Recevez un lien de réinitialisation par email</Text>
      </Card.Header>
      <Card.Body>
        <form action={sendPasswordReset}>
          <Stack gap="4">
            <Field.Root required>
              <Field.Label>Email</Field.Label>
              <Input name="email" type="email" placeholder="votre@email.com" defaultValue={email ?? ""} autoFocus />
            </Field.Root>
            <Button type="submit" w="full">
              Envoyer le lien
            </Button>
            <Text fontSize="sm" color="fg.muted" textAlign="center">
              <Link asChild>
                <NextLink href="/auth/login">Retour à la connexion</NextLink>
              </Link>
            </Text>
          </Stack>
        </form>
      </Card.Body>
    </Card.Root>
  );
}
