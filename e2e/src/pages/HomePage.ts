import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** /home */
export class HomePage extends BasePage {
  protected readonly path = '/home';

  /** region "Featured collections" (hero carousel) */
  readonly heroCarousel: Locator;
  readonly previousSlideButton: Locator;
  readonly nextSlideButton: Locator;

  /** search "Find your style" (category / keyword / budget finder) */
  readonly styleFinder: Locator;
  readonly finderCategorySelect: Locator;
  readonly finderKeywordInput: Locator;
  readonly finderBudgetSelect: Locator;
  readonly findStylesButton: Locator;

  /** region "Why shop with us" */
  readonly benefits: Locator;
  /** region "Something for Everyone" (category tiles) */
  readonly categoriesSection: Locator;

  constructor(page: Page) {
    super(page);
    this.heroCarousel = this.main.getByRole('region', { name: 'Featured collections' });
    this.previousSlideButton = this.heroCarousel.getByRole('button', { name: 'Previous slide' });
    this.nextSlideButton = this.heroCarousel.getByRole('button', { name: 'Next slide' });

    this.styleFinder = this.main.getByRole('search', { name: 'Find your style' });
    this.finderCategorySelect = this.styleFinder.getByRole('combobox', { name: 'Category' });
    this.finderKeywordInput = this.styleFinder.getByRole('searchbox', { name: 'What are you looking for?' });
    this.finderBudgetSelect = this.styleFinder.getByRole('combobox', { name: 'Budget' });
    this.findStylesButton = this.styleFinder.getByRole('button', { name: 'Find Styles' });

    this.benefits = this.main.getByRole('region', { name: 'Why shop with us' });
    this.categoriesSection = this.main.getByRole('region', { name: 'Something for Everyone' });
  }

  override async waitForLoaded(): Promise<void> {
    await this.heroCarousel.waitFor({ state: 'visible' });
  }

  /** button "Show slide N: <title>" */
  slideDot(index: number): Locator {
    return this.heroCarousel.getByRole('button', { name: new RegExp(`^Show slide ${index}:`) });
  }

  /** Category tile, e.g. heading "Men's Wear" inside its link. */
  categoryTile(categoryName: string): Locator {
    return this.categoriesSection.getByRole('link').filter({
      has: this.page.getByRole('heading', { level: 3, name: categoryName, exact: true }),
    });
  }

  /** Budget shortcut links: "Under LKR 3,000.00" etc. */
  budgetLink(amountLabel: string): Locator {
    return this.categoriesSection.getByRole('link', { name: `Under LKR ${amountLabel}`, exact: true });
  }

  async findStyles(options: { category?: string; keyword?: string; budget?: string }): Promise<void> {
    if (options.category) await this.finderCategorySelect.selectOption({ label: options.category });
    if (options.keyword) await this.finderKeywordInput.fill(options.keyword);
    if (options.budget) await this.finderBudgetSelect.selectOption({ label: options.budget });
    await this.findStylesButton.click();
  }
}
