import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";

export const metadata = {
  title: "Conditions générales d'utilisation — Captain",
};

export default function CguPage() {
  return (
    <Box as="main" minH="100dvh" py="16">
      <Container maxW="2xl">
        <Stack gap="8">
          <Stack gap="2">
            <Heading size="2xl">Conditions générales d&apos;utilisation</Heading>
            <Text color="fg.muted">Dernière mise à jour : mai 2026</Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">1. Objet</Heading>
            <Text>
              Captain est une application permettant de noter et de découvrir des bars.
              L&apos;utilisation du service implique l&apos;acceptation sans réserve des
              présentes conditions.
            </Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">2. Accès au service</Heading>
            <Text>
              L&apos;accès à Captain nécessite la création d&apos;un compte. Vous devez
              avoir au moins 18 ans pour vous inscrire. Vous êtes responsable de la
              confidentialité de vos identifiants.
            </Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">3. Contenu publié</Heading>
            <Text>
              Vous êtes seul responsable des avis et notes que vous publiez. Tout
              contenu abusif, diffamatoire ou contraire aux lois en vigueur pourra
              être supprimé sans préavis. Vous accordez à Captain une licence
              non-exclusive d&apos;utilisation de ce contenu dans le cadre du service.
            </Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">4. Disponibilité</Heading>
            <Text>
              Nous nous efforçons de maintenir le service disponible en permanence,
              mais ne garantissons pas une disponibilité ininterrompue. Des
              interruptions pour maintenance peuvent survenir.
            </Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">5. Résiliation</Heading>
            <Text>
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres
              de l&apos;application. Nous nous réservons le droit de suspendre un
              compte en cas de violation des présentes conditions.
            </Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">6. Responsabilité</Heading>
            <Text>
              Captain est fourni en l&apos;état, sans garantie d&apos;exactitude des
              informations publiées par les utilisateurs. Notre responsabilité ne
              saurait être engagée pour tout dommage indirect lié à l&apos;utilisation
              du service.
            </Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">7. Droit applicable</Heading>
            <Text>
              Les présentes conditions sont soumises au droit français. Tout litige
              sera porté devant les tribunaux compétents de Paris.
            </Text>
          </Stack>

          <Stack gap="3">
            <Heading size="md">8. Contact</Heading>
            <Text>
              Pour toute question :{" "}
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
