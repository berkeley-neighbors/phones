import { Layout } from "../Layout/Layout";

const RUNBOOK_URL = import.meta.env.VITE_RUNBOOK_URL || "";

export const RunbookPage = () => {
  return (
    <Layout title="Runbook">
      <div className="w-full h-[calc(100vh-8rem)]">
        <iframe src={RUNBOOK_URL} className="w-full h-full border-0" title="Runbook" />
      </div>
    </Layout>
  );
};
