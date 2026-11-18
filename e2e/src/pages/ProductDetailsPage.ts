import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ProductCardComponent } from '@components/ProductCardComponent';
import { parsePrice } from '@utils/priceUtils';

/**
 * /product/:id (source: src/pages/ProductDetails.jsx)
 *
 * States: loading spinner -> product, or h1 "Product not found".
 * Size/colour are preselected only when there is a single choice; otherwise
 * "Add to Cart" shows <p role="alert">Please select a colour|size</p>.
 */
export class ProductDetailsPage extends BasePage {
  protected path = '/product';

  /* Not-found state */
  readonly notFoundHeading: Locator;
  readonly continueShoppingLink: Locator;

  /* Info column */
  readonly breadcrumb: Locator;
  readonly title: Locator;
  /** <span class="text-2xl font-semibold">{formatPrice(price)}</span> (first LKR amount in main) */
  readonly price: Locator;
  /** Strike-through original price, only when discounted */
  readonly originalPrice: Locator;
  /** "You save LKR x (n%)" */
  readonly savingsText: Locator;
  /** "Product code: DC-00029" */
  readonly productCode: Locator;
  /** "No reviews yet", or a button "<stars> 4.5 (2 reviews)" */
  readonly noReviewsText: Locator;
  readonly sizeChartButton: Locator;
  /** "In stock" | "Hurry! Only N left in stock" | "Out of stock" */
  readonly stockStatus: Locator;
  /** <p role="alert">: "Please select a size" / "Please select a colour" */
  readonly optionError: Locator;
  readonly sizeError: Locator;
  readonly colourError: Locator;

  /* Actions */
  readonly decreaseQuantityButton: Locator;
  readonly increaseQuantityButton: Locator;
  /** <span aria-live="polite">{quantity}</span> */
  readonly quantityValue: Locator;
  /** "Add to Cart" | "Out of Stock" | "All Stock in Cart" */
  readonly addToCartButton: Locator;
  /** aria-label "Add to wishlist" / "Remove from wishlist" */
  readonly wishlistButton: Locator;

  /* Tabs: Description / Reviews (n) */
  readonly descriptionTab: Locator;
  readonly reviewsTab: Locator;
  readonly reviewLoginPrompt: Locator;
  readonly reviewLoginLink: Locator;
  readonly writeReviewHeading: Locator;
  readonly reviewCommentInput: Locator; // #review-comment, label "Comment"
  readonly submitReviewButton: Locator;

  readonly alsoViewedHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.notFoundHeading = page.getByRole('heading', { level: 1, name: 'Product not found' });
    this.continueShoppingLink = page.getByRole('link', { name: 'Continue Shopping' });

    this.breadcrumb = this.main.getByRole('navigation').first();
    this.title = this.main.getByRole('heading', { level: 1 });
    this.price = this.main.getByText(/^LKR [\d,]+\.\d{2}$/).first();
    this.originalPrice = this.main.locator('span.line-through').first();
    this.savingsText = this.main.getByText(/^You save LKR/);
    this.productCode = this.main.getByText(/^Product code: DC-\d{5}$/);
    this.noReviewsText = this.main.getByText('No reviews yet', { exact: true });
    this.sizeChartButton = this.main.getByRole('button', { name: 'View size chart' });
    this.stockStatus = this.main.getByText(/^(In stock|Out of stock|Hurry! Only \d+ left in stock)$/);
    this.optionError = this.main.getByRole('alert').filter({ hasText: /^Please select a (size|colour)$/ });
    this.sizeError = this.main.getByRole('alert').filter({ hasText: 'Please select a size' });
    this.colourError = this.main.getByRole('alert').filter({ hasText: 'Please select a colour' });

    this.decreaseQuantityButton = this.main.getByRole('button', { name: 'Decrease quantity' });
    this.increaseQuantityButton = this.main.getByRole('button', { name: 'Increase quantity' });
    this.quantityValue = this.main.locator('span[aria-live="polite"]').first();
    this.addToCartButton = this.main.getByRole('button', { name: /^(Add to Cart|Out of Stock|All Stock in Cart)$/ });
    this.wishlistButton = this.main.getByRole('button', { name: /^(Add to|Remove from) wishlist$/ });

    this.descriptionTab = this.main.getByRole('button', { name: 'Description', exact: true });
    this.reviewsTab = this.main.getByRole('button', { name: /^Reviews \(\d+\)$/ });
    this.reviewLoginPrompt = this.main.getByText('Please log in to write a review.', { exact: true });
    this.reviewLoginLink = this.main.getByRole('link', { name: 'Login', exact: true });
    this.writeReviewHeading = this.main.getByRole('heading', { level: 4, name: 'Write a Review' });
    this.reviewCommentInput = this.main.getByRole('textbox', { name: 'Comment' });
    this.submitReviewButton = this.main.getByRole('button', { name: /^Submit(ting)? Review/ });

    this.alsoViewedHeading = this.main.getByRole('heading', { level: 2, name: 'Customers Also Viewed' });
  }

  async gotoProduct(productId: number | string): Promise<void> {
    this.path = `/product/${productId}`;
    await this.goto();
  }

  /** Waits past the spinner for the product title or the not-found heading. */
  override async waitForLoaded(): Promise<void> {
    await this.title.or(this.notFoundHeading).first().waitFor({ state: 'visible' });
  }

  /** Size option button (aria-pressed when selected). */
  sizeOption(size: string): Locator {
    return this.main.getByRole('button', { name: size, exact: true });
  }

  /** Colour swatch: aria-label "Colour <name>" (aria-pressed when selected). */
  colourOption(colour: string): Locator {
    return this.main.getByRole('button', { name: `Colour ${colour}`, exact: true });
  }

  /** Gallery thumbnail: aria-label "Show image N" (only when there are 2+ images). */
  imageThumbnail(index: number): Locator {
    return this.main.getByRole('button', { name: `Show image ${index}`, exact: true });
  }

  /** Review rating button: aria-label "1 star" / "N stars". */
  ratingButton(stars: number): Locator {
    return this.main.getByRole('button', { name: `${stars} star${stars > 1 ? 's' : ''}`, exact: true });
  }

  relatedProduct(productName: string): ProductCardComponent {
    return new ProductCardComponent(this.main, productName);
  }

  async selectSize(size: string): Promise<void> {
    await this.sizeOption(size).click();
  }

  async selectColour(colour: string): Promise<void> {
    await this.colourOption(colour).click();
  }

  async setQuantity(quantity: number): Promise<void> {
    let current = await this.getQuantity();
    while (current < quantity) {
      await this.increaseQuantityButton.click();
      current++;
    }
    while (current > quantity) {
      await this.decreaseQuantityButton.click();
      current--;
    }
  }

  /** Select size/colour (optional), set quantity, click "Add to Cart". */
  async addToCart(size?: string, quantity = 1, colour?: string): Promise<void> {
    if (colour) await this.selectColour(colour);
    if (size) await this.selectSize(size);
    if (quantity !== 1) await this.setQuantity(quantity);
    await this.addToCartButton.click();
  }

  async openReviewsTab(): Promise<void> {
    await this.reviewsTab.click();
  }

  async getPrice(): Promise<number> {
    return parsePrice(await this.price.innerText());
  }

  async getQuantity(): Promise<number> {
    return Number((await this.quantityValue.innerText()).trim());
  }
}
