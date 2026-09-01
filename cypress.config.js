import { defineConfig } from 'cypress';
import createBundler from '@bahmutov/cypress-esbuild-preprocessor';
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
import esbuildFeaturePluginModule from '@badeball/cypress-cucumber-preprocessor/esbuild';

const createEsbuildPlugin = esbuildFeaturePluginModule.default || esbuildFeaturePluginModule;

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:4173',
    viewportWidth: 1440,
    viewportHeight: 1200,
    specPattern: ['cypress/e2e/**/*.feature'],
    supportFile: 'cypress/support/e2e.js',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on(
        'file:preprocessor',
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        })
      );
      return config;
    },
  },
});
