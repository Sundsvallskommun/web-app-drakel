import { redirect } from 'next/navigation';

/** /admin has no page of its own — it opens on mallhanteringen. */
const AdminPage = async ({ params }: { params: Promise<{ locale: string }> }) => {
  const { locale } = await params;
  redirect(`/${locale}/admin/mallar`);
};

export default AdminPage;
