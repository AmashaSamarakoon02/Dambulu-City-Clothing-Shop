const prisma = require('../prismaClient');
const { LOW_STOCK_THRESHOLD } = require('../utils/shopDefaults');

const DAYS = 30;

// YYYY-MM-DD in the server's local time zone.
const localDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getSalesReport = async (req, res) => {
  try {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (DAYS - 1));

    const [statusCounts, revenue, recentOrders, topItems, lowStock, customerCount, productCount] = await Promise.all([
      prisma.order.groupBy({ by: ['status'], _count: true }),
      // Revenue = every non-cancelled order (COD is counted when placed).
      prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { totalAmount: true }, _count: true }),
      prisma.order.findMany({
        where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
        select: { createdAt: true, totalAmount: true }
      }),
      prisma.orderItem.groupBy({
        by: ['productName'],
        where: { order: { status: { not: 'CANCELLED' } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      prisma.product.findMany({
        where: { stock: { lte: LOW_STOCK_THRESHOLD } },
        select: { id: true, name: true, image: true, stock: true, category: true },
        orderBy: { stock: 'asc' }
      }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.product.count()
    ]);

    // Revenue per item is needed for the top products, so sum it separately.
    const topProducts = await Promise.all(topItems.map(async (item) => {
      const lines = await prisma.orderItem.findMany({
        where: { productName: item.productName, order: { status: { not: 'CANCELLED' } } },
        select: { price: true, quantity: true }
      });
      return {
        name: item.productName,
        unitsSold: item._sum.quantity,
        revenue: lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
      };
    }));

    const dailySales = [];
    for (let i = 0; i < DAYS; i++) {
      const day = new Date(since);
      day.setDate(since.getDate() + i);
      dailySales.push({ date: localDateKey(day), revenue: 0, orders: 0 });
    }
    const byDate = Object.fromEntries(dailySales.map((d) => [d.date, d]));
    for (const order of recentOrders) {
      const bucket = byDate[localDateKey(order.createdAt)];
      if (bucket) {
        bucket.revenue += order.totalAmount;
        bucket.orders += 1;
      }
    }

    const ordersByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));
    const totalOrders = statusCounts.reduce((sum, s) => sum + s._count, 0);

    res.json({
      totalOrders,
      totalRevenue: revenue._sum.totalAmount || 0,
      averageOrderValue: revenue._count ? (revenue._sum.totalAmount || 0) / revenue._count : 0,
      pendingOrders: (ordersByStatus.PENDING || 0) + (ordersByStatus.CONFIRMED || 0) + (ordersByStatus.PROCESSING || 0),
      customerCount,
      productCount,
      ordersByStatus,
      dailySales,
      topProducts,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      lowStockProducts: lowStock
    });
  } catch (error) {
    console.error('Error building sales report:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getSalesReport };
