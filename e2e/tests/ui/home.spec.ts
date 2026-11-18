import { test, expect } from '@fixtures/ui.fixture';
import type { Category } from '@data/types';
import { GUEST_STATE } from '@utils/storage';

test.describe('Home page (guest)', () => {
  test.use({ storageState: GUEST_STATE });

  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('desktop header shows search, account and category navigation @desktop', async ({ homePage }) => {
    await expect(homePage.header.searchInput).toBeVisible();
    await expect(homePage.header.accountLink).toBeVisible();
    await expect(homePage.header.wishlistLink).toBeVisible();
    await expect(homePage.header.categoryNav).toBeVisible();
  });

  test('shows header, hero carousel and store sections @smoke', async ({ homePage }) => {
    await expect(homePage.header.logo).toBeVisible();
    await expect(homePage.header.cartButton).toBeVisible();
    await expect(homePage.heroCarousel).toBeVisible();
    await expect(homePage.styleFinder).toBeVisible();
    await expect(homePage.benefits).toBeVisible();
    await expect(homePage.categoriesSection).toBeVisible();
  });

  test('category tiles show the same product counts as the API', async ({ homePage, catalogApi }) => {
    const categories = (await (await catalogApi.categories()).json()) as Category[];

    for (const category of categories.filter((c) => c.productCount > 0)) {
      await expect(homePage.categoryTile(category.name)).toContainText(`${category.productCount} items`);
    }
  });

  test('a category tile opens that category', async ({ page, homePage }) => {
    await homePage.categoryTile("Men's Wear").click();
    await expect(page).toHaveURL(/\/category\/mens-wear$/);
  });

  test('top navigation "Men" opens the men\'s category @desktop', async ({ page, homePage }) => {
    await homePage.header.openCategory('Men');
    await expect(page).toHaveURL(/\/category\/mens-wear$/);
  });

  test('"Find your style" searches the shop with the chosen filters', async ({ page, homePage }) => {
    await homePage.findStyles({ keyword: 'shirt' });
    await expect(page).toHaveURL(/\/shop\?.*search=shirt/);
  });

  test('carousel slide dots are present for every slide', async ({ homePage }) => {
    await expect(homePage.slideDot(1)).toBeVisible();
    await expect(homePage.slideDot(2)).toBeVisible();
    await expect(homePage.slideDot(3)).toBeVisible();
  });
});
