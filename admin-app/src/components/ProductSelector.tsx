import React, { useState, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  Box,
  CircularProgress,
  Avatar,
  Typography
} from '@mui/material';
import client from '../api/client';

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
}

interface ProductSelectorProps {
  value: number[];
  onChange: (productIds: number[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string | null;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  value,
  onChange,
  label = 'Products',
  placeholder = 'Search and select products...',
  disabled = false,
  error = false,
  helperText
}) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all products when component mounts
  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await client.get('/products', { params: { limit: 1000 } });
      
      // Handle the backend response structure
      let productsData: Product[] = [];
      if (response.data && response.data.products) {
        productsData = response.data.products;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data && response.data.data) {
        productsData = response.data.data;
      }
      
      console.log('Fetched all products:', productsData);
      setAllProducts(productsData);
      setSearchResults(productsData); // Initially show all products
    } catch (error) {
      console.error('Error fetching all products:', error);
      setAllProducts([]);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSearchResults = useCallback(async (search?: string) => {
    if (!search || search.trim().length < 2) {
      setSearchResults(allProducts); // Show all products if search is empty or too short
      return;
    }

    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (search && search.trim()) {
        params.search = search.trim();
      }
      const response = await client.get('/products', { params });
      
      // Handle the backend response structure
      let productsData: Product[] = [];
      if (response.data && response.data.products) {
        productsData = response.data.products;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data && response.data.data) {
        productsData = response.data.data;
      }
      
      console.log('Search results:', productsData);
      setSearchResults(productsData);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [allProducts]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('Search term:', searchTerm, 'Length:', searchTerm.length);
      if (searchTerm.length >= 2) {
        console.log('Fetching search results for:', searchTerm);
        fetchSearchResults(searchTerm);
      } else if (searchTerm.length === 0) {
        console.log('Showing all products');
        setSearchResults(allProducts);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchSearchResults, allProducts]);

  const handleSearchChange = (event: React.SyntheticEvent, newValue: string) => {
    setSearchTerm(newValue);
  };

  const handleSelectionChange = (event: React.SyntheticEvent, newValue: Product[]) => {
    const productIds = newValue.map(product => product.id);
    onChange(productIds);
  };

  // Get selected products for display (from all products, not just search results)
  const selectedProducts = allProducts.filter(product => value.includes(product.id));
  
  console.log('ProductSelector state:', {
    allProducts: allProducts.length,
    searchResults: searchResults.length,
    selectedProducts: selectedProducts.length,
    searchTerm,
    loading
  });

  return (
    <Autocomplete
      multiple
      options={searchResults}
      getOptionLabel={(option) => option.name}
      value={selectedProducts}
      onChange={handleSelectionChange}
      onInputChange={handleSearchChange}
      inputValue={searchTerm}
      loading={loading}
      disabled={disabled}
      selectOnFocus
      clearOnBlur={false}
      handleHomeEndKeys
      openOnFocus
      autoHighlight
      noOptionsText="No products found"
      loadingText="Loading products..."
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => {
        console.log('Rendering option:', option);
        return (
          <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {option.imageUrl && (
              <Avatar
                src={option.imageUrl}
                alt={option.name}
                sx={{ width: 32, height: 32 }}
              />
            )}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {option.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ${option.price}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={option.name}
            size="small"
            avatar={option.imageUrl ? (
              <Avatar src={option.imageUrl} alt={option.name} />
            ) : undefined}
          />
        ))
      }
      isOptionEqualToValue={(option, value) => option.id === value.id}
    />
  );
}; 