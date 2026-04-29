"use client";

import dynamic from "next/dynamic";
import { Box, Spinner, Stack, Text } from "@chakra-ui/react";

const CommunityMap = dynamic(
  () => import("@/components/CommunityMap").then((mod) => mod.CommunityMap),
  {
    ssr: false,
    loading: () => (
      <Stack h="full" align="center" justify="center" gap={3}>
        <Spinner size="lg" color="brand.500" />
        <Text fontSize="sm" color="app.muted">
          Chargement de la carte...
        </Text>
      </Stack>
    ),
  },
);

export default function NearbyPage() {
  return (
    <Box h="calc(100dvh - 7.5rem)">
      <CommunityMap />
    </Box>
  );
}
