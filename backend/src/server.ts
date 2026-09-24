import { IndexController } from '@controllers/index.controller';
import { warmUpLifecareSession } from '@services/lifecare-api.service';
import validateEnv from '@utils/validateEnv';

import App from '@/app';

import { ActualisationController } from './controllers/actualisation.controller';
import { AdminTemplateController } from './controllers/admin-template.controller';
import { AdministratorController } from './controllers/administrator.controller';
import { CountsController } from './controllers/counts.controller';
import { DecisionController } from './controllers/decision.controller';
import { DecisionNotificationController } from './controllers/decision-notification.controller';
import { DocumentController } from './controllers/document.controller';
import { DocumentTemplateController } from './controllers/document-template.controller';
import { ErrandController } from './controllers/errand.controller';
import { EventController } from './controllers/event.controller';
import { FinalizeController } from './controllers/finalize.controller';
import { FormSnapshotController } from './controllers/form-snapshot.controller';
import { HealthController } from './controllers/health.controller';
import { JobStimulusController } from './controllers/job-stimulus.controller';
import { JournalController } from './controllers/journal.controller';
import { LifecareCalculationController } from './controllers/lifecare-calculation.controller';
import { LifecareDecisionController } from './controllers/lifecare-decision.controller';
import { LifecareDocumentsController } from './controllers/lifecare-documents.controller';
import { LifecarePaymentsController } from './controllers/lifecare-payments.controller';
import { LifecareRemindersController } from './controllers/lifecare-reminders.controller';
import { MessageController } from './controllers/message.controller';
import { MetadataController } from './controllers/metadata.controller';
import { NormberakningController } from './controllers/normberakning.controller';
import { NoteController } from './controllers/note.controller';
import { NotificationController } from './controllers/notification.controller';
import { PaymentController } from './controllers/payment.controller';
import { PdfController } from './controllers/pdf.controller';
import { SectionApprovalController } from './controllers/section-approval.controller';
import { UserController } from './controllers/user.controller';
import { WarningController } from './controllers/warning.controller';

validateEnv();

const app = new App([
  IndexController,
  UserController,
  HealthController,
  ErrandController,
  DecisionController,
  MessageController,
  MetadataController,
  NoteController,
  NormberakningController,
  WarningController,
  PaymentController,
  SectionApprovalController,
  JournalController,
  JobStimulusController,
  DocumentController,
  DocumentTemplateController,
  EventController,
  CountsController,
  NotificationController,
  FormSnapshotController,
  ActualisationController,
  DecisionNotificationController,
  FinalizeController,
  AdministratorController,
  AdminTemplateController,
  PdfController,
  LifecareDocumentsController,
  LifecarePaymentsController,
  LifecareDecisionController,
  LifecareCalculationController,
  LifecareRemindersController,
]);

app.listen();

// Sign in to Lifecare now rather than on the first request. Fire-and-forget: a Lifecare outage at
// boot must not stop the BFF starting, and a good persisted session makes this a no-op.
warmUpLifecareSession();
