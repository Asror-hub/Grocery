import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { getSettings, updateSettings, ShopSettings } from '../api/settings';
import { useAppSelector } from '../hooks/useRedux';

export const SettingsPage: React.FC = () => {
  const { token } = useAppSelector((state) => state.auth);
  const [settings, setSettings] = useState<ShopSettings>({
    emailNotifications: true,
    pushNotifications: false,
    orderUpdates: true,
    marketingEmails: false,
    storeName: 'My Grocery Store',
    storeEmail: 'store@example.com',
    storePhone: '+1234567890',
    storeAddress: '123 Main St, City, Country',
    currency: 'USD',
    taxRate: '8.5',
    openingTime: '07:00',
    closingTime: '22:00',
    isOpen24_7: false,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadSettings();
    }
  }, [token]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedSettings = await getSettings();
      setSettings(prev => ({ ...prev, ...fetchedSettings }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load settings';
      setError(errorMessage);
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;
    setSettings({ ...settings, [field]: value });
    setSaved(false);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !saved) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!token) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6" color="text.secondary">
          Please log in to access settings
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={handleChange('emailNotifications')}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={handleChange('pushNotifications')}
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.orderUpdates}
                    onChange={handleChange('orderUpdates')}
                  />
                }
                label="Order Updates"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.marketingEmails}
                    onChange={handleChange('marketingEmails')}
                  />
                }
                label="Marketing Emails"
              />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Store Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Store Name"
                value={settings.storeName}
                onChange={handleChange('storeName')}
                fullWidth
              />
              <TextField
                label="Store Email"
                type="email"
                value={settings.storeEmail}
                onChange={handleChange('storeEmail')}
                fullWidth
              />
              <TextField
                label="Store Phone"
                value={settings.storePhone}
                onChange={handleChange('storePhone')}
                fullWidth
              />
              <TextField
                label="Store Address"
                value={settings.storeAddress}
                onChange={handleChange('storeAddress')}
                fullWidth
                multiline
                rows={2}
              />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Business Settings
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Currency"
                value={settings.currency}
                onChange={handleChange('currency')}
                fullWidth
              />
              <TextField
                label="Tax Rate (%)"
                type="number"
                value={settings.taxRate}
                onChange={handleChange('taxRate')}
                fullWidth
                InputProps={{
                  inputProps: { min: 0, max: 100, step: 0.1 },
                }}
              />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Shop Hours
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.isOpen24_7}
                    onChange={handleChange('isOpen24_7')}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      Keep Shop Open 24/7
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      When enabled, the shop will always be open regardless of time
                    </Typography>
                  </Box>
                }
              />
              {!settings.isOpen24_7 && (
                <>
                  <TextField
                    label="Opening Time"
                    type="time"
                    value={settings.openingTime}
                    onChange={handleChange('openingTime')}
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      step: 300, // 5 min
                    }}
                  />
                  <TextField
                    label="Closing Time"
                    type="time"
                    value={settings.closingTime}
                    onChange={handleChange('closingTime')}
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      step: 300, // 5 min
                    }}
                  />
                </>
              )}
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            type="submit" 
            variant="contained" 
            size="large"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}; 