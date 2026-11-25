// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { Fragment } from 'react';
import { routeHref } from '@/dc/route';
import { Sidebar } from './DashSidebar';
import { AppBar } from './components/AppBar';
import { KkksBanner } from './components/KkksBanner';
import { FilterBar } from './components/FilterBar';
import { ActiveFilters } from './components/ActiveFilters';
import { KpiRow } from './components/KpiRow';
import { AiFindings } from './components/AiFindings';
import { ActionList } from './components/ActionList';
import { IncidentMap } from './components/IncidentMap';
import { TopCategories } from './components/TopCategories';
import { IncidentVsRisk } from './components/IncidentVsRisk';
import { TrendChart } from './components/TrendChart';
import { HandlingStatus } from './components/HandlingStatus';
import { CategoryMatrix } from './components/CategoryMatrix';
import { Footnote } from './components/Footnote';

/** Kerangka halaman Dashboard; isi tiap bagian ada di ./components. `v` = hasil renderVals(). */
export function DashboardView({ v }: { v: any }) {
  void routeHref; void Fragment;
  return (
    <><div className="lk-app p-app db-page" style={{ minHeight: "2900px" }}>
<Sidebar active="analitik" user={v.user} role={v.role} taskCount={v.tasks} h="2900" />
<div className="lk-main">
<AppBar v={v} />
<main className="lk-content">
<KkksBanner v={v} />
<FilterBar v={v} />
<ActiveFilters v={v} />
<div className="lk-grid">
<KpiRow v={v} />
<AiFindings v={v} />
<ActionList v={v} />
<IncidentMap v={v} />
<TopCategories v={v} />
<IncidentVsRisk v={v} />
<TrendChart v={v} />
<HandlingStatus v={v} />
<CategoryMatrix v={v} />
<Footnote v={v} />
</div>
</main>
</div>
</div></>
  );
}
