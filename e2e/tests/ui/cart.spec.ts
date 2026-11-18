import { test, expect } from '@fixtures/ui.fixture';
import products from '@data/products.json';
import { formatPrice } from '@utils/priceUtils';
import { GUEST_STATE } from '@utils/storage';

/*
 * The cart is client-side only (localStorage "luxe-cart"), so these tests never
 * touch the backend. Every test gets a fresh browser context and an empty cart.
 */
const ref = products.reference;

test.describe('Cart drawer (guest)', () => {
  test.use({ storageState: GUEST_STATE });

  test('an empty cart offers "Start Shopping" @smoke', async ({ homePage }) => {
    await homePage.goto();
    await homePage.header.openCart();

    const drawer = homePage.cartDrawer;
    await expect(drawer.heading).toHaveText('Shopping Cart (0)');
    await expect(drawer.emptyMessage).toBeVisible();
    await expect(drawer.startShoppingLink).toHaveAttribute('href', '/shop');
  });

  test.describe('with one item', () => {
    let unitPrice: number;

    test.beforeEach(async ({ productDetailsPage }) => {
      await productDetailsPage.gotoProduct(ref.id);
      unitPrice = await productDetailsPage.getPrice();
      await productDetailsPage.addToCart(ref.sizes[0]);
      await expect(productDetailsPage.cartDrawer.heading).toHaveText('Shopping Cart (1)');
    });

    test('subtotal equals the product price and shows the free-delivery gap', async ({ productDetailsPage }) => {
      const drawer = productDetailsPage.cartDrawer;

      expect(await drawer.getSubtotal()).toBe(unitPrice);
      await expect(drawer.freeDeliveryHint).toContainText(formatPrice(products.delivery.freeOver - unitPrice));
    });

    test('increasing quantity in the drawer updates the subtotal', async ({ productDetailsPage }) => {
      const drawer = productDetailsPage.cartDrawer;

      await drawer.root.getByRole('button', { name: 'Increase quantity' }).click();

      await expect(drawer.heading).toHaveText('Shopping Cart (2)');
      await expect.poll(() => drawer.getSubtotal()).toBe(unitPrice * 2);
    });

    test('removing the item empties the cart', async ({ productDetailsPage }) => {
      const drawer = productDetailsPage.cartDrawer;

      await drawer.removeItem(ref.name);

      await expect(drawer.emptyMessage).toBeVisible();
      await expect(productDetailsPage.header.cartButton).toHaveAccessibleName('Open cart (0 items)');
    });

    test('the cart survives a page reload', async ({ page, productDetailsPage }) => {
      // Reload like a user would: after the "added to cart" confirmation has gone.
      // (An instant reload a few ms after the localStorage write can lose it in Firefox;
      // with a realistic pause the cart persists in every browser.)
      await expect(productDetailsPage.toastWithText(`${ref.name} added to cart`)).toBeHidden({ timeout: 15_000 });
      await page.reload();
      await expect(productDetailsPage.header.cartButton).toHaveAccessibleName('Open cart (1 items)');
    });

    test('"Proceed to Checkout" as a guest asks to log in', async ({ page, productDetailsPage }) => {
      await productDetailsPage.cartDrawer.proceedToCheckout();
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
