import EditPage from "./EditPage";

type Props = {
  searchParams: Promise<{ field?: string }>;
};

export default async function EditProfilePage({ searchParams }: Props) {
  const { field } = await searchParams;
  return <EditPage field={field ?? "email"}/>;
}
