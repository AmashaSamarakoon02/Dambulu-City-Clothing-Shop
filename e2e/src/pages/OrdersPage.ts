import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type OrderFilter = 'All' | 'Active' | 'Delivered' | 'Cancelled';

/** /orders: "My Orders" (/my-orders redirects here). Requires login. */
export class OrdersPage extends BasePage {
  protected readonly path = '/orders';

  readonly heading: Locator;
  readonly breadcrumbAccountLink: Locator;
  readonly orderList: Locator;
  /** Each order is a link "Order #36 Placed on … LKR …" -> /orders/:id */
  readonly orderLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = this.main.getByRole('heading', { level: 1, name: 'My Orders' });
    this.breadcrumbAccountLink = this.main.getByRole('navigation').getByRole('link', { name: 'My Account' });
    this.orderList = this.main.getByRole('list').first();
    this.orderLinks = this.orderList.getByRole('link', { name: /^Order #\d+/ });
  }

  override async waitForLoaded(): Promise<void> {
    await this.heading.waitFor({ state: 'visible' });
  }

  filterButton(filter: OrderFilter): Locator {
    return this.main.getByRole('button', { name: filter, exact: true });
  }

  /** link for "Order #<id>" */
  order(orderId: number): Locator {
    return this.orderList.getByRole('link', { name: new RegExp(`^Order #${orderId}\\b`) });
  }

  async filterBy(filter: OrderFilter): Promise<void> {
    await this.filterButton(filter).click();
  }

  async openOrder(orderId: number): Promise<void> {
    await this.order(orderId).click();
  }
}
