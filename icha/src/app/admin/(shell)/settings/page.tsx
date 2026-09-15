import { getRules } from "@/lib/settings";
import { requireAdminPage } from "@/components/admin/guard";
import { Forbidden } from "@/components/admin/Forbidden";
import { SettingsForm } from "@/components/admin/SettingsForm";
import ui from "@/app/admin/admin.module.css";

export const metadata = { title: "설정" };

export default async function SettingsPage() {
  const session = await requireAdminPage();
  if (session.role !== "owner") return <Forbidden what="설정" />;
  const rules = await getRules();
  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>운영 규칙</h1>
          <p className={ui.pageDesc}>저장하면 손님 사이트 안내 문구와 자동 판정에 바로 반영됩니다.</p>
        </div>
      </div>
      <SettingsForm rules={rules} />
    </>
  );
}
