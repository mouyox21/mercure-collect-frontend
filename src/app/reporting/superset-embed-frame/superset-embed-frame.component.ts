import { Component, computed, input } from '@angular/core';
import { KpiResponse } from '../../shared/data-access/models/reporting.model';

interface BarData {
  kpi: KpiResponse;
  barWidth: number;
  displayValue: string;
}

@Component({
  selector: 'mc-superset-embed-frame',
  standalone: true,
  templateUrl: './superset-embed-frame.component.html',
  styleUrl: './superset-embed-frame.component.scss',
})
export class SupersetEmbedFrameComponent {
  readonly kpis        = input<KpiResponse[]>([]);
  readonly embedToken  = input<string | undefined>(undefined);
  readonly dashboardId = input<string | undefined>(undefined);

  protected readonly isMock = computed(() => !this.embedToken());

  private readonly maxValue = computed(() =>
    Math.max(...this.kpis().map(k => k.value), 1)
  );

  protected readonly barsData = computed<BarData[]>(() => {
    const max = this.maxValue();
    return this.kpis().map(kpi => ({
      kpi,
      barWidth: (kpi.value / max) * 100,
      displayValue: this.fmtValue(kpi),
    }));
  });

  private fmtValue(kpi: KpiResponse): string {
    if (kpi.unit === 'MAD') {
      return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(kpi.value) + ' MAD';
    }
    if (kpi.unit === 'actions') return kpi.value.toFixed(1) + ' act.';
    return `${kpi.value} ${kpi.unit}`;
  }

  protected fmtTrend(t: number): string {
    return Math.abs(t).toFixed(1);
  }
}
