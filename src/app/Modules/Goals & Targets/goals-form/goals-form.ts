import { FormArray, NonNullableFormBuilder, FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  startWith,
  switchMap,
} from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injectable, OnInit, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { ActionColumnComponent } from '../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TemplateComponent } from '../../../Common/template/template.component';
import { CommonService, type StrategyDepartmentGroup } from '../../../Service/common/common.service';
import * as XLSX from 'xlsx';
import { SuccessDialogComponent } from '../../../Common/success-dialog/success-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MonthStrategyMultiselectComponent } from './month-strategy-multiselect.component';

@Injectable()
export class GoalsFormStore {
  private readonly commonService = inject(CommonService);
  private readonly userId = Number(sessionStorage.getItem('session_id'));
  private readonly dialog = inject(MatDialog);

  readonly downloadMessage = signal(false);
  readonly isSubmitting = signal(false);

  // Projects resource
  readonly projectsResource = rxResource<any[], { userId: number }>({
    params: () => ({ userId: this.userId }),
    stream: (loaderParams: { params: { userId: number } }) => this.commonService.fetchUserProjectDropdown(loaderParams.params.userId),
  });

  // Configurations resource
  readonly configurationsResource = rxResource<any[], void>({
    stream: () => this.commonService.fetchConfigurations(),
  });

  /** Grouped by department for compact Tailwind multiselect */
  readonly strategysGroupedResource = rxResource<StrategyDepartmentGroup[], void>({
    stream: () => this.commonService.fetchAllStrategysGrouped(),
  });

  // Computed views for easier template access
  readonly projects = computed<any[]>(() => this.projectsResource.value() ?? []);
  readonly strategysGrouped = computed(() => this.strategysGroupedResource.value() ?? []);
  /** Flattened list (tooltips, exports) */
  readonly strategys = computed(() => {
    const rows = this.strategysGrouped();
    const out: Array<{
      strategy_id: number;
      strategy_name: string;
      department_name: string;
      label: string;
    }> = [];
    for (const dept of rows) {
      const dname = dept.department_name;
      for (const s of dept.strategies) {
        out.push({
          strategy_id: s.strategy_id,
          strategy_name: s.strategy_name,
          department_name: dname,
          label: dname && dname !== '—' ? `${s.strategy_name} · ${dname}` : s.strategy_name,
        });
      }
    }
    return out;
  });
  readonly configurations = computed<any[]>(() => {
    const res = this.configurationsResource.value();
    const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
    return list;
  });

  exportToExcel(formValue: any, calculatedValues: any) {
    const v = formValue;
    const name = v.participant?.name || 'Participant';

    const wb = XLSX.utils.book_new();

    const getEffortsStr = (arr: any[] = []) =>
      arr.map((v: any) => v.text).filter((v: any) => v).join(' | ');

    const rows = [
      ['GOAL SETTING · PROJECT HEADS & TEAM LEADS · FY 2026–27'],
      [],
      ['COMPANY GOAL', v.companyGoal],
      ["MANAGER'S GOAL", v.managerGoal],
      [],
      ['PARTICIPANT DETAILS'],
      ['Name', v.participant?.name],
      ['Designation / Team', v.participant?.designation],
      ['Reporting to', v.participant?.reportsTo],
      ['Project / Territory', v.participant?.project_id?.join(', ') || ''],
      [],
      ['MY GOAL FOR FY 2026–27'],
      ['My goal is to', v.myGoal?.goal],
      ["This supports my manager's goal by", v.myGoal?.contribution],
      [],
      ['MY ROLES', 'Measured by', 'Annual target'],
      ...(v.roles || []).map((r: any, idx: number) => [
        `Role ${String(idx + 1).padStart(2, '0')}: ${r?.title || '—'}`,
        r?.measure || '—',
        r?.target || '—'
      ]),
      [],
      ['ACTION ITEMS'],
      ...(v.roles || []).map((r: any, idx: number) => [
        `Role ${String(idx + 1).padStart(2, '0')} actions`,
        getEffortsStr(r?.actionItems)
      ]),
      [],
      ['MONTHLY UNITS / BOOKINGS TARGET'],
      ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
      [
        v.targets?.months?.apr, v.targets?.months?.may, v.targets?.months?.jun,
        v.targets?.months?.jul, v.targets?.months?.aug, v.targets?.months?.sep,
        v.targets?.months?.oct, v.targets?.months?.nov, v.targets?.months?.dec,
        v.targets?.months?.jan, v.targets?.months?.feb, v.targets?.months?.mar
      ],
      [],
      ['QUARTERLY SUMMARY', 'Q1 (Apr–Jun)', 'Q2 (Jul–Sep)', 'Q3 (Oct–Dec)', 'Q4 (Jan–Mar)'],
      ['Units target', calculatedValues.q1Units || '—', calculatedValues.q2Units || '—', calculatedValues.q3Units || '—', calculatedValues.q4Units || '—'],
      ['Lead → Booking %', v.targets?.conversion?.q1, v.targets?.conversion?.q2, v.targets?.conversion?.q3, v.targets?.conversion?.q4],
      ['Agreement TAT (hrs)', v.targets?.tatAgreement?.q1, v.targets?.tatAgreement?.q2, v.targets?.tatAgreement?.q3, v.targets?.tatAgreement?.q4],
      ['Disbursement TAT (hrs)', v.targets?.tatDisbursement?.q1, v.targets?.tatDisbursement?.q2, v.targets?.tatDisbursement?.q3, v.targets?.tatDisbursement?.q4],
      [],
      ['SANCTIONED INVENTORY · 1 APRIL 2026'],
      (() => {
        const opening = v.inventory?.opening;
        const rows = Array.isArray(opening) ? opening : [];
        const flat: any[] = [];
        rows.forEach((row: any) => {
          flat.push(row.configuration_name ?? '', row.units ?? '');
        });
        return [...flat, 'Total', calculatedValues.totalInventoryOpening || ''];
      })(),
      [],
      ['INVENTORY NEEDED PER QUARTER', 'Q1', v.inventory?.needed?.q1, 'Q2', v.inventory?.needed?.q2, 'Q3', v.inventory?.needed?.q3, 'Q4', v.inventory?.needed?.q4, 'FY Total', calculatedValues.totalInventoryNeeded || ''],
      [],
      ['WHAT I NEED'],
      ['People', getEffortsStr(v.needs?.people)],
      ['Strategy', getEffortsStr(v.needs?.strategy)],
      ['Resources', getEffortsStr(v.needs?.resources)],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(rows);
    ws1['!cols'] = [{ wch: 32 }, { wch: 55 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'My Commitment');

    const months = ['Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26', 'Dec 26', 'Jan 27', 'Feb 27', 'Mar 27'];
    const revRows: any[][] = [
      ['MONTHLY REVIEW · FY 2026–27'],
      [`Name: ${v.participant?.name || ''}`, `Manager: ${v.participant?.reportsTo || ''}`, `Project: ${v.participant?.project_id?.join(', ') || ''}`],
      [],
      ['Month', 'Units target', 'Units actual', 'Conversion % target', 'Conversion % actual', 'Agr TAT target (hrs)', 'Agr TAT actual (hrs)', 'Disb TAT target (hrs)', 'Disb TAT actual (hrs)', 'Status', 'Notes'],
    ];

    months.forEach((m) => {
      revRows.push([m, '', '', '', '', '', '', '', '', '', '']);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(revRows);
    ws2['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Monthly Review');

    const filename = `GoalSetting_${name.replace(/\s+/g, '_')}_TeamLead_FY2627.xlsx`;
    XLSX.writeFile(wb, filename);

    this.downloadMessage.set(true);
    setTimeout(() => {
      this.downloadMessage.set(false);
    }, 4000);
  }

  async submitGoal(payload: any) {
    this.isSubmitting.set(true);
    try {
      const response = await firstValueFrom(this.commonService.addFullGoal(payload));
      this.dialog.open(SuccessDialogComponent, {
        data: { message: response.message },
      });
      return true;
    } catch (err: any) {
      console.error('Submission error:', err);
      this.dialog.open(SuccessDialogComponent, {
        data: { message: 'Project Already Exists' },
      });
      return false;
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

@Component({
  selector: 'app-goals-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent,
    ActionColumnComponent,
    MonthStrategyMultiselectComponent,
  ],
  templateUrl: './goals-form.html',
  styleUrl: './goals-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GoalsFormStore]
})
export class GoalsForm implements OnInit {
  /** FY month order for units (Apr → Mar). */
  readonly MONTH_KEYS = [
    'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar',
  ] as const;

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  readonly store = inject(GoalsFormStore);
  private readonly commonService = inject(CommonService);
  get roleIds(): number[] {
    const raw = sessionStorage.getItem('role_id') || '';
    return raw.split(',').map(v => Number(v.trim())).filter(v => !isNaN(v) && v > 0);
  }
  readonly fullFormRoles = [2, 14, 23, 26, 28, 19,];

  get isFullForm(): boolean {
    return this.roleIds.some(id => this.fullFormRoles.includes(id));
  }

  readonly goalsForm = this.fb.group({

    participant: this.fb.group({
      name: ['', [Validators.required]],
      designation: ['', [Validators.required]],
      reportsTo: ['', [Validators.required]],
      project_id: [[] as any[], [Validators.required]],
    }),
    myGoal: this.fb.group({
      goal: ['', [Validators.required]],
      contribution: [''],
    }),
    roles: this.fb.array([
      this.createRoleFormGroup(),
      this.createRoleFormGroup(),
      this.createRoleFormGroup(),
    ]),
    targets: this.fb.group({
      months: this.fb.group({
        apr: [null as number | null, [Validators.required]],
        may: [null as number | null, [Validators.required]],
        jun: [null as number | null, [Validators.required]],
        jul: [null as number | null, [Validators.required]],
        aug: [null as number | null, [Validators.required]],
        sep: [null as number | null, [Validators.required]],
        oct: [null as number | null, [Validators.required]],
        nov: [null as number | null, [Validators.required]],
        dec: [null as number | null, [Validators.required]],
        jan: [null as number | null, [Validators.required]],
        feb: [null as number | null, [Validators.required]],
        mar: [null as number | null, [Validators.required]]
      }),
      conversion: this.fb.group({
        q1: ['', [Validators.required]],
        q2: ['', [Validators.required]],
        q3: ['', [Validators.required]],
        q4: ['', [Validators.required]]
      }),
      tatAgreement: this.fb.group({
        q1: ['', [Validators.required]],
        q2: ['', [Validators.required]],
        q3: ['', [Validators.required]],
        q4: ['', [Validators.required]]
      }),
      tatDisbursement: this.fb.group({
        q1: ['', [Validators.required]],
        q2: ['', [Validators.required]],
        q3: ['', [Validators.required]],
        q4: ['', [Validators.required]]
      }),
      monthStrategies: this.fb.group({
        apr: [[] as number[]],
        may: [[] as number[]],
        jun: [[] as number[]],
        jul: [[] as number[]],
        aug: [[] as number[]],
        sep: [[] as number[]],
        oct: [[] as number[]],
        nov: [[] as number[]],
        dec: [[] as number[]],
        jan: [[] as number[]],
        feb: [[] as number[]],
        mar: [[] as number[]],
      }),
    }),
    inventory: this.fb.group({
      opening: this.fb.array<FormGroup>([]),
      needed: this.fb.group({
        q1: [null as number | null, [Validators.required]],
        q2: [null as number | null, [Validators.required]],
        q3: [null as number | null, [Validators.required]],
        q4: [null as number | null, [Validators.required]]
      })
    }),
    team: this.fb.group({
      crm_team: [null as number | null, [Validators.required]],
      sale_team: [null as number | null, [Validators.required]],
      pre_sale_team: [null as number | null, [Validators.required]],
      gre: [null as number | null, [Validators.required]],
      source_team: [null as number | null, [Validators.required]],
    }),
    needs: this.fb.group({
      people: this.fb.array([this.createOptionalEffortControl()]),
      strategy: this.fb.array([this.createOptionalEffortControl()]),
      resources: this.fb.array([this.createOptionalEffortControl()])
    })
  });

  private readonly formState = signal(this.goalsForm.getRawValue());

  constructor() {
    this.goalsForm.valueChanges.subscribe(() => {
      this.syncMonthlyGoalConstraints();
    });

    const contributionCtrl = this.goalsForm.get('myGoal.contribution')!;
    contributionCtrl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => {
        const s = v == null ? '' : String(v);
        const cleaned = this.sanitizeContributionString(s);
        if (cleaned !== s) {
          contributionCtrl.setValue(cleaned, { emitEvent: false });
        }
      });

    // Reactive inventory opening from store
    effect(() => {
      const configList = this.store.configurations();
      const openingArr = this.inventoryOpening;
      console.log('GoalsForm: configurations updated', configList);
      if (configList.length > 0 && openingArr.length === 0) {
        console.log('GoalsForm: initializing inventoryOpening array');
        for (const c of configList) {
          openingArr.push(
            this.fb.group({
              configuration_id: [c.configuration_id],
              configuration_name: [c.configuration_name ?? ''],
              units: [null as number | null, this.isFullForm ? [Validators.required] : []],
            })
          );
        }
      }
    });

    const projectCtrl = this.goalsForm.get('participant.project_id')!;
    const goalCtrl = this.goalsForm.get('myGoal.goal')!;
    combineLatest({
      project_id: projectCtrl.valueChanges.pipe(startWith(projectCtrl.value)),
      my_goal: goalCtrl.valueChanges.pipe(startWith(goalCtrl.value)),
    })
      .pipe(
        debounceTime(400),
        map(() => ({
          projectId: this.resolveParticipantProjectId(projectCtrl.value),
          myGoal: this.parseMyGoalNumber(goalCtrl.value),
        })),
        distinctUntilChanged(
          (a, b) => a.projectId === b.projectId && a.myGoal === b.myGoal
        ),
        filter(() => isPlatformBrowser(this.platformId)),
        filter(
          ({ projectId, myGoal }) =>
            projectId != null && myGoal != null && myGoal > 0
        ),
        switchMap(({ projectId, myGoal }) =>
          this.commonService.checkContributionPercentage({
            project_id: projectId!,
            my_goal: myGoal!,
          })
        ),
        takeUntilDestroyed()
      )
      .subscribe((res) => {
        if (res?.status !== true || res.percentage == null) return;
        const display = this.contributionDisplayFromApi(res.percentage);
        if (display != null) {
          this.goalsForm
            .get('myGoal.contribution')
            ?.patchValue(display, { emitEvent: false });
          this.formState.set(this.goalsForm.getRawValue());
        }
      });
  }

  ngOnInit(): void {
    this.patchParticipantFromSession();
    this.syncMonthlyGoalConstraints();
    this.applyRoleBasedConfiguration();
  }

  private applyRoleBasedConfiguration(): void {
    if (this.isFullForm) return;

    const sections = [
      'targets.tatAgreement',
      'targets.tatDisbursement',
      'inventory.needed',
      'team',
    ];

    sections.forEach((path) => {
      const group = this.goalsForm.get(path) as FormGroup;
      if (group) {
        Object.keys(group.controls).forEach((key) => {
          const control = group.get(key);
          control?.clearValidators();
          control?.updateValueAndValidity({ emitEvent: false });
        });
      }
    });
  }

  /** Single project id from autocomplete (scalar or first of array). */
  private resolveParticipantProjectId(raw: unknown): number | null {
    if (raw == null || raw === '') return null;
    const id = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  private parseMyGoalNumber(raw: unknown): number | null {
    const n =
      typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').trim());
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }

  /** API may return `10`, `"10"`, or `"25%"` — normalize to a plain numeric string for the input. */
  private contributionDisplayFromApi(raw: unknown): string | null {
    if (raw == null) return null;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return String(raw);
    }
    const s = String(raw).trim();
    if (!s) return null;
    const n = parseFloat(s.replace(/%/g, '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? String(n) : null;
  }

  /** Keeps only digits and at most one decimal point (for contribution % entry). */
  private sanitizeContributionString(v: string): string {
    let s = v.replace(/[^\d.]/g, '');
    const firstDot = s.indexOf('.');
    if (firstDot === -1) return s;
    return s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }

  onContributionKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const nav = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];
    if (nav.includes(event.key)) return;
    if (/^[0-9]$/.test(event.key)) return;
    if (event.key === '.') {
      const input = event.target as HTMLInputElement;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const withoutSel = input.value.slice(0, start) + input.value.slice(end);
      if (!withoutSel.includes('.')) return;
    }
    event.preventDefault();
  }

  private patchParticipantFromSession(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const name = sessionStorage.getItem('user_full_name')?.trim() ?? '';
    const managerName = sessionStorage.getItem('manager_name')?.trim() ?? '';
    const designation = sessionStorage.getItem('role_name')?.trim() ?? '';

    if (name || managerName || designation) {
      this.goalsForm.patchValue({
        participant: { name, reportsTo: managerName, designation }
      });
      if (name) this.goalsForm.get('participant.name')?.disable({ emitEvent: false });
      if (managerName) this.goalsForm.get('participant.reportsTo')?.disable({ emitEvent: false });
      if (designation) this.goalsForm.get('participant.designation')?.disable({ emitEvent: false });
    }
  }

  // Computed Sums
  private valAsNum(val: any): number {
    return typeof val === 'number' ? val : (parseFloat(val) || 0);
  }

  private parseAnnualGoalCap(): number | null {
    const raw = this.goalsForm.get('myGoal.goal')?.value;
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').trim());
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }

  /** Keep each month within cap in FY order; total never exceeds annual goal. */
  private clampMonthlyTotalsToGoal(): void {
    const cap = this.parseAnnualGoalCap();
    if (cap === null) return;

    const monthsGroup = this.goalsForm.get('targets.months') as FormGroup;
    let running = 0;
    for (const key of this.MONTH_KEYS) {
      const ctl = monthsGroup.get(key as string)!;
      if (ctl.disabled) {
        running += this.valAsNum(ctl.value);
        continue;
      }
      const maxAllowed = Math.max(0, cap - running);
      const v = this.valAsNum(ctl.value);
      if (v > maxAllowed) {
        ctl.setValue(maxAllowed === 0 ? null : maxAllowed, { emitEvent: false });
      }
      running += this.valAsNum(ctl.value);
    }
  }

  /**
   * When sum of other months already meets the annual goal, lock remaining empty months
   * (e.g. goal 20, Apr 10 + May 10 → Jun–Mar disabled).
   */
  private applyMonthLocks(): void {
    const monthsGroup = this.goalsForm.get('targets.months') as FormGroup;
    const cap = this.parseAnnualGoalCap();
    const months = this.goalsForm.getRawValue().targets?.months as Record<string, unknown> | undefined;

    if (cap === null) {
      for (const key of this.MONTH_KEYS) {
        const ctl = monthsGroup.get(key as string)!;
        if (ctl.disabled) ctl.enable({ emitEvent: false });
        ctl.setValidators([Validators.required]);
        ctl.updateValueAndValidity({ emitEvent: false });
      }
      return;
    }

    const sumAll = this.MONTH_KEYS.reduce((s, k) => s + this.valAsNum(months?.[k]), 0);

    for (const key of this.MONTH_KEYS) {
      const ctl = monthsGroup.get(key as string)!;
      const v = this.valAsNum(months?.[key]);
      const sumExcl = sumAll - v;
      const isEmpty = ctl.value === null || ctl.value === '' || ctl.value === undefined;
      const locked = sumExcl >= cap && isEmpty;

      if (locked) {
        if (!ctl.disabled) ctl.disable({ emitEvent: false });
        ctl.clearValidators();
        ctl.updateValueAndValidity({ emitEvent: false });
      } else {
        if (ctl.disabled) ctl.enable({ emitEvent: false });
        ctl.setValidators([Validators.required]);
        ctl.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  private syncMonthlyGoalConstraints(): void {
    this.clampMonthlyTotalsToGoal();
    this.applyMonthLocks();
    this.formState.set(this.goalsForm.getRawValue());
  }

  q1Units = computed(() => {
    const m = this.formState().targets?.months;
    return this.valAsNum(m?.apr) + this.valAsNum(m?.may) + this.valAsNum(m?.jun);
  });

  q2Units = computed(() => {
    const m = this.formState().targets?.months;
    return this.valAsNum(m?.jul) + this.valAsNum(m?.aug) + this.valAsNum(m?.sep);
  });

  q3Units = computed(() => {
    const m = this.formState().targets?.months;
    return this.valAsNum(m?.oct) + this.valAsNum(m?.nov) + this.valAsNum(m?.dec);
  });

  q4Units = computed(() => {
    const m = this.formState().targets?.months;
    return this.valAsNum(m?.jan) + this.valAsNum(m?.feb) + this.valAsNum(m?.mar);
  });

  /** Parsed annual unit goal from “My goal is to” (same cap as monthly clamp). */
  readonly annualUnitsGoalNumber = computed(() => {
    const raw = this.formState().myGoal?.goal;
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').trim());
    return Number.isFinite(n) && n > 0 ? n : null;
  });

  /** Sum of all FY monthly unit fields. */
  readonly totalMonthlyUnitsSum = computed(() => {
    const months = this.formState().targets?.months as Record<string, unknown> | undefined;
    return this.MONTH_KEYS.reduce((s, k) => s + this.valAsNum(months?.[k]), 0);
  });

  /** True when FY month sum equals the annual goal number (full allocation). */
  readonly monthlyUnitsFullyMatchGoal = computed(() => {
    const cap = this.annualUnitsGoalNumber();
    if (cap === null) return false;
    return this.totalMonthlyUnitsSum() === cap;
  });

  /**
   * Per FY month: cumulative units from Apr through that month have reached the annual goal
   * (shows done icon from the first month onward where the running total meets the cap).
   */
  readonly monthCumulativeDoneFlags = computed(() => {
    const cap = this.annualUnitsGoalNumber();
    const months = this.formState().targets?.months as Record<string, unknown> | undefined;
    const flags: Record<string, boolean> = {};
    if (cap === null) {
      for (const k of this.MONTH_KEYS) flags[k] = false;
      return flags;
    }
    let running = 0;
    for (const k of this.MONTH_KEYS) {
      running += this.valAsNum(months?.[k]);
      flags[k] = running >= cap;
    }
    return flags;
  });

  totalInventoryOpening = computed(() => {
    const op = this.formState().inventory?.opening;
    return Array.isArray(op) ? op.reduce((sum: number, row: any) => sum + this.valAsNum(row?.units), 0) : 0;
  });

  totalInventoryNeeded = computed(() => {
    const nd = this.formState().inventory?.needed;
    return this.valAsNum(nd?.q1) + this.valAsNum(nd?.q2) + this.valAsNum(nd?.q3) + this.valAsNum(nd?.q4);
  });

  // Form Array Helpers
  createRoleFormGroup(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required]],
      measure: ['', [Validators.required]],
      target: ['', [Validators.required]],
      actionItems: this.fb.array([this.createEffortControl(), this.createEffortControl(), this.createEffortControl()], [Validators.minLength(3)])
    });
  }

  createOptionalRoleFormGroup(): FormGroup {
    return this.fb.group({
      title: [''],
      measure: [''],
      target: [''],
      actionItems: this.fb.array([this.createOptionalEffortControl(), this.createOptionalEffortControl()])
    });
  }

  createEffortControl(): FormGroup {
    return this.fb.group({ text: ['', [Validators.required]] });
  }

  createOptionalEffortControl(): FormGroup {
    return this.fb.group({ text: [''] });
  }

  private atLeastOneNeedSelected(group: any) {
    const people = group.get('people')?.value || [];
    const strategy = group.get('strategy')?.value || [];
    const resources = group.get('resources')?.value || [];

    const hasValue = (arr: any[]) => arr.some((item: any) => item.text && item.text.trim().length > 0);

    return hasValue(people) || hasValue(strategy) || hasValue(resources) ? null : { noneSelected: true };
  }

  get roles() { return this.goalsForm.get('roles') as FormArray; }

  roleActionItems(i: number) { return this.roles.at(i).get('actionItems') as FormArray; }
  addRoleActionItem(i: number) { this.roleActionItems(i).push(this.createEffortControl()); }
  removeRoleActionItem(i: number, j: number) { this.roleActionItems(i).removeAt(j); }

  get needsPeople() { return this.goalsForm.get('needs.people') as FormArray; }
  get needsStrategy() { return this.goalsForm.get('needs.strategy') as FormArray; }
  get needsResources() { return this.goalsForm.get('needs.resources') as FormArray; }
  get inventoryOpening() { return this.goalsForm.get('inventory.opening') as FormArray; }

  getMonthStrategyControl(monthKey: string): FormControl<number[]> {
    const g = this.goalsForm.get('targets.monthStrategies') as FormGroup;
    return g.get(monthKey) as FormControl<number[]>;
  }

  /** FY order monthly rows for API: `{ month, units, strategy_id }[]` */
  private buildMonthlyPayload(): Array<{ month: string; units: number | null; strategy_id: number[] }> {
    const monthsGroup = this.goalsForm.get('targets.months') as FormGroup;
    const stratGroup = this.goalsForm.get('targets.monthStrategies') as FormGroup;
    return this.MONTH_KEYS.map((month) => {
      const rawUnits = monthsGroup.get(month)?.getRawValue();
      const units =
        rawUnits === null || rawUnits === undefined || rawUnits === ''
          ? null
          : Number(rawUnits);
      const strategyRaw = stratGroup.get(month)?.getRawValue();
      return {
        month,
        units: units !== null && Number.isFinite(units) ? units : null,
        strategy_id: this.normalizeStrategyIds(strategyRaw),
      };
    });
  }

  private normalizeStrategyIds(value: unknown): number[] {
    if (!Array.isArray(value)) return [];
    const ids = value
      .map((id) => Number(id))
      .filter((n): n is number => Number.isFinite(n) && Number.isInteger(n));
    return [...new Set(ids)];
  }

  addNeedItem(type: 'people' | 'strategy' | 'resources') {
    (this.goalsForm.get(`needs.${type}`) as FormArray).push(this.createOptionalEffortControl());
  }

  removeNeedItem(type: 'people' | 'strategy' | 'resources', index: number) {
    (this.goalsForm.get(`needs.${type}`) as FormArray).removeAt(index);
  }

  clearForm() {
    if (!confirm('Clear all fields?')) return;
    this.goalsForm.get('participant.name')?.enable({ emitEvent: false });
    this.goalsForm.get('participant.designation')?.enable({ emitEvent: false });
    this.goalsForm.get('participant.reportsTo')?.enable({ emitEvent: false });
    this.goalsForm.reset();
    this.patchParticipantFromSession();
  }

  downloadExcel() {
    this.store.exportToExcel(this.goalsForm.getRawValue(), {
      q1Units: this.q1Units(),
      q2Units: this.q2Units(),
      q3Units: this.q3Units(),
      q4Units: this.q4Units(),
      totalInventoryOpening: this.totalInventoryOpening(),
      totalInventoryNeeded: this.totalInventoryNeeded(),
    });
  }

  printForm() { window.print(); }

  onSubmit(): void {
    if (this.goalsForm.invalid) {
      alert('Please fill out all required fields.');
      return;
    }

    const raw = this.goalsForm.getRawValue();
    const userId = Number(sessionStorage.getItem('session_id'));
    const roleIds = this.roleIds;
    const payload: any = {
      user_id: userId,
      role_id: roleIds,
      project_id: Array.isArray(raw.participant.project_id) ? raw.participant.project_id[0] : (raw.participant.project_id || null),
      created_by: userId,
      my_goal: raw.myGoal.goal,

      my_contribution: raw.myGoal.contribution,
      roles: raw.roles
        .filter((r: any) => r.title || r.measure || r.target)
        .map((r: any, idx: number) => ({
          role_no: idx + 1,
          title: r.title,
          measure: r.measure,
          target: r.target,
          actions: (r.actionItems || []).map((a: any) => a.text).filter((t: any) => !!t)
        })),
      monthly: this.buildMonthlyPayload(),
      conversion: Object.entries(raw.targets.conversion).map(([quarter, value]) => ({ quarter: quarter.toUpperCase(), value })),
      tat: ['q1', 'q2', 'q3', 'q4'].map(q => ({
        quarter: q.toUpperCase(),
        agreement: (raw.targets.tatAgreement as any)[q],
        disbursement: (raw.targets.tatDisbursement as any)[q]
      })),
      inventory: {},
      team: {
        crm_team: Number(raw.team.crm_team) || 0,
        sale_team: Number(raw.team.sale_team) || 0,
        pre_sale_team: Number(raw.team.pre_sale_team) || 0,
        gre: Number(raw.team.gre) || 0,
        source_team: Number((raw.team as { source_team?: number | null }).source_team) || 0,
      },
      needed: Object.entries(raw.inventory.needed).map(([quarter, needed_units]) => ({ quarter: quarter.toUpperCase(), needed_units })),
      what_i_need: [
        { category: 'People', description: (raw.needs.people || []).map((p: any) => p.text).filter((t: any) => !!t) },
        { category: 'Strategy', description: (raw.needs.strategy || []).map((s: any) => s.text).filter((t: any) => !!t) },
        { category: 'Resources', description: (raw.needs.resources || []).map((r: any) => r.text).filter((t: any) => !!t) },
      ].filter(item => item.description.length > 0)
    };
    (raw.inventory.opening || []).forEach((item: any) => {
      if (item.configuration_name && item.units > 0) {
        payload.inventory[item.configuration_name] = Number(item.units);
      }
    });

    this.store.submitGoal(payload).then(success => {
      if (success) {
        this.resetForm();
      }
    });
  }

  private resetForm() {
    this.goalsForm.get('participant.name')?.enable({ emitEvent: false });
    this.goalsForm.get('participant.designation')?.enable({ emitEvent: false });
    this.goalsForm.get('participant.reportsTo')?.enable({ emitEvent: false });
    this.goalsForm.reset();
    this.patchParticipantFromSession();
    // Clear the opening array to force re-initialization from store if needed
    this.inventoryOpening.clear();
  }


}
