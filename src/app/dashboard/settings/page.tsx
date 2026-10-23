import type { Metadata } from 'next';
import { PageHeader } from '@/components/app/ui-bits';
import { SettingsForms } from '@/components/app/SettingsForms';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and account security." />
      <SettingsForms />
    </>
  );
}
