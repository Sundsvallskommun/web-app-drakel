import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';

import App from '@/app';

import { BevakningController } from './controllers/bevakning.controller';
import { CountsController } from './controllers/counts.controller';
import { DecisionController } from './controllers/decision.controller';
import { DocumentController } from './controllers/document.controller';
import { ErrandController } from './controllers/errand.controller';
import { EventController } from './controllers/event.controller';
import { FormSnapshotController } from './controllers/form-snapshot.controller';
import { HealthController } from './controllers/health.controller';
import { JournalController } from './controllers/journal.controller';
import { MessageController } from './controllers/message.controller';
import { MetadataController } from './controllers/metadata.controller';
import { NormberakningController } from './controllers/normberakning.controller';
import { NoteController } from './controllers/note.controller';
import { NotificationController } from './controllers/notification.controller';
import { PaymentController } from './controllers/payment.controller';
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
  BevakningController,
  JournalController,
  DocumentController,
  EventController,
  CountsController,
  NotificationController,
  FormSnapshotController,
]);

app.listen();
