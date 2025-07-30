import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  IconButton,
  Alert,
  Pagination,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Autocomplete,
  Stack,
  InputAdornment
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../store/slices/productsSlice';
import { fetchCategories, createCategory, deleteCategory } from '../store/slices/categoriesSlice';
import { ImageUpload } from '../components/ImageUpload';
import { Product } from '../types';
import client from '../api/client';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
  imageUrl: string;
}

export const ProductsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, error, total, totalPages, currentPage } = useSelector((state: RootState) => state.products);
  const { categories } = useSelector((state: RootState) => state.categories);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    categoryId: '',
    imageUrl: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOptions, setSearchOptions] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts({ page: 1 }));
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const fetchOptions = async () => {
      if (searchTerm.length < 1) {
        setSearchOptions([]);
        return;
      }
      try {
        const response = await client.get('/products', {
          params: { search: searchTerm, limit: 10 }
        });
        setSearchOptions(response.data.products);
      } catch (err) {
        setSearchOptions([]);
      }
    };
    const timeout = setTimeout(fetchOptions, 300); // debounce
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stockQuantity: '',
      categoryId: '',
      imageUrl: '',
    });
    setFormError(null);
    setFormSuccess(null);
    setSelectedFile(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stockQuantity: product.stockQuantity.toString(),
      categoryId: product.categoryId.toString(),
      imageUrl: product.imageUrl || '',
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await dispatch(deleteProduct(id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormError(null);
      setFormSuccess(null);
      console.log('Form data before submission:', formData);

      // Validate required fields
      if (!formData.name.trim()) {
        setFormError('Product name is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.description.trim()) {
        setFormError('Product description is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        setFormError('Valid price is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
        setFormError('Valid stock quantity is required');
        setIsSubmitting(false);
        return;
      }
      if (!formData.categoryId) {
        setFormError('Category is required');
        setIsSubmitting(false);
        return;
      }

      const formDataObj = new FormData();
      
      // Add all product data to FormData
      formDataObj.append('name', formData.name.trim());
      formDataObj.append('description', formData.description.trim());
      formDataObj.append('price', formData.price);
      formDataObj.append('stockQuantity', formData.stockQuantity);
      formDataObj.append('categoryId', formData.categoryId);

      // Add image file if selected
      if (selectedFile) {
        formDataObj.append('image', selectedFile);
      } else if (formData.imageUrl) {
        formDataObj.append('imageUrl', formData.imageUrl);
      }

      console.log('FormData entries:');
      Array.from(formDataObj.entries()).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });

      let response;
      if (editingProduct) {
        response = await dispatch(updateProduct({ 
          id: editingProduct.id,
          formData: formDataObj
        }));
      } else {
        response = await dispatch(createProduct(formDataObj));
      }

      if (createProduct.fulfilled.match(response) || updateProduct.fulfilled.match(response)) {
        // Show success message
        const successMessage = editingProduct 
          ? `Product "${formData.name}" updated successfully!`
          : `Product "${formData.name}" created successfully!`;
        setFormSuccess(successMessage);
        
        // Refresh the products list after creating/updating
        await dispatch(fetchProducts({
          page: currentPage,
          limit: 10,
          search: searchTerm,
          categoryId: selectedCategory?.toString()
        }));
        
        // Close dialog after a short delay to show success message
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else if (createProduct.rejected.match(response) || updateProduct.rejected.match(response)) {
        // Extract error message from the rejected action
        const errorMessage = response.payload as string;
        console.log('Product creation/update failed:', errorMessage);
        setFormError(errorMessage || 'Failed to save product');
      }
    } catch (err: any) {
      console.error('Error submitting form:', err);
      // Handle different types of errors
      let errorMessage = 'Failed to save product';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      console.log('Setting form error:', errorMessage);
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    console.log('Form field changed:', name, value); // Debug log
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    dispatch(
      fetchProducts({
        page: value,
        ...(selectedCategory ? { categoryId: selectedCategory.toString() } : {}),
        ...(searchTerm ? { search: searchTerm } : {})
      })
    );
  };

  const handleAddCategory = async () => {
    setCategoryLoading(true);
    setCategoryError(null);
    try {
      if (!newCategory.name.trim()) {
        setCategoryError('Category name is required');
        return;
      }

      const response = await dispatch(createCategory({
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || undefined
      }));

      if (createCategory.fulfilled.match(response)) {
        setAddCategoryOpen(false);
        setNewCategory({ name: '', description: '' });
        // Refresh categories list
        await dispatch(fetchCategories());
        // Show success message
        setCategoryError(null);
      } else if (createCategory.rejected.match(response)) {
        setCategoryError(response.payload as string || 'Failed to create category');
      }
    } catch (err: any) {
      console.error('Error creating category:', err);
      setCategoryError(err.response?.data?.error || 'Failed to add category');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await dispatch(deleteCategory(categoryId));
        dispatch(fetchCategories());
      } catch (err: any) {
        setCategoryError(err.response?.data?.error || 'Failed to delete category');
      }
    }
  };

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (!categoryLoading && !categoryError) {
      dispatch(fetchCategories());
    }
  }, [categoryLoading, categoryError, dispatch]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 2,
        mb: 3,
        flexWrap: { xs: 'wrap', md: 'nowrap' }
      }}>
        <Typography variant="h4" sx={{ whiteSpace: 'nowrap' }}>Products</Typography>
        
        {/* Search Bar */}
        <Box sx={{ 
          width: { xs: '100%', md: '500px' },
          minWidth: { xs: '100%', md: 'auto' }
        }}>
          <Autocomplete
            freeSolo
            options={searchOptions.map((option) => option.name)}
            inputValue={searchTerm}
            onInputChange={(_, value) => {
              setSearchTerm(value);
              if (value === '') {
                dispatch(fetchProducts({}));
              }
            }}
            onChange={(_, value) => {
              setSearchTerm(value || '');
              if (value) {
                dispatch(fetchProducts({ search: value }));
              } else {
                dispatch(fetchProducts({}));
              }
            }}
            renderInput={(params) => (
              <TextField 
                {...params} 
                placeholder="Search products..."
                variant="outlined"
                fullWidth
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Spacer to push buttons to the right */}
        <Box sx={{ flex: 1 }} />

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ 
          minWidth: { xs: '100%', md: 'auto' },
          width: { xs: '100%', md: '300px' }
        }}>
          <Button 
            variant="contained" 
            onClick={() => setAddCategoryOpen(true)}
            fullWidth
            size="small"
            sx={{ 
              height: '40px',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Add Category
          </Button>
          <Button 
            variant="contained" 
            onClick={handleOpen}
            fullWidth
            size="small"
            sx={{ 
              height: '40px',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Add Product
          </Button>
        </Stack>
      </Box>

      {/* Category Filter Bar */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant={selectedCategory === null ? 'contained' : 'outlined'}
          onClick={() => {
            setSelectedCategory(null);
            dispatch(fetchProducts({}));
          }}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'contained' : 'outlined'}
            onClick={() => {
              setSelectedCategory(cat.id);
              dispatch(fetchProducts({ categoryId: cat.id.toString() }));
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              pr: 1,
              '&:hover .delete-icon': {
                opacity: 1,
              }
            }}
          >
            {cat.name}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCategory(cat.id);
              }}
              className="delete-icon"
              sx={{ 
                color: 'inherit',
                opacity: 0,
                transition: 'opacity 0.2s',
                p: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Button>
        ))}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => {
              console.log('Product in table:', product); // Debug log
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.imageUrl ? (
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: 1,
                          backgroundColor: '#f5f5f5'
                        }}
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          style={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            console.error('Error loading image:', product.imageUrl);
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMjUgMjVDMjUgMjUgMTkgMzEgMTkgMzVIMzFDMzEgMzEgMjUgMjUgMjUgMjVaIiBmaWxsPSIjOTRBM0I5Ii8+PHBhdGggZD0iTTI1IDI2QzI3LjIwOTEgMjYgMjkgMjQuMjA5MSAyOSAyMkMyOSAxOS43OTA5IDI3LjIwOTEgMTggMjUgMThDMjIuNzkwOSAxOCAyMSAxOS43OTA5IDIxIDIyQzIxIDI0LjIwOTEgMjIuNzkwOSAyNiAyNSAyNloiIGZpbGw9IiM5NEEzQjkiLz48L3N2Zz4=';
                          }}
                          onLoad={(e) => {
                            console.log('Image loaded successfully:', product.imageUrl);
                          }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: 1,
                          backgroundColor: '#f5f5f5'
                        }}
                      >
                        <img
                          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMjUgMjVDMjUgMjUgMTkgMzEgMTkgMzVIMzFDMzEgMzEgMjUgMjUgMjUgMjVaIiBmaWxsPSIjOTRBM0I5Ii8+PHBhdGggZD0iTTI1IDI2QzI3LjIwOTEgMjYgMjkgMjQuMjA5MSAyOSAyMkMyOSAxOS43OTA5IDI3LjIwOTEgMTggMjUgMThDMjIuNzkwOSAxOCAyMSAxOS43OTA5IDIxIDIyQzIxIDI0LjIwOTEgMjIuNzkwOSAyNiAyNSAyNloiIGZpbGw9IiM5NEEzQjkiLz48L3N2Zz4="
                          alt="Placeholder"
                          style={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                  <TableCell>{product.stockQuantity}</TableCell>
                  <TableCell>{product.category?.name}</TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => handleEdit(product)}
                      aria-label={`Edit ${product.name}`}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(product.id)}
                      aria-label={`Delete ${product.name}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {total > 20 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
          />
        </Box>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}
              {formSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {formSuccess}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                margin="normal"
                required
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                margin="normal"
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                fullWidth
                label="Stock Quantity"
                name="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={handleChange}
                margin="normal"
                required
                inputProps={{ min: 0 }}
              />
              <TextField
                fullWidth
                select
                label="Category"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                margin="normal"
                required
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Product Image
                </Typography>
                <ImageUpload
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  onFileSelect={setSelectedFile}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSubmitting ? (editingProduct ? 'Updating...' : 'Creating...') : (editingProduct ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)}>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={newCategory.name}
            onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
          />
          {categoryError && <Alert severity="error" sx={{ mt: 2 }}>{categoryError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCategoryOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleAddCategory} variant="contained" disabled={categoryLoading}>
            {categoryLoading ? <CircularProgress size={20} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage; 