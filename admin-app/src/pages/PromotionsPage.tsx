import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  OutlinedInput,
  Avatar,
  Chip,
  IconButton
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { promotionsApi } from '../api/promotions';
import client from '../api/client';
import { ProductSelector } from '../components/ProductSelector';
import { ImageUpload } from '../components/ImageUpload';

interface Promotion {
  id: number | string;
  title: string;
  description: string;
  type: string;
  discountValue: number | null;
  price?: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  imageUrl?: string | null;
  products: { 
    id: number; 
    name: string; 
    price: number;
    imageUrl?: string;
  }[];
  quantityRequired?: number | null;
  quantityFree?: number | null;
  isVirtual?: boolean;
}

interface ProductOption {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
}

export const PromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'discount',
    discountValue: '',
    startDate: '',
    endDate: '',
    productIds: [] as number[],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [bundleForm, setBundleForm] = useState({
    title: '',
    description: '',
    type: 'bundle',
    discountValue: '',
    startDate: '',
    endDate: '',
    productIds: [] as number[],
    quantityRequired: '',
    quantityFree: '',
  });
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [boxOpen, setBoxOpen] = useState(false);
  const [boxForm, setBoxForm] = useState({
    title: '',
    description: '',
    type: 'box',
    price: '',
    startDate: '',
    endDate: '',
    productIds: [] as number[],
    imageUrl: '',
  });
  const [boxImageFile, setBoxImageFile] = useState<File | null>(null);
  const [boxLoading, setBoxLoading] = useState(false);
  const [boxError, setBoxError] = useState<string | null>(null);
  const [newProductsOpen, setNewProductsOpen] = useState(false);
  const [newProductsForm, setNewProductsForm] = useState({
    productIds: [] as number[],
  });
  const [newProductsLoading, setNewProductsLoading] = useState(false);
  const [newProductsError, setNewProductsError] = useState<string | null>(null);
  const [twoPlusOneOpen, setTwoPlusOneOpen] = useState(false);
  const [twoPlusOneForm, setTwoPlusOneForm] = useState({
    title: '',
    description: '',
    type: '2+1',
    startDate: '',
    endDate: '',
    productIds: [] as number[],
  });
  const [twoPlusOneLoading, setTwoPlusOneLoading] = useState(false);
  const [twoPlusOneError, setTwoPlusOneError] = useState<string | null>(null);
  const [recommendedOpen, setRecommendedOpen] = useState(false);
  const [recommendedForm, setRecommendedForm] = useState({
    productIds: [] as number[],
  });
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [recommendedError, setRecommendedError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching promotions and products...');
        const allPromotions = await fetchPromotionsAndProducts();
        console.log('All promotions (including virtual):', allPromotions);
        setPromotions(allPromotions);
      } catch (err: any) {
        console.error('Error in fetchPromotions:', err);
        setError(err.message || 'Failed to fetch promotions');
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  const fetchPromotionsAndProducts = async () => {
    let promotions = [];
    let products = [];
    
    try {
      const promotionsResponse = await client.get('/promotions');
      promotions = promotionsResponse.data;
      console.log('Promotions API response:', promotions);
      console.log('Promotions type:', typeof promotions);
      console.log('Is promotions array:', Array.isArray(promotions));
    } catch (promoErr: any) {
      console.error('Failed to fetch promotions:', promoErr);
      throw new Error('Failed to fetch promotions: ' + (promoErr.response?.data?.error || promoErr.message));
    }
    
    try {
      const productsResponse = await client.get('/products');
      products = productsResponse.data;
      console.log('Products API response:', products);
      console.log('Products type:', typeof products);
      console.log('Is products array:', Array.isArray(products));
      
      // If products is not an array, try to extract it from the response
      if (!Array.isArray(products)) {
        console.log('Products is not an array, checking response structure...');
        if (products && Array.isArray(products.products)) {
          console.log('Found products array in response.products');
          products = products.products;
        } else if (products && Array.isArray(products.data)) {
          console.log('Found products array in response.data');
          products = products.data;
        } else {
          console.error('Could not find products array in response:', products);
          return promotions; // Return only regular promotions
        }
      }
    } catch (productsErr: any) {
      console.error('Failed to fetch products:', productsErr);
      // If products fail, just return regular promotions without virtual ones
      return promotions;
    }
    
    return createVirtualPromotions(promotions, products);
  };

  const createVirtualPromotions = (promotions: any[], products: any[]) => {
    // Ensure products is an array
    if (!Array.isArray(products)) {
      console.error('Products is not an array:', products);
      console.error('Products type:', typeof products);
      return promotions; // Return only regular promotions if products is not an array
    }
    
    // Ensure promotions is an array
    if (!Array.isArray(promotions)) {
      console.error('Promotions is not an array:', promotions);
      console.error('Promotions type:', typeof promotions);
      return []; // Return empty array if promotions is not an array
    }
    
    const newProducts = products.filter((p: any) => p && p.isNew === true);
    const recommendedProducts = products.filter((p: any) => p && p.isRecommended === true);
    
    console.log('Filtered new products:', newProducts.length);
    console.log('Filtered recommended products:', recommendedProducts.length);
    
    const virtualPromotions = [];
    
    if (newProducts.length > 0) {
      virtualPromotions.push({
        id: 'new-products',
        title: 'New Products',
        description: 'Latest products in our collection',
        type: 'new-products',
        discountValue: null,
        price: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        imageUrl: null,
        products: newProducts,
        quantityRequired: null,
        quantityFree: null,
        isVirtual: true
      });
    }
    
    if (recommendedProducts.length > 0) {
      virtualPromotions.push({
        id: 'recommended-products',
        title: 'Recommended Products',
        description: 'Our top picks for you',
        type: 'recommended-products',
        discountValue: null,
        price: null,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
        imageUrl: null,
        products: recommendedProducts,
        quantityRequired: null,
        quantityFree: null,
        isVirtual: true
      });
    }
    
    return [...virtualPromotions, ...promotions];
  };

  const validateForm = (formData: any) => {
    if (!formData.title.trim()) {
      return 'Title is required';
    }
    if (!formData.description.trim()) {
      return 'Description is required';
    }
    if (!formData.startDate) {
      return 'Start date is required';
    }
    if (!formData.endDate) {
      return 'End date is required';
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      return 'End date must be after start date';
    }
    if (formData.type === 'discount' && (!formData.discountValue || Number(formData.discountValue) <= 0)) {
      return 'Valid discount value is required';
    }
    if (formData.type === 'bundle') {
      if (!formData.quantityRequired || Number(formData.quantityRequired) <= 0) {
        return 'Valid quantity required is needed';
      }
      if (!formData.quantityFree || Number(formData.quantityFree) <= 0) {
        return 'Valid free quantity is needed';
      }
    }
    if (!formData.productIds || formData.productIds.length === 0) {
      return 'At least one product must be selected';
    }
    return null;
  };

  const handleAddPromotion = async () => {
    setFormLoading(true);
    setFormError(null);
    try {
      const validationError = validateForm(form);
      if (validationError) {
        setFormError(validationError);
        return;
      }

      await promotionsApi.create({
        title: form.title,
        description: form.description,
        type: form.type as any,
        discountValue: form.type === 'discount' ? Number(form.discountValue) : undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        productIds: form.productIds,
      });
      setAddOpen(false);
      setForm({ title: '', description: '', type: 'discount', discountValue: '', startDate: '', endDate: '', productIds: [] });
      try {
        const allPromotions = await fetchPromotionsAndProducts();
        setPromotions(allPromotions);
      } catch (err: any) {
        console.error('Failed to refresh promotions after adding promotion:', err);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to add promotion');
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (promo: Promotion) => {
    // For virtual promotions, we need to fetch all products to show the selection
    if (promo.isVirtual) {
      // For virtual promotions, we'll handle them differently
      setEditForm({
        ...promo,
        startDate: promo.startDate.slice(0, 10),
        endDate: promo.endDate.slice(0, 10),
        productIds: promo.products.map(p => p.id),
      });
      setEditOpen(true);
    } else {
      // For regular promotions
      setEditForm({
        ...promo,
        startDate: promo.startDate.slice(0, 10),
        endDate: promo.endDate.slice(0, 10),
        productIds: promo.products.map(p => p.id),
      });
      setEditOpen(true);
    }
  };

  const handleEditPromotion = async () => {
    setEditLoading(true);
    setEditError(null);
    try {
      // Handle virtual promotions differently
      if (editForm?.isVirtual) {
        if (!editForm.productIds || editForm.productIds.length === 0) {
          setEditError('At least one product must be selected');
          return;
        }

        if (editForm.type === 'new-products') {
          await client.post('/promotions/set-new-products', {
            productIds: editForm.productIds,
          });
        } else if (editForm.type === 'recommended-products') {
          await client.post('/promotions/set-recommended', {
            productIds: editForm.productIds,
          });
        }
      } else {
        // Handle regular promotions
        const validationError = validateForm(editForm);
        if (validationError) {
          setEditError(validationError);
          return;
        }

        await client.put(`/promotions/${editForm.id}`, {
          ...editForm,
          discountValue: editForm.type === 'discount' ? Number(editForm.discountValue) : null,
          price: editForm.type === 'box' ? Number(editForm.price) : null,
          productIds: editForm.productIds,
        });
      }

      setEditOpen(false);
      setEditForm(null);
      try {
        const allPromotions = await fetchPromotionsAndProducts();
        setPromotions(allPromotions);
      } catch (err: any) {
        console.error('Failed to refresh promotions after editing:', err);
      }
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update promotion');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePromotion = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      // Handle virtual promotions (new-products, recommended-products)
      if (typeof deleteId === 'string') {
        if (deleteId === 'new-products') {
          // Clear all new products
          await client.post('/promotions/set-new-products', { productIds: [] });
        } else if (deleteId === 'recommended-products') {
          // Clear all recommended products
          await client.post('/promotions/set-recommended', { productIds: [] });
        }
      } else {
        // Handle regular promotions
        await client.delete(`/promotions/${deleteId}`);
      }
      
      setDeleteId(null);
      // Refresh the promotions list
      try {
        const allPromotions = await fetchPromotionsAndProducts();
        setPromotions(allPromotions);
      } catch (err: any) {
        console.error('Failed to refresh promotions after delete:', err);
      }
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Failed to delete promotion');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddBundle = async () => {
    setBundleLoading(true);
    setBundleError(null);
    try {
      const validationError = validateForm(bundleForm);
      if (validationError) {
        setBundleError(validationError);
        return;
      }

      await client.post('/promotions', {
        ...bundleForm,
        discountValue: null,
        productIds: bundleForm.productIds,
      });
      setBundleOpen(false);
      setBundleForm({ title: '', description: '', type: 'bundle', discountValue: '', startDate: '', endDate: '', productIds: [], quantityRequired: '', quantityFree: '' });
      try {
        const allPromotions = await fetchPromotionsAndProducts();
        setPromotions(allPromotions);
      } catch (err: any) {
        console.error('Failed to refresh promotions after adding bundle:', err);
      }
    } catch (err: any) {
      setBundleError(err.response?.data?.error || 'Failed to add bundle');
    } finally {
      setBundleLoading(false);
    }
  };

  const handleAddBox = async () => {
    setBoxLoading(true);
    setBoxError(null);
    try {
      if (!boxForm.title.trim()) return setBoxError('Title is required');
      if (!boxForm.description.trim()) return setBoxError('Description is required');
      if (!boxForm.price || Number(boxForm.price) <= 0) return setBoxError('Valid box price is required');
      if (!boxForm.startDate) return setBoxError('Start date is required');
      if (!boxForm.endDate) return setBoxError('End date is required');
      if (new Date(boxForm.endDate) <= new Date(boxForm.startDate)) return setBoxError('End date must be after start date');
      if (!boxForm.productIds || boxForm.productIds.length === 0) return setBoxError('At least one product must be selected');

      let imageUrl = '';
      if (boxImageFile) {
        const formData = new FormData();
        formData.append('image', boxImageFile);
        const uploadResponse = await client.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        imageUrl = uploadResponse.data.url;
      }

      await promotionsApi.create({
        title: boxForm.title,
        description: boxForm.description,
        type: 'box',
        price: Number(boxForm.price),
        startDate: boxForm.startDate,
        endDate: boxForm.endDate,
        productIds: boxForm.productIds,
        imageUrl: imageUrl,
      });
      setBoxOpen(false);
      setBoxForm({ title: '', description: '', type: 'box', price: '', startDate: '', endDate: '', productIds: [], imageUrl: '' });
      setBoxImageFile(null);
      try {
        const allPromotions = await fetchPromotionsAndProducts();
        setPromotions(allPromotions);
      } catch (err: any) {
        console.error('Failed to refresh promotions after adding box:', err);
      }
    } catch (err: any) {
      setBoxError(err.response?.data?.error || 'Failed to add box');
    } finally {
      setBoxLoading(false);
    }
  };

  const handleSetNewProducts = async () => {
    setNewProductsLoading(true);
    setNewProductsError(null);
    try {
      if (!newProductsForm.productIds || newProductsForm.productIds.length === 0) {
        return setNewProductsError('At least one product must be selected');
      }

      await promotionsApi.setNewProducts(newProductsForm.productIds);
      setNewProductsOpen(false);
      setNewProductsForm({ productIds: [] });
      // Refresh promotions to update virtual promotions
      try {
        const allPromotions = await fetchPromotionsAndProducts();
        setPromotions(allPromotions);
      } catch (err: any) {
        console.error('Failed to refresh promotions after setting new products:', err);
      }
    } catch (err: any) {
      setNewProductsError(err.response?.data?.error || 'Failed to set new products');
    } finally {
      setNewProductsLoading(false);
    }
  };

  const handleTwoPlusOne = async () => {
    setTwoPlusOneLoading(true);
    setTwoPlusOneError(null);
    try {
      const validationError = validateForm(twoPlusOneForm);
      if (validationError) {
        setTwoPlusOneError(validationError);
        return;
      }

      await promotionsApi.create({
        title: twoPlusOneForm.title,
        description: twoPlusOneForm.description,
        type: '2+1',
        startDate: twoPlusOneForm.startDate,
        endDate: twoPlusOneForm.endDate,
        productIds: twoPlusOneForm.productIds,
        quantityRequired: 2,
        quantityFree: 1,
      });
      setTwoPlusOneOpen(false);
      setTwoPlusOneForm({ title: '', description: '', type: '2+1', startDate: '', endDate: '', productIds: [] });
      try {
        const allPromotions = await fetchPromotionsAndProducts();
        setPromotions(allPromotions);
      } catch (err: any) {
        console.error('Failed to refresh promotions after adding 2+1:', err);
      }
    } catch (err: any) {
      setTwoPlusOneError(err.response?.data?.error || 'Failed to add 2+1 promotion');
    } finally {
      setTwoPlusOneLoading(false);
    }
  };

  const handleSetRecommendedProducts = async () => {
    setRecommendedLoading(true);
    setRecommendedError(null);
    try {
      if (!recommendedForm.productIds || recommendedForm.productIds.length === 0) {
        setRecommendedError('At least one product must be selected');
        return;
      }

      await client.post('/promotions/set-recommended', {
        productIds: recommendedForm.productIds,
      });
      setRecommendedOpen(false);
      setRecommendedForm({ productIds: [] });
      // Refresh promotions to update virtual promotions
      try {
        const allPromotions = await fetchPromotionsAndProducts();
        setPromotions(allPromotions);
      } catch (err: any) {
        console.error('Failed to refresh promotions after setting recommended products:', err);
      }
    } catch (err: any) {
      setRecommendedError(err.response?.data?.error || 'Failed to set recommended products');
    } finally {
      setRecommendedLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Promotions</Typography>
        <Box>
          <Button
            variant="contained"
            onClick={() => setAddOpen(true)}
            disabled={loading}
          >
            Add Promotion
          </Button>
          <Button
            variant="contained" 
            color="secondary" 
            onClick={() => setBoxOpen(true)}
            sx={{ ml: 2 }}
            disabled={loading}
          >
            Add Box
          </Button>
          <Button
            variant="contained" 
            color="info" 
            onClick={() => setNewProductsOpen(true)}
            sx={{ ml: 2 }}
            disabled={loading}
          >
            Set New Products
          </Button>
          <Button
            variant="contained" 
            color="warning" 
            onClick={() => setTwoPlusOneOpen(true)}
            sx={{ ml: 2 }}
            disabled={loading}
          >
            2+1
          </Button>
          <Button
            variant="contained" 
            color="success" 
            onClick={() => setRecommendedOpen(true)}
            sx={{ ml: 2 }}
            disabled={loading}
          >
            Set as Recommended
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Discount/Bundle</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {promotions.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {promo.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {promo.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={promo.type === 'new-products' ? 'NEW PRODUCTS' : 
                             promo.type === 'recommended-products' ? 'RECOMMENDED' :
                             promo.type.toUpperCase()} 
                      color={promo.isVirtual ? "secondary" : "primary"}
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {promo.products.slice(0, 2).map((product) => (
                        <Box key={product.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {product.imageUrl && (
                            <Avatar
                              src={product.imageUrl}
                              alt={product.name}
                              sx={{ width: 24, height: 24 }}
                            />
                          )}
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {product.name}
                          </Typography>
                        </Box>
                      ))}
                      {promo.products.length > 2 && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          +{promo.products.length - 2} more products
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {promo.isVirtual 
                      ? `${promo.products.length} products`
                      : promo.type === 'discount' 
                        ? `${promo.discountValue}%`
                        : promo.type === 'box'
                          ? `$${promo.price}`
                          : `Buy ${promo.quantityRequired} Get ${promo.quantityFree} Free`
                    }
                  </TableCell>
                  <TableCell>{new Date(promo.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(promo.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box sx={{ 
                      color: promo.isActive ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}>
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => openEdit(promo)}
                      disabled={editLoading}
                    >
                      {promo.isVirtual ? 'Update Products' : 'Edit'}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setDeleteId(promo.id)}
                      disabled={deleteLoading}
                    >
                      {promo.isVirtual ? 'Clear' : 'Delete'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Promotion Dialog */}
      <Dialog open={addOpen} onClose={() => !formLoading && setAddOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Promotion</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as string }))}
              input={<OutlinedInput label="Type" />}
            >
              <MenuItem value="discount">Discount</MenuItem>
              <MenuItem value="bundle">Bundle</MenuItem>
              <MenuItem value="bogo">BOGO</MenuItem>
            </Select>
          </FormControl>
          {form.type === 'discount' && (
            <TextField
              label="Discount (%)"
              type="number"
              fullWidth
              margin="normal"
              value={form.discountValue}
              onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
            />
          )}
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={form.startDate}
            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
          />
          <TextField
            label="End Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={form.endDate}
            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
          />
          <ProductSelector
            value={form.productIds}
            onChange={(productIds) => setForm(f => ({ ...f, productIds }))}
            label="Products"
            placeholder="Search and select products..."
            error={!!formError}
            helperText={formError || undefined}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)} disabled={formLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAddPromotion}
            variant="contained"
            color="primary"
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {formLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Promotion Dialog */}
      <Dialog open={editOpen} onClose={() => !editLoading && setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editForm?.isVirtual ? `Edit ${editForm?.title}` : 'Edit Promotion'}
        </DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
          
          {!editForm?.isVirtual && (
            <>
              <TextField
                label="Title"
                fullWidth
                margin="normal"
                value={editForm?.title || ''}
                onChange={e => setEditForm((f: any) => ({ ...f, title: e.target.value }))}
              />
              <TextField
                label="Description"
                fullWidth
                margin="normal"
                value={editForm?.description || ''}
                onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
              />
            </>
          )}
          
          {editForm?.isVirtual && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the products you want to include in this collection. You can search and select multiple products.
            </Typography>
          )}
          {editForm?.type === 'box' ? (
            <TextField
              label="Price"
              type="number"
              fullWidth
              margin="normal"
              value={editForm?.price || ''}
              onChange={e => setEditForm((f: any) => ({ ...f, price: e.target.value }))}
            />
          ) : (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Type</InputLabel>
                <Select
                  value={editForm?.type || 'discount'}
                  onChange={e => setEditForm((f: any) => ({ ...f, type: e.target.value as string }))}
                  input={<OutlinedInput label="Type" />}
                >
                  <MenuItem value="discount">Discount</MenuItem>
                  <MenuItem value="bundle">Bundle</MenuItem>
                  <MenuItem value="bogo">BOGO</MenuItem>
                </Select>
              </FormControl>
              {editForm?.type === 'discount' && (
                <TextField
                  label="Discount (%)"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={editForm?.discountValue || ''}
                  onChange={e => setEditForm((f: any) => ({ ...f, discountValue: e.target.value }))}
                />
              )}
            </>
          )}
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={editForm?.startDate ? editForm.startDate.slice(0, 10) : ''}
            onChange={e => setEditForm((f: any) => ({ ...f, startDate: e.target.value }))}
          />
          <TextField
            label="End Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={editForm?.endDate ? editForm.endDate.slice(0, 10) : ''}
            onChange={e => setEditForm((f: any) => ({ ...f, endDate: e.target.value }))}
          />
          <ProductSelector
            value={editForm?.productIds || []}
            onChange={(productIds) => setEditForm((f: any) => ({ ...f, productIds }))}
            label="Products"
            placeholder="Search and select products..."
            error={!!editError}
            helperText={editError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={editLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleEditPromotion}
            variant="contained"
            color="primary"
            disabled={editLoading}
            startIcon={editLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {editLoading ? 'Updating...' : (editForm?.isVirtual ? 'Update Products' : 'Update')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bundle Dialog */}
      <Dialog open={bundleOpen} onClose={() => !bundleLoading && setBundleOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Bundle</DialogTitle>
        <DialogContent>
          {bundleError && <Alert severity="error" sx={{ mb: 2 }}>{bundleError}</Alert>}
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={bundleForm.title}
            onChange={e => setBundleForm(f => ({ ...f, title: e.target.value }))}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={bundleForm.description}
            onChange={e => setBundleForm(f => ({ ...f, description: e.target.value }))}
          />
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={bundleForm.startDate}
            onChange={e => setBundleForm(f => ({ ...f, startDate: e.target.value }))}
          />
          <TextField
            label="End Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={bundleForm.endDate}
            onChange={e => setBundleForm(f => ({ ...f, endDate: e.target.value }))}
          />
          <TextField
            label="Quantity Required"
            type="number"
            fullWidth
            margin="normal"
            value={bundleForm.quantityRequired}
            onChange={e => setBundleForm(f => ({ ...f, quantityRequired: e.target.value }))}
          />
          <TextField
            label="Quantity Free"
            type="number"
            fullWidth
            margin="normal"
            value={bundleForm.quantityFree}
            onChange={e => setBundleForm(f => ({ ...f, quantityFree: e.target.value }))}
          />
          <ProductSelector
            value={bundleForm.productIds}
            onChange={(productIds) => setBundleForm(f => ({ ...f, productIds }))}
            label="Products"
            placeholder="Search and select products..."
            error={!!bundleError}
            helperText={bundleError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBundleOpen(false)} disabled={bundleLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAddBundle}
            variant="contained"
            color="primary"
            disabled={bundleLoading}
            startIcon={bundleLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {bundleLoading ? 'Creating...' : 'Create Bundle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Promotion</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <Typography>Are you sure you want to delete this promotion?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeletePromotion}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Box Dialog */}
      <Dialog open={boxOpen} onClose={() => !boxLoading && setBoxOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Box</DialogTitle>
        <DialogContent>
          {boxError && <Alert severity="error" sx={{ mb: 2 }}>{boxError}</Alert>}
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={boxForm.title}
            onChange={e => setBoxForm(f => ({ ...f, title: e.target.value }))}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={boxForm.description}
            onChange={e => setBoxForm(f => ({ ...f, description: e.target.value }))}
          />
          <TextField
            label="Box Price"
            type="number"
            fullWidth
            margin="normal"
            value={boxForm.price}
            onChange={e => setBoxForm(f => ({ ...f, price: e.target.value }))}
          />
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Box Thumbnail Image
          </Typography>
          <ImageUpload
            value={boxForm.imageUrl}
            onChange={(url) => setBoxForm(f => ({ ...f, imageUrl: url }))}
            onFileSelect={setBoxImageFile}
          />
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={boxForm.startDate}
            onChange={e => setBoxForm(f => ({ ...f, startDate: e.target.value }))}
          />
          <TextField
            label="End Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={boxForm.endDate}
            onChange={e => setBoxForm(f => ({ ...f, endDate: e.target.value }))}
          />
          <ProductSelector
            value={boxForm.productIds}
            onChange={(productIds) => setBoxForm(f => ({ ...f, productIds }))}
            label="Products"
            placeholder="Search and select products..."
            error={!!boxError}
            helperText={boxError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBoxOpen(false)} disabled={boxLoading}>
            Cancel
          </Button>
          <Button onClick={handleAddBox} variant="contained" disabled={boxLoading}>
            {boxLoading ? 'Saving...' : 'Save Box'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Set New Products Dialog */}
      <Dialog open={newProductsOpen} onClose={() => !newProductsLoading && setNewProductsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set New Products</DialogTitle>
        <DialogContent>
          {newProductsError && <Alert severity="error" sx={{ mb: 2 }}>{newProductsError}</Alert>}
          <ProductSelector
            value={newProductsForm.productIds}
            onChange={(productIds) => setNewProductsForm(f => ({ ...f, productIds }))}
            label="Products"
            placeholder="Search and select products to mark as new..."
            error={!!newProductsError}
            helperText={newProductsError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewProductsOpen(false)} disabled={newProductsLoading}>
            Cancel
          </Button>
          <Button onClick={handleSetNewProducts} variant="contained" disabled={newProductsLoading}>
            {newProductsLoading ? 'Saving...' : 'Set as New'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2+1 Promotion Dialog */}
      <Dialog open={twoPlusOneOpen} onClose={() => !twoPlusOneLoading && setTwoPlusOneOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add 2+1 Promotion (Buy 2 Get 1 Free)</DialogTitle>
        <DialogContent>
          {twoPlusOneError && <Alert severity="error" sx={{ mb: 2 }}>{twoPlusOneError}</Alert>}
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={twoPlusOneForm.title}
            onChange={e => setTwoPlusOneForm(f => ({ ...f, title: e.target.value }))}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={twoPlusOneForm.description}
            onChange={e => setTwoPlusOneForm(f => ({ ...f, description: e.target.value }))}
          />
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={twoPlusOneForm.startDate}
            onChange={e => setTwoPlusOneForm(f => ({ ...f, startDate: e.target.value }))}
          />
          <TextField
            label="End Date"
            type="date"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={twoPlusOneForm.endDate}
            onChange={e => setTwoPlusOneForm(f => ({ ...f, endDate: e.target.value }))}
          />
          <ProductSelector
            value={twoPlusOneForm.productIds}
            onChange={(productIds) => setTwoPlusOneForm(f => ({ ...f, productIds }))}
            label="Products"
            placeholder="Search and select products for 2+1 offer..."
            error={!!twoPlusOneError}
            helperText={twoPlusOneError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTwoPlusOneOpen(false)} disabled={twoPlusOneLoading}>
            Cancel
          </Button>
          <Button onClick={handleTwoPlusOne} variant="contained" disabled={twoPlusOneLoading}>
            {twoPlusOneLoading ? 'Saving...' : 'Save 2+1 Promotion'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recommended Products Dialog */}
      <Dialog open={recommendedOpen} onClose={() => !recommendedLoading && setRecommendedOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Set Recommended Products</DialogTitle>
        <DialogContent>
          {recommendedError && <Alert severity="error" sx={{ mb: 2 }}>{recommendedError}</Alert>}
          <ProductSelector
            value={recommendedForm.productIds}
            onChange={(productIds) => setRecommendedForm(f => ({ ...f, productIds }))}
            label="Products"
            placeholder="Search and select products to set as recommended..."
            error={!!recommendedError}
            helperText={recommendedError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecommendedOpen(false)} disabled={recommendedLoading}>
            Cancel
          </Button>
          <Button onClick={handleSetRecommendedProducts} variant="contained" disabled={recommendedLoading}>
            {recommendedLoading ? 'Saving...' : 'Set Recommended Products'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 