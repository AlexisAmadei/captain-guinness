export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "linear-gradient(160deg, #f6f1e6 0%, #ede4cf 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>{children}</div>
    </main>
  );
}
