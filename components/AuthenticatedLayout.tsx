"use client";

import { Box, Stack } from "@chakra-ui/react";
import { ReactNode } from "react";
import { AppBar } from "./AppBar";

type AuthenticatedLayoutProps = {
  children: ReactNode;
  title?: string;
};

export function AuthenticatedLayout({
  children,
  title = "Captain",
}: AuthenticatedLayoutProps) {
  return (
    <Stack h="100dvh" gap={0}>
      {/* Top AppBar */}
      <AppBar />

      {/* Main Content */}
      <Box
        flex={1}
        overflowY="auto"
        pb="16"
        bg="app.canvas"
      >
        {children}
      </Box>
    </Stack>
  );
}
