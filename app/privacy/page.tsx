import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";

export const metadata = {
  title: "Politique de confidentialité — Captain",
};

export default function PrivacyPage() {
  return (
    <Box as="main" minH="100dvh" py="16">
      <Container maxW="2xl">
        <Stack gap="8">
          <Stack gap="2">
            <Heading size="2xl">Politique de confidentialité</Heading>
            <Text color="fg.muted">Dernière mise à jour : mai 2026</Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">1. Données collectées</Heading>
            <Text>
              Nous collectons votre adresse e-mail lors de la création de compte,
              ainsi que les avis et notes que vous publiez sur l&apos;application.
              Si vous utilisez la connexion OAuth (Google, GitHub), nous recevons
              uniquement l&apos;e-mail et le nom associés à ce compte.
            </Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">2. Utilisation des données</Heading>
            <Text>
              Vos données sont utilisées exclusivement pour faire fonctionner le
              service : authentification, affichage de vos avis, et personnalisation
              de votre expérience. Nous ne vendons ni ne partageons vos données avec
              des tiers à des fins commerciales.
            </Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">3. Stockage</Heading>
            <Text>
              Les données sont stockées sur des serveurs Supabase situés dans
              l&apos;Union européenne. Elles sont protégées par des politiques de
              contrôle d&apos;accès strictes.
            </Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">4. Vos droits</Heading>
            <Text>
              Conformément au RGPD, vous pouvez à tout moment demander l&apos;accès,
              la rectification ou la suppression de vos données en nous contactant à{" "}
              <Text as="span" color="blue.400">
                contact@captain-guinness.fr
              </Text>
              .
            </Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">5. Cookies</Heading>
            <Text>
              Nous utilisons uniquement des cookies techniques nécessaires à la
              gestion de session. Aucun cookie publicitaire ou de tracking n&apos;est
              utilisé.
            </Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">6. Contact</Heading>
            <Text>
              Pour toute question relative à la confidentialité :{" "}
              <Text as="span" color="blue.400">
                contact@captain-guinness.fr
              </Text>
            </Text>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
