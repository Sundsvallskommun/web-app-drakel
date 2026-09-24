import { HttpException } from '@exceptions/HttpException';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementMetadataService from '@services/caremanagement-metadata.service';
import CaremanagementNormberakningService, { NormSection } from '@services/caremanagement-normberakning.service';
import LifecareCalculationEditService, { CalculationChange } from '@services/lifecare-calculation-edit.service';
import { applicationMonthOf } from '@utils/application-month';
import { toDropdownOption } from '@utils/dropdown-option';
import { addExpense, addIncome, changeExpense, changeIncome, removeExpense, removeIncome } from '@utils/lifecare-calculation-rows';

import { TypeOptionGroupEnum } from '@/data-contracts/caremanagement/data-contracts';
import { NormHeaderInputDto, NormRowInputDto } from '@/dtos/normberakning.dto';
import { NormberakningDraft, NormberakningTypes } from '@/responses/normberakning.response';

// caremanagement returns one costTypes list grouped by Mina-sidor section (group = enum code). The
// HOUSING section is Lifecare's boendekostnader (the Utgifter / EXPENSE bucket); the other sections
// (WORK_AND_STUDIES / HEALTH / OTHER) are levnadskostnader i övrigt (the SPECIAL_EXPENSE bucket).
const HOUSING_GROUP = TypeOptionGroupEnum.HOUSING;

/** Where the errand's beräkning is: careM's draft, or — once saved — Lifecare's beräkning with its id. */
interface CalculationSource {
  lifecareCalculationId?: number;
  applicationMonth?: string;
}

const notInLifecare = (what: string): HttpException =>
  new HttpException(422, `${what} går inte att ändra från Drakel när normberäkningen är sparad i Lifecare. Gör det i Lifecare.`);

/**
 * The Normberäkning tab's rows, wherever they are kept. Until the beräkning is first saved in Lifecare they
 * are careM's draft — filled from the ansökan and SSBTEK — and every change goes to careM, with careM's type
 * catalogues. Once saved, Lifecare owns the beräkning: rows are read from it and every change is made there,
 * with Lifecare's own catalogues. careM's draft is then frozen and no longer shown.
 */
class ErrandNormberakningService {
  private errandService = new CaremanagementErrandService();
  private metadataService = new CaremanagementMetadataService();
  private draftService = new CaremanagementNormberakningService();
  private lifecare = new LifecareCalculationEditService();

  async readDraft(errandId: string): Promise<NormberakningDraft> {
    const source = await this.sourceOf(errandId);
    if (source.lifecareCalculationId !== undefined) {
      return this.lifecare.readDraftView(errandId, source.lifecareCalculationId, source.applicationMonth);
    }
    const draft = await this.draftService.readDraft(errandId);
    return { ...draft.data, source: 'CAREM' };
  }

  /** The inkomst- and kostnadstyper a new row can have: Lifecare's once the beräkning is there, careM's before. */
  async types(errandId: string): Promise<NormberakningTypes> {
    const source = await this.sourceOf(errandId);
    if (source.lifecareCalculationId !== undefined) {
      return this.lifecare.readTypes(source.lifecareCalculationId);
    }
    const res = await this.metadataService.readFinancialAssistanceMetadata();
    const costTypes = res.data?.costTypes ?? [];
    // Split the single costTypes list into the two normberäkning buckets via the Mina-sidor group.
    return {
      incomeTypes: (res.data?.incomeTypes ?? []).map(toDropdownOption),
      costTypes: costTypes.filter(type => type.group === HOUSING_GROUP).map(toDropdownOption),
      livingCostTypes: costTypes.filter(type => type.group !== HOUSING_GROUP).map(toDropdownOption),
    };
  }

  async updateHeader(errandId: string, input: NormHeaderInputDto): Promise<void> {
    await this.inCaremanagementOnly(errandId, 'Normen och perioden');
    await this.draftService.updateHeader(errandId, input);
  }

  async addRow(errandId: string, section: NormSection, input: NormRowInputDto): Promise<void> {
    await this.changeRow(errandId, section, {
      caremanagement: () => this.draftService.addRow(errandId, section, input),
      lifecare:
        section === 'incomes'
          ? (calculation, forEdit) => addIncome(calculation, forEdit.incomeTypes, input)
          : (calculation, forEdit) => addExpense(calculation, forEdit, input),
    });
  }

  async updateRow(errandId: string, section: NormSection, rowId: string, input: NormRowInputDto): Promise<void> {
    await this.changeRow(errandId, section, {
      caremanagement: () => this.draftService.updateRow(errandId, section, rowId, input),
      lifecare:
        section === 'incomes' ? calculation => changeIncome(calculation, rowId, input) : calculation => changeExpense(calculation, rowId, input),
    });
  }

  async deleteRow(errandId: string, section: NormSection, rowId: string): Promise<void> {
    await this.changeRow(errandId, section, {
      caremanagement: () => this.draftService.deleteRow(errandId, section, rowId),
      lifecare: section === 'incomes' ? calculation => removeIncome(calculation, rowId) : calculation => removeExpense(calculation, rowId),
    });
  }

  async restoreRow(errandId: string, section: NormSection, rowId: string): Promise<void> {
    await this.inCaremanagementOnly(errandId, 'En borttagen rad');
    await this.draftService.restoreRow(errandId, section, rowId);
  }

  private async changeRow(
    errandId: string,
    section: NormSection,
    change: { caremanagement: () => Promise<unknown>; lifecare: CalculationChange },
  ): Promise<void> {
    const source = await this.sourceOf(errandId);
    if (source.lifecareCalculationId === undefined) {
      await change.caremanagement();
      return;
    }
    if (section === 'persons') {
      throw notInLifecare('Hushållet');
    }
    await this.lifecare.change(errandId, source.lifecareCalculationId, change.lifecare);
  }

  private async inCaremanagementOnly(errandId: string, what: string): Promise<void> {
    const source = await this.sourceOf(errandId);
    if (source.lifecareCalculationId !== undefined) {
      throw notInLifecare(what);
    }
  }

  private async sourceOf(errandId: string): Promise<CalculationSource> {
    const view = await this.errandService.getFinancialAssistanceView(errandId);
    return {
      lifecareCalculationId: view.data?.data?.lifecareCalculationId ?? undefined,
      applicationMonth: applicationMonthOf(view.data?.data),
    };
  }
}

export default ErrandNormberakningService;
