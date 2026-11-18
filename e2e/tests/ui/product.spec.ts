import { test, expect } from '@fixtures/ui.fixture';
import products from '@data/products.json';
import type { Product } from '@data/types';
import { formatPrice } from '@utils/priceUtils';
import { env } from '@utils/env';
import { GUEST_STATE } from '@utils/storage';

const ref = products.reference;

test.describe('Product details (guest)', () => {
  test.use({ storageState: GUEST_STATE });

  test.beforeEach(async ({ productDetailsPage }) => {
    await productDetailsPage.gotoProduct(ref.id);
  });

  test('shows the same name, price and sizes as the API @smoke', async ({ productDetailsPage, productsApi }) => {
    const product = (await (await productsApi.getById(ref.id)).json()) as Product;

    await expect(productDetailsPage.title).toHaveText(product.name);
    await expect(productDetailsPage.price).toHaveText(formatPrice(product.price));
    await expect(productDetailsPage.productCode).toHaveText(`Product code: DC-${String(product.id).padStart(5, '0')}`);
    if (product.originalPrice === null) await expect(productDetailsPage.savingsText).toBeHidden();
    for (const size of product.sizes) {
      await expect(productDetailsPage.sizeOption(size)).toBeVisible();
    }
    await expect(productDetailsPage.colourOption(ref.color)).toHaveAttribute('aria-pressed', 'true');
  });

  test('breadcrumb links back to the category', async ({ page, productDetailsPage }) => {
    await productDetailsPage.breadcrumb.getByRole('link', { name: ref.categoryName }).click();
    await expect(page).toHaveURL(new RegExp(`/category/${ref.category}$`));
  });

  test('adding to cart without a size shows an alert', async ({ productDetailsPage }) => {
    await productDetailsPage.addToCart();

    await expect(productDetailsPage.sizeError).toHaveText('Please select a size');
    expect(await productDetailsPage.header.getCartCount()).toBe(0);
  });

  test('quantity stepper increases and decreases', async ({ productDetailsPage }) => {
    await expect(productDetailsPage.quantityValue).toHaveText('1');
    await productDetailsPage.increaseQuantityButton.click();
    await productDetailsPage.increaseQuantityButton.click();
    await expect(productDetailsPage.quantityValue).toHaveText('3');
    await productDetailsPage.decreaseQuantityButton.click();
    await expect(productDetailsPage.quantityValue).toHaveText('2');
  });

  test('add to cart updates the header count and the cart drawer @smoke', async ({ productDetailsPage }) => {
    await test.step(`Add 2 x size ${ref.sizes[0]} to the cart`, async () => {
      await productDetailsPage.addToCart(ref.sizes[0], 2);
    });

    await test.step('Verify the toast and header cart count', async () => {
      await expect(productDetailsPage.toastWithText(`${ref.name} added to cart`)).toBeVisible();
      await expect(productDetailsPage.header.cartButton).toHaveAccessibleName('Open cart (2 items)');
    });

    await test.step('Verify the cart drawer contains exactly that product', async () => {
      const drawer = productDetailsPage.cartDrawer;
      await expect(drawer.heading).toHaveText('Shopping Cart (2)');
      await expect(drawer.itemLink(ref.name)).toBeVisible();
      await expect(drawer.itemVariant(ref.sizes[0], ref.color)).toBeVisible();
    });
  });

  test('"Customers Also Viewed" shows related products', async ({ productDetailsPage }) => {
    await expect(productDetailsPage.alsoViewedHeading).toBeVisible();
  });

  test('stock status matches the API stock level', async ({ productDetailsPage, productsApi }) => {
    const { stock } = (await (await productsApi.getById(ref.id)).json()) as Product;
    // ProductDetails.jsx: 0 -> "Out of stock", <= LOW_STOCK_THRESHOLD -> "Hurry! Only N left", else "In stock".
    const expected = stock <= 0 ? 'Out of stock' : new RegExp(`^(In stock|Hurry! Only ${stock} left in stock)$`);

    await expect(productDetailsPage.stockStatus).toHaveText(expected);
    await expect(productDetailsPage.addToCartButton).toHaveText(stock > 0 ? 'Add to Cart' : 'Out of Stock');
  });

  test('selecting a size marks it pressed', async ({ productDetailsPage }) => {
    const size = ref.sizes[1];
    await productDetailsPage.selectSize(size);

    await expect(productDetailsPage.sizeOption(size)).toHaveAttribute('aria-pressed', 'true');
    await expect(productDetailsPage.sizeOption(ref.sizes[0])).toHaveAttribute('aria-pressed', 'false');
  });

  test('the reviews tab asks guests to log in', async ({ productDetailsPage }) => {
    await productDetailsPage.openReviewsTab();

    await expect(productDetailsPage.reviewLoginPrompt).toBeVisible();
    await expect(productDetailsPage.reviewLoginLink).toHaveAttribute('href', '/login');
    await expect(productDetailsPage.writeReviewHeading).toBeHidden();
  });
});

test.describe('Product details (logged in)', () => {
  test('the reviews tab shows the review form (not submitted)', async ({ productDetailsPage }) => {
    test.skip(!env.hasTestUser, 'TEST_USER_EMAIL / TEST_USER_PASSWORD not set');

    await productDetailsPage.gotoProduct(ref.id);
    await productDetailsPage.openReviewsTab();

    await expect(productDetailsPage.writeReviewHeading).toBeVisible();
    await expect(productDetailsPage.reviewCommentInput).toHaveAttribute('maxlength', '1000');
    await expect(productDetailsPage.ratingButton(5)).toBeVisible();
    await expect(productDetailsPage.submitReviewButton).toBeEnabled();
  });
});

test.describe('Product not found (guest)', () => {
  test.use({ storageState: GUEST_STATE });

  test('an unknown product id shows "Product not found"', async ({ productDetailsPage }) => {
    await productDetailsPage.gotoProduct(products.unknownId);

    await expect(productDetailsPage.notFoundHeading).toBeVisible();
    await expect(productDetailsPage.continueShoppingLink).toHaveAttribute('href', '/shop');
  });
});
