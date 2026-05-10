import NextLink from "next/link";
import { Box, Button, Container, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";

export const metadata = {
  title: "Captain — Notez et découvrez les meilleurs bars",
  description: "Captain est l'application pour noter, explorer et partager vos bars préférés autour de vous.",
};

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <Box
      bg="app.surface"
      border="1px solid"
      borderColor="app.border"
      borderRadius="panel"
      p="6"
    >
      <Stack gap="3">
        <Text fontSize="2xl">{icon}</Text>
        <Heading size="sm">{title}</Heading>
        <Text color="fg.muted" fontSize="sm">{body}</Text>
      </Stack>
    </Box>
  );
}

export default function InformationPage() {
  return (
    <Box as="main" minH="100dvh">
      {/* Hero */}
      <Box py={{ base: "20", md: "32" }}>
        <Container maxW="3xl" textAlign="center">
          <Stack gap="6" alignItems="center">
            <Heading
              size={{ base: "3xl", md: "4xl" }}
              lineHeight="tight"
            >
              Découvrez les meilleurs bars
              <Box as="span" color="app.accent"> autour de vous.</Box>
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="fg.muted" maxW="xl">
              Captain vous permet de noter, explorer et partager vos bars préférés.
              Trouvez l&apos;endroit idéal grâce aux avis de votre communauté.
            </Text>
            <Stack direction="row" gap="3">
              <Button asChild colorPalette="brand" size="lg">
                <NextLink href="/auth/register">Créer un compte</NextLink>
              </Button>
              <Button asChild variant="outline" size="lg">
                <NextLink href="/auth/login">Se connecter</NextLink>
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features */}
      <Box pb={{ base: "20", md: "32" }}>
        <Container maxW="3xl">
          <Stack gap="12">
            <Heading size="xl" textAlign="center">Comment ça marche ?</Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap="4">
              <FeatureCard
                icon="📍"
                title="Explorez autour de vous"
                body="Visualisez les bars à proximité sur une carte interactive et trouvez votre prochain spot."
              />
              <FeatureCard
                icon="⭐"
                title="Notez et commentez"
                body="Donnez votre avis sur l'ambiance, les prix, le service et bien plus. Chaque note compte."
              />
              <FeatureCard
                icon="🍺"
                title="Partagez vos découvertes"
                body="Aidez votre communauté à trouver les meilleures adresses grâce à vos recommandations."
              />
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        borderTop="1px solid"
        borderColor="app.border"
        py="6"
      >
        <Container maxW="3xl">
          <Stack direction="row" justify="space-between" align="center" flexWrap="wrap" gap="2">
            <Text fontSize="sm" color="fg.muted">
              © {new Date().getFullYear()} Captain
            </Text>
            <Stack direction="row" gap="4">
              <Text asChild fontSize="sm" color="fg.muted" _hover={{ color: "fg" }} cursor="pointer">
                <NextLink href="/privacy">Confidentialité</NextLink>
              </Text>
              <Text asChild fontSize="sm" color="fg.muted" _hover={{ color: "fg" }} cursor="pointer">
                <NextLink href="/cgu">CGU</NextLink>
              </Text>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
