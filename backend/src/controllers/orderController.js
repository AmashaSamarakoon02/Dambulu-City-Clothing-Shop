const prisma = require('../prismaClient');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../utils/mailer');
const {
  ORDER_STATUS_TRANSITIONS,
  CUSTOMER_CANCELLABLE,
  FREE_DELIVERY_THRESHOLD,
  DELIVERY_FEE
} = require('../utils/shopDefaults');

const ORDER_INCLUDE = { items: { orderBy: { id: 'asc' } } };

// Thrown inside the order transaction to abort with a customer-facing message.
class OrderError extends Error {}

const parseAddress = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    // Legacy orders stored { title, text, instructions }.
    return parsed.line1 !== undefined ? parsed : { line1: parsed.text || '', city: '', postalCode: '', instructions: parsed.instructions || '' };
  } catch {
    return { line1: raw, city: '', postalCode: '', instructions: '' };
  }
};

const formatOrder = (order) => order && { ...order, deliveryAddress: parseAddress(order.deliveryAddress) };

const sendEmailSafely = (promise) => promise.catch((err) => console.error('Order email failed:', err.message));

const restockItems = (tx, items) => Promise.all(
  items.filter((item) => item.productId).map((item) => tx.product.updateMany({
    where: { id: item.productId },
    data: { stock: { increment: item.quantity } }
  }))
);

const createOrder = async (req, res) => {
  try {
    const { items, customerName, phone, email, address, paymentMethod, saveAddress } = req.body;

    // Merge duplicate lines (same product/size/colour) before checking stock.
    const lines = new Map();
    for (const item of items) {
      const key = `${item.productId}|${item.size || ''}|${item.color || ''}`;
      const existing = lines.get(key);
      lines.set(key, { ...item, quantity: (existing?.quantity || 0) + item.quantity });
    }

    const order = await prisma.$transaction(async (tx) => {
      const productIds = [...new Set([...lines.values()].map((l) => l.productId))];
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productById = new Map(products.map((p) => [p.id, p]));

      const orderItems = [];
      for (const line of lines.values()) {
        const product = productById.get(line.productId);
        if (!product) throw new OrderError('One of the items in your cart is no longer available. Please remove it and try again.');
        if (product.sizes.length && !product.sizes.includes(line.size)) {
          throw new OrderError(`Please choose a valid size for "${product.name}".`);
        }
        if (product.colors.length && !product.colors.includes(line.color)) {
          throw new OrderError(`Please choose a valid colour for "${product.name}".`);
        }

        // Atomic decrement: only succeeds if enough stock is left.
        const { count } = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } }
        });
        if (count === 0) {
          const current = await tx.product.findUnique({ where: { id: product.id }, select: { stock: true } });
          throw new OrderError(current.stock > 0
            ? `Only ${current.stock} left of "${product.name}". Please reduce the quantity.`
            : `"${product.name}" is out of stock.`);
        }

        orderItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          quantity: line.quantity,
          price: product.price, // always use the server price
          size: line.size || null,
          color: line.color || null
        });
      }

      const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

      return tx.order.create({
        data: {
          userId: req.user.userId,
          customerName,
          phone,
          email,
          subtotal,
          deliveryFee,
          totalAmount: subtotal + deliveryFee,
          deliveryAddress: JSON.stringify({
            line1: address.line1,
            city: address.city,
            postalCode: address.postalCode || '',
            instructions: address.instructions || ''
          }),
          paymentMethod,
          // Card orders wait for the payment step; COD / bank transfer are confirmed straight away.
          status: paymentMethod === 'CARD' ? 'PENDING' : 'CONFIRMED',
          items: { create: orderItems }
        },
        include: ORDER_INCLUDE
      });
    });

    if (saveAddress) {
      const fullAddress = [address.line1, address.city, address.postalCode].filter(Boolean).join(', ');
      await prisma.user.update({ where: { id: req.user.userId }, data: { address: fullAddress, phone } });
    }

    if (paymentMethod !== 'CARD') sendEmailSafely(sendOrderConfirmationEmail(order));

    res.status(201).json(formatOrder(order));
  } catch (error) {
    if (error instanceof OrderError) return res.status(400).json({ error: error.message });
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mock payment gateway callback: marks a card order as paid.
const payOrder = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user.userId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.paymentMethod !== 'CARD') return res.status(400).json({ error: 'This order is not a card payment' });
    if (order.paymentStatus === 'PAID') return res.status(400).json({ error: 'This order has already been paid' });
    if (order.status === 'CANCELLED') return res.status(400).json({ error: 'This order was cancelled' });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'PAID', status: order.status === 'PENDING' ? 'CONFIRMED' : order.status },
      include: ORDER_INCLUDE
    });
    sendEmailSafely(sendOrderConfirmationEmail(updated));
    res.json(formatOrder(updated));
  } catch (error) {
    console.error('Error paying order:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders.map(formatOrder));
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: ORDER_INCLUDE
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(formatOrder(order));
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const cancelOrderAndRestock = (order) => prisma.$transaction(async (tx) => {
  // Conditional update guards against two cancellations racing each other.
  const { count } = await tx.order.updateMany({
    where: { id: order.id, status: { not: 'CANCELLED' } },
    data: {
      status: 'CANCELLED',
      paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : 'FAILED'
    }
  });
  if (count) await restockItems(tx, order.items);
  return tx.order.findUnique({ where: { id: order.id }, include: ORDER_INCLUDE });
});

const cancelMyOrder = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: ORDER_INCLUDE
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
      return res.status(400).json({ error: 'This order can no longer be cancelled because it is already being prepared or shipped.' });
    }

    const updated = await cancelOrderAndRestock(order);
    sendEmailSafely(sendOrderStatusEmail(updated));
    res.json(formatOrder(updated));
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: all orders with optional status filter and search.
const getAllOrders = async (req, res) => {
  try {
    const { status = '', search = '', page = 1, limit = 20 } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const where = {};
    if (status) where.status = status;
    if (search.trim()) {
      const term = search.trim().replace(/^#/, '');
      where.OR = [
        { customerName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
        { user: { name: { contains: term, mode: 'insensitive' } } }
      ];
      if (/^\d+$/.test(term)) where.OR.push({ id: parseInt(term, 10) });
    }

    const [orders, total, statusCounts] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { ...ORDER_INCLUDE, user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({ by: ['status'], _count: true })
    ]);

    res.json({
      data: orders.map(formatOrder),
      meta: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) },
      statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count]))
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { ...ORDER_INCLUDE, user: { select: { id: true, name: true, email: true, phone: true } } }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(formatOrder(order));
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getDeliveryOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] } },
      include: {
        ...ORDER_INCLUDE,
        user: { select: { name: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders.map(formatOrder));
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: ORDER_INCLUDE });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status === status) return res.json(formatOrder(order));
    if (!ORDER_STATUS_TRANSITIONS[order.status]?.includes(status)) {
      return res.status(400).json({ error: `An order that is ${order.status.toLowerCase()} cannot be changed to ${status.toLowerCase()}.` });
    }
    if (req.user.role === 'DELIVERY' && status === 'CANCELLED') {
      return res.status(403).json({ error: 'Delivery partners cannot cancel orders' });
    }

    let updated;
    if (status === 'CANCELLED') {
      updated = await cancelOrderAndRestock(order);
    } else {
      const data = { status };
      // Cash on delivery is collected when the parcel is handed over.
      if (status === 'DELIVERED' && order.paymentMethod === 'COD') data.paymentStatus = 'PAID';
      updated = await prisma.order.update({ where: { id: order.id }, data, include: ORDER_INCLUDE });
    }

    sendEmailSafely(sendOrderStatusEmail(updated));
    res.json(formatOrder(updated));
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Admin: confirm a bank transfer / mark a payment as received.
const updatePaymentStatus = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status === 'CANCELLED') return res.status(400).json({ error: 'This order was cancelled' });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: req.body.paymentStatus },
      include: ORDER_INCLUDE
    });
    res.json(formatOrder(updated));
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createOrder,
  payOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getAllOrders,
  getOrderById,
  getDeliveryOrders,
  updateOrderStatus,
  updatePaymentStatus
};
