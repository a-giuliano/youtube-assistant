import { AccountView } from '@neondatabase/auth-ui';
import { accountViewPaths } from '@neondatabase/auth-ui/server';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <div className="mx-auto max-w-3xl py-6">
      <AccountView path={path} />
    </div>
  );
}
