import { AuthView } from '@neondatabase/auth-ui';

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <div className="mx-auto flex max-w-md flex-col items-stretch justify-center gap-3 py-12">
      <AuthView path={path} />
    </div>
  );
}
