"use client";

import { Box, Button, Container, Heading, Stack, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Profile = {
  fullName: string | null;
  avatarUrl: string | null;
};

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        );

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .single();

          setProfile({
            fullName: data?.full_name || user.email,
            avatarUrl: data?.avatar_url,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <Container maxW="container.sm" py={6}>
      <Stack gap={6} pb={20}>
        {/* Profile Header */}
        <VStack gap={4} textAlign="center" py={4}>
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
          <VStack gap={1}>
            <Heading as="h1" size="md">
              {loading ? "Loading..." : profile?.fullName || "User"}
            </Heading>
            <Text color="app.muted" fontSize="sm">
              @captain_user
            </Text>
          </VStack>
        </VStack>

        {/* Stats */}
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
              0
            </Heading>
            <Text fontSize="xs" color="app.muted">
              Ratings
            </Text>
          </VStack>
          <Box w="1px" bg="app.border" />
          <VStack align="center" gap={1}>
            <Heading as="h3" size="sm" color="app.accent">
              0
            </Heading>
            <Text fontSize="xs" color="app.muted">
              Followers
            </Text>
          </VStack>
          <Box w="1px" bg="app.border" />
          <VStack align="center" gap={1}>
            <Heading as="h3" size="sm" color="app.accent">
              0
            </Heading>
            <Text fontSize="xs" color="app.muted">
              Following
            </Text>
          </VStack>
        </Stack>

        {/* Bio Section */}
        <VStack align="start" gap={2}>
          <Heading as="h2" size="sm">
            Bio
          </Heading>
          <Box
            w="100%"
            p={4}
            bg="app.surfaceSolid"
            borderRadius="lg"
            borderWidth={1}
            borderColor="app.border"
            color="app.muted"
            textAlign="center"
          >
            <Text fontSize="sm">No bio yet.</Text>
          </Box>
        </VStack>

        {/* Recent Activity */}
        <VStack align="start" gap={2}>
          <Heading as="h2" size="sm">
            Recent activity
          </Heading>
          <Box
            w="100%"
            p={4}
            bg="app.surfaceSolid"
            borderRadius="lg"
            borderWidth={1}
            borderColor="app.border"
            color="app.muted"
            textAlign="center"
          >
            <Text fontSize="sm">No ratings yet.</Text>
          </Box>
        </VStack>

        {/* Edit Profile Button */}
        <Button colorPalette="brand" size="lg">
          Edit Profile
        </Button>
      </Stack>
    </Container>
  );
}
