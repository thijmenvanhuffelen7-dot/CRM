import { useState } from "react";
import { format } from "date-fns";
import { Building2, FileText } from "lucide-react";
import { useData } from "@/store/data";
import { Page, PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { ReportView, type Range } from "@/components/reports/ReportView";
import { useLoading } from "@/hooks/useLoading";
import { exportReportPdf } from "@/lib/print";

export default function Reports() {
  const loading = useLoading("reports");
  const { clients, agency } = useData();
  const [scope, setScope] = useState("all");
  const [range, setRange] = useState<Range>("1");
  const [bar, setBar] = useState<"revenue" | "openRate" | "clickRate">("revenue");
  const client = clients.find((c) => c.id === scope);
  const title = client ? `${client.name} — ${format(new Date(), "MMMM yyyy")} report` : `${agency.name} — agency report ${format(new Date(), "MMMM yyyy")}`;

  return (
    <Page wide>
      <PageHeader
        title="Reports"
        description="Performance across clients — what email is earning, and where it's moving."
        actions={
          <>
            <div className="w-56">
              <Select
                ariaLabel="Report scope"
                value={scope}
                onValueChange={setScope}
                options={[
                  { value: "all", label: "All clients (agency)", icon: <Building2 className="size-4 text-muted-foreground" /> },
                  ...clients.map((c) => ({ value: c.id, label: c.name, icon: <CompanyLogo name={c.name} color={c.color} size="xs" /> })),
                ]}
              />
            </div>
            <Button variant="secondary" onClick={() => exportReportPdf(title)}>
              <FileText /> Export as PDF
            </Button>
          </>
        }
      />
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-[104px] rounded-lg" />
          <div className="grid gap-4 lg:grid-cols-5">
            <Skeleton className="h-[340px] rounded-lg lg:col-span-3" />
            <Skeleton className="h-[340px] rounded-lg lg:col-span-2" />
          </div>
        </div>
      ) : (
        <div id="print-root">
          <ReportView
            key={scope}
            clientIds={client ? [client.id] : undefined}
            range={range}
            onRangeChange={setRange}
            barMetric={bar}
            onBarMetricChange={setBar}
            printTitle={client ? `${client.name} · Email marketing report` : `${agency.name} · Agency report`}
          />
        </div>
      )}
    </Page>
  );
}
