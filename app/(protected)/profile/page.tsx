import { Box, Container, Heading, Image, Stack, Text, VStack } from "@chakra-ui/react";
import { redirect } from "next/navigation";
import { ProfileForms } from "@/components/profile/ProfileForms";
import { createClient } from "@/lib/supabase/server";

type RatingStats = {
  total_ratings: number;
  average_rating: number | null;
  ratings_last_30_days: number;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: statsData } = await supabase.rpc("get_user_rating_stats", {
    p_user_id: user.id,
  });

  const stats = (statsData?.[0] as RatingStats | undefined) ?? {
    total_ratings: 0,
    average_rating: null,
    ratings_last_30_days: 0,
  };

  const displayName = profile?.full_name || user.email || "User";
  const avatarUrl = profile?.avatar_url;

  return (
    <Container maxW="container.sm" py={6}>
      <Stack gap={6}>
        <VStack gap={4} textAlign="center" py={2}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              w="20"
              h="20"
              borderRadius="full"
              objectFit="cover"
            />
          ) : (
            <Box
              w="20"
              h="20"
              borderRadius="full"
              bg="brand.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="2xl"
            >
              👤
            </Box>
          )}
          <VStack gap={1}>
            <Heading as="h1" size="md">
              {displayName}
            </Heading>
            <Text color="app.muted" fontSize="sm">
              {user.email}
            </Text>
          </VStack>
        </VStack>

        <Stack
          direction="row"
          justify="space-around"
          p={4}
          bg="app.surfaceSolid"
          borderRadius="lg"
          borderWidth={1}
          borderColor="app.border"
        >
          <VStack align="center" gap={1}>
            <Heading as="h3" size="sm" color="app.accent">
              {stats.total_ratings}
            </Heading>
            <Text fontSize="xs" color="app.muted">
              Ratings
            </Text>
          </VStack>
          <Box w="1px" bg="app.border" />
          <VStack align="center" gap={1}>
            <Heading as="h3" size="sm" color="app.accent">
              {stats.average_rating ? Number(stats.average_rating).toFixed(1) : "-"}
            </Heading>
            <Text fontSize="xs" color="app.muted">
              Note moyenne
            </Text>
          </VStack>
          <Box w="1px" bg="app.border" />
          <VStack align="center" gap={1}>
            <Heading as="h3" size="sm" color="app.accent">
              {stats.ratings_last_30_days}
            </Heading>
            <Text fontSize="xs" color="app.muted">
              30 derniers jours
            </Text>
          </VStack>
        </Stack>

        <ProfileForms
          initialFullName={profile?.full_name || ""}
          initialEmail={user.email || ""}
        />
      </Stack>
    </Container>
  );
}
