import { RequireUser } from "@/components/auth/require-user";
import { ReportForm } from "@/components/report/report-form";

export default function ReportPage() {
  return (
    <RequireUser>
      <ReportForm />
    </RequireUser>
  );
}
