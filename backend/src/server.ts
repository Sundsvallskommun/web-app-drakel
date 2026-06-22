import { IndexController } from '@controllers/index.controller';
import validateEnv from '@utils/validateEnv';

import App from '@/app';

import { DecisionController } from './controllers/decision.controller';
import { ErrandController } from './controllers/errand.controller';
import { HealthController } from './controllers/health.controller';
import { MessageController } from './controllers/message.controller';
import { MetadataController } from './controllers/metadata.controller';
import { NormberakningController } from './controllers/normberakning.controller';
import { NoteController } from './controllers/note.controller';
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
]);

app.listen();
