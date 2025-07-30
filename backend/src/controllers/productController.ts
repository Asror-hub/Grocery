import { Request, Response } from 'express';
import { Product, Category } from '../models';
import { Op } from 'sequelize';
import { deleteFromB2 } from '../config/storage';
import { uploadToB2 } from '../config/storage';

// Get all products with pagination and filters
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = 'name',
      sortOrder = 'ASC',
      isNew,
      recommended
    } = req.query;

    // Create a clean filters object for logging (excluding undefined values)
    const filtersForLogging = {
      page, 
      limit, 
      search, 
      categoryId, 
      minPrice, 
      maxPrice, 
      sortBy, 
      sortOrder, 
      isNew, 
      recommended
    };
    
    // Remove undefined values from logging
    Object.keys(filtersForLogging).forEach(key => {
      if (filtersForLogging[key as keyof typeof filtersForLogging] === undefined) {
        delete filtersForLogging[key as keyof typeof filtersForLogging];
      }
    });

    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {
      isDeleted: false,
      ...(search ? {
        name: {
          [Op.iLike]: `%${search}%`
        }
      } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(minPrice ? { price: { [Op.gte]: Number(minPrice) } } : {}),
      ...(maxPrice ? { price: { [Op.lte]: Number(maxPrice) } } : {}),
      ...(isNew !== undefined ? { isNew: isNew === 'true' } : {}),
      ...(recommended !== undefined ? { isRecommended: recommended === 'true' } : {})
    };

    const products = await Product.findAndCountAll({
      where,
      include: [{
        model: Category,
        as: 'category',
        where: { isDeleted: false },
        required: false
      }],
      order: [[sortBy as string, sortOrder as string]],
      limit: Number(limit),
      offset
    });

    res.json({
      products: products.rows,
      total: products.count,
      currentPage: Number(page),
      totalPages: Math.ceil(products.count / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products' });
  }
};

// Get product by ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error fetching product' });
  }
};

// Create new product (admin only)
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🟢 PRODUCT CREATION STARTED');
    console.log('Product details:', {
      name: req.body.name,
      price: req.body.price,
      categoryId: req.body.categoryId,
      hasImage: !!req.file
    });

    const {
      name,
      description,
      price,
      stockQuantity,
      categoryId,
      imageUrl
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !categoryId) {
      console.log('❌ PRODUCT CREATION FAILED: Missing required fields');
      res.status(400).json({ 
        error: 'Missing required fields: name, description, price, and categoryId are required' 
      });
      return;
    }

    // Validate price and stock
    if (price < 0) {
      console.log('❌ PRODUCT CREATION FAILED: Negative price');
      res.status(400).json({ error: 'Price cannot be negative' });
      return;
    }
    if (stockQuantity < 0) {
      console.log('❌ PRODUCT CREATION FAILED: Negative stock');
      res.status(400).json({ error: 'Stock cannot be negative' });
      return;
    }

    // Validate category exists
    const category = await Category.findOne({
      where: {
        id: categoryId,
        isDeleted: false
      }
    });

    if (!category) {
      console.log('❌ PRODUCT CREATION FAILED: Category not found');
      res.status(400).json({ error: 'Category not found' });
      return;
    }

    // Check if product with same name exists
    const existingProduct = await Product.findOne({
      where: {
        name,
        isDeleted: false
      }
    });

    if (existingProduct) {
      console.log('❌ PRODUCT CREATION FAILED: Duplicate product name');
      res.status(400).json({ error: 'Product with this name already exists' });
      return;
    }

    // Handle image upload if present
    let finalImageUrl = imageUrl;
    if (req.file) {
      try {
        const { originalname, mimetype, buffer } = req.file;
        console.log('📤 Uploading image to B2:', originalname);
        finalImageUrl = await uploadToB2(buffer, originalname, mimetype);
        console.log('✅ Image uploaded successfully');
      } catch (error) {
        console.log('❌ PRODUCT CREATION FAILED: Image upload error');
        res.status(500).json({ error: 'Failed to upload product image' });
        return;
      }
    }

    // Create product in database
    const product = await Product.create({
      name,
      description,
      price,
      stockQuantity: stockQuantity || 0,
      categoryId,
      imageUrl: finalImageUrl || null,
      isDeleted: false,
      isNew: false,
      isRecommended: false
    });

    // Return product with category
    const productWithCategory = await Product.findOne({
      where: { id: product.id },
      include: [{
        model: Category,
        as: 'category'
      }]
    });

    console.log('✅ PRODUCT CREATED SUCCESSFULLY');
    console.log('Product ID:', product.id);
    console.log('Product Name:', product.name);
    console.log('Category:', category.name);

    res.status(201).json(productWithCategory);
  } catch (error) {
    console.log('❌ PRODUCT CREATION FAILED:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'Error creating product' });
    }
  }
};

// Update product (admin only)
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      stockQuantity,
      categoryId,
      imageUrl
    } = req.body;

    console.log('🟢 PRODUCT UPDATE STARTED');
    console.log('Product ID:', id);
    console.log('Update data:', { 
      name, 
      description, 
      price, 
      stockQuantity, 
      categoryId, 
      hasNewImage: !!req.file,
      hasImageUrl: !!imageUrl
    });

    // First check if product exists without isDeleted condition
    const existingProduct = await Product.findOne({
      where: { id }
    });

    if (!existingProduct) {
      console.log('❌ PRODUCT UPDATE FAILED: Product not found with ID:', id);
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (existingProduct.isDeleted) {
      console.log('❌ PRODUCT UPDATE FAILED: Product is deleted:', id);
      res.status(404).json({ error: 'Product has been deleted' });
      return;
    }

    // Validate category exists if changing
    if (categoryId && categoryId !== existingProduct.categoryId) {
      const category = await Category.findOne({
        where: {
          id: categoryId,
          isDeleted: false
        }
      });

      if (!category) {
        console.log('❌ PRODUCT UPDATE FAILED: Category not found');
        res.status(404).json({ error: 'Category not found' });
        return;
      }
    }

    // Handle image update only if there's a new image or imageUrl
    let finalImageUrl = existingProduct.imageUrl;
    if (req.file || (imageUrl && imageUrl !== existingProduct.imageUrl)) {
      // Delete old image only if it exists and we're uploading a new one
      if (existingProduct.imageUrl && req.file) {
        try {
          // Check if the old image URL is a valid B2 URL before attempting deletion
          if (existingProduct.imageUrl.includes('backblazeb2.com')) {
            console.log('🗑️ Deleting old image:', existingProduct.imageUrl);
            await deleteFromB2(existingProduct.imageUrl);
          } else {
            console.log('ℹ️ Skipping old image deletion - not a B2 URL');
          }
        } catch (error) {
          // If the error is about file not found, just log and continue
          if (error instanceof Error && error.message.includes('File not found')) {
            console.log('ℹ️ Old image not found in B2, continuing with update');
          } else {
            console.log('⚠️ Warning: Failed to delete old image:', error);
          }
          // Continue with update even if old image deletion fails
        }
      }

      // Upload new image if provided
      if (req.file) {
        try {
          const { originalname, mimetype, buffer } = req.file;
          console.log('📤 Uploading new image to B2:', originalname);
          finalImageUrl = await uploadToB2(buffer, originalname, mimetype);
          console.log('✅ New image uploaded successfully');
        } catch (error) {
          console.log('❌ PRODUCT UPDATE FAILED: Image upload error');
          res.status(500).json({ error: 'Failed to upload new product image' });
          return;
        }
      } else if (imageUrl && imageUrl !== existingProduct.imageUrl) {
        finalImageUrl = imageUrl;
      }
    }

    // Update product in database
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = price;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (categoryId) updateData.categoryId = categoryId;
    if (finalImageUrl !== existingProduct.imageUrl) updateData.imageUrl = finalImageUrl;

    await existingProduct.update(updateData);

    // Return updated product with category
    const updatedProduct = await Product.findOne({
      where: { id },
      include: [{
        model: Category,
        as: 'category'
      }]
    });

    console.log('✅ PRODUCT UPDATED SUCCESSFULLY');
    console.log('Product ID:', id);
    console.log('Updated fields:', Object.keys(updateData));

    res.json(updatedProduct);
  } catch (error) {
    console.log('❌ PRODUCT UPDATE FAILED:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Error updating product' });
  }
};

// Delete product (admin only)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🗑️ PRODUCT DELETE STARTED');
    const { id } = req.params;
    console.log('Product ID:', id);

    const product = await Product.findOne({
      where: { id, isDeleted: false }
    });

    if (!product) {
      console.log('❌ Product not found');
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    let imageDeletionStatus = 'no image';
    
    // Try to delete the image if it exists
    if (product.imageUrl) {
      try {
        console.log('🗑️ Attempting to delete image from B2:', product.imageUrl);
        await deleteFromB2(product.imageUrl);
        // Only set to deleted if no error was thrown
        imageDeletionStatus = 'deleted';
        console.log('✅ Image successfully deleted from B2');
      } catch (error) {
        console.log('❌ Failed to delete image from B2:', error instanceof Error ? error.message : 'Unknown error');
        imageDeletionStatus = 'failed';
      }
    }

    // Soft delete the product
    await product.update({ isDeleted: true });
    console.log('✅ Product marked as deleted in database');

    console.log('✅ PRODUCT DELETED SUCCESSFULLY');
    console.log('Product ID:', product.id);
    console.log('Product Name:', product.name);
    console.log('Image Deletion Status:', imageDeletionStatus);

    res.json({ 
      message: 'Product deleted successfully',
      details: {
        id: product.id,
        name: product.name,
        imageDeletionStatus,
        imageUrl: product.imageUrl // Include the image URL for reference
      }
    });
  } catch (error) {
    console.log('❌ PRODUCT DELETE FAILED:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ 
      message: 'Failed to delete product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Add new function to delete just the image
export const deleteProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log('🗑️ PRODUCT IMAGE DELETE STARTED');
    console.log('Product ID:', id);

    const product = await Product.findOne({
      where: {
        id,
        isDeleted: false
      }
    });

    if (!product) {
      console.log('❌ PRODUCT IMAGE DELETE FAILED: Product not found');
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (!product.imageUrl) {
      console.log('⚠️ No image to delete');
      res.status(400).json({ error: 'Product has no image' });
      return;
    }

    // Delete image from B2
    try {
      console.log('🗑️ Deleting image from B2:', product.imageUrl);
      await deleteFromB2(product.imageUrl);
      console.log('✅ Image deleted successfully');
    } catch (error) {
      console.log('❌ IMAGE DELETE FAILED:', error instanceof Error ? error.message : 'Unknown error');
      res.status(500).json({ error: 'Failed to delete image' });
      return;
    }

    // Update product to remove image URL
    await product.update({ imageUrl: '' });

    console.log('✅ PRODUCT IMAGE DELETED SUCCESSFULLY');
    console.log('Product ID:', product.id);
    console.log('Product Name:', product.name);

    res.json({ message: 'Product image deleted successfully' });
  } catch (error) {
    console.log('❌ PRODUCT IMAGE DELETE FAILED:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'Error deleting product image' });
    }
  }
};

// Get products by category
export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {
      categoryId,
      isDeleted: false,
      ...(search ? {
        name: {
          [Op.iLike]: `%${search}%`
        }
      } : {}),
      ...(minPrice ? { price: { [Op.gte]: Number(minPrice) } } : {}),
      ...(maxPrice ? { price: { [Op.lte]: Number(maxPrice) } } : {})
    };

    const products = await Product.findAndCountAll({
      where,
      include: [{
        model: Category,
        as: 'category',
        where: { isDeleted: false },
        required: false
      }],
      order: [[sortBy as string, sortOrder as string]],
      limit: Number(limit),
      offset
    });

    res.json({
      products: products.rows,
      total: products.count,
      currentPage: Number(page),
      totalPages: Math.ceil(products.count / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Error fetching products by category' });
  }
}; 