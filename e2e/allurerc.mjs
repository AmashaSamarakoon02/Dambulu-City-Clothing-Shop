import { defineConfig } from 'allure';

/**
 * Allure 3 report configuration.
 *   npm run test:allure      -> run all tests and build the report
 *   npm run allure:generate  -> build the report from existing allure-results/
 *   npm run allure:open      -> open the report in the browser
 */
export default defineConfig({
  name: 'Dambulla City Clothing Shop – E2E Test Report',
  output: './allure-report',
  plugins: {
    awesome: {
      options: {
        reportName: 'Dambulla City Clothing Shop – E2E Test Report',
        reportLanguage: 'en',
        singleFile: false,
      },
    },
  },
});
