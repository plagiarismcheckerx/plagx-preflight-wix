// @ts-check
import { defineWixConfig } from '@wix/cli/config';
import customExtensions from '@wix/custom-extensions/flow';
import zeroConfig from '@wix/cli-zero-config-flow';

const appId = 'bea20e18-4904-494c-8a47-3534bf265431';

export default defineWixConfig({
  flows: [
    customExtensions({
      appId,
      projectId: 'plagx-draft-preflight',
    }),
    zeroConfig({ appId }),
  ],
});
