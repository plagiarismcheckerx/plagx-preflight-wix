import { app } from '@wix/custom-extensions';
import preflight from './extensions/dashboard/pages/preflight/preflight.extension.ts';

export default app().use(preflight);
