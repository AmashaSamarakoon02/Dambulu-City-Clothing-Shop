const prisma = require('../prismaClient');

const toSlug = (name) => name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const getCategories = async (req, res) => {
  try {
    const [categories, counts] = await Promise.all([
      prisma.category.findMany({ orderBy: { id: 'asc' } }),
      prisma.product.groupBy({ by: ['category'], _count: true })
    ]);
    const countBySlug = Object.fromEntries(counts.map((c) => [c.category, c._count]));
    res.json(categories.map((c) => ({ ...c, productCount: countBySlug[c.slug] || 0 })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const createCategory = async (req, res) => {
  try {
    const name = req.body.name;
    const slug = toSlug(name);
    if (!slug) return res.status(400).json({ error: 'Please enter a valid category name' });

    const duplicate = await prisma.category.findFirst({
      where: { OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] }
    });
    if (duplicate) return res.status(400).json({ error: 'A category with this name already exists' });

    const category = await prisma.category.create({ data: { name, slug } });
    res.status(201).json({ ...category, productCount: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Renaming keeps the slug so existing product links and URLs stay valid.
const updateCategory = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const duplicate = await prisma.category.findFirst({
      where: { name: { equals: req.body.name, mode: 'insensitive' }, NOT: { id: category.id } }
    });
    if (duplicate) return res.status(400).json({ error: 'A category with this name already exists' });

    const updated = await prisma.category.update({ where: { id: category.id }, data: { name: req.body.name } });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    const productCount = await prisma.product.count({ where: { category: category.slug } });
    if (productCount > 0) {
      return res.status(400).json({
        error: `This category still has ${productCount} product(s). Move or delete them first.`
      });
    }

    await prisma.category.delete({ where: { id: category.id } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
