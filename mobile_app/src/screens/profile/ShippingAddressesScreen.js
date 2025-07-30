import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ShippingAddressesScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock addresses data - replace with API call
  useEffect(() => {
    const mockAddresses = [
      {
        id: '1',
        name: 'Home',
        fullName: 'John Doe',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '+1 (555) 123-4567',
        isDefault: true,
      },
      {
        id: '2',
        name: 'Office',
        fullName: 'John Doe',
        address: '456 Business Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        phone: '+1 (555) 123-4567',
        isDefault: false,
      },
      {
        id: '3',
        name: 'Summer House',
        fullName: 'John Doe',
        address: '789 Beach Road',
        city: 'Miami',
        state: 'FL',
        zipCode: '33101',
        phone: '+1 (555) 123-4567',
        isDefault: false,
      },
    ];

    setTimeout(() => {
      setAddresses(mockAddresses);
      setLoading(false);
    }, 1000);
  }, []);

  const setDefaultAddress = (addressId) => {
    setAddresses(prevAddresses =>
      prevAddresses.map(address => ({
        ...address,
        isDefault: address.id === addressId,
      }))
    );
  };

  const deleteAddress = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAddresses(prevAddresses =>
              prevAddresses.filter(address => address.id !== addressId)
            );
          },
        },
      ]
    );
  };

  const AddressCard = ({ address }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressInfo}>
          <View style={styles.addressNameRow}>
            <Text style={styles.addressName}>{address.name}</Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.fullName}>{address.fullName}</Text>
          <Text style={styles.addressText}>
            {address.address}, {address.city}, {address.state} {address.zipCode}
          </Text>
          <Text style={styles.phoneText}>{address.phone}</Text>
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => console.log('Edit address:', address.id)}
          >
            <Ionicons name="create-outline" size={20} color="#53B175" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => deleteAddress(address.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      {!address.isDefault && (
        <TouchableOpacity 
          style={styles.setDefaultBtn}
          onPress={() => setDefaultAddress(address.id)}
        >
          <Text style={styles.setDefaultText}>Set as Default</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#53B175" />
        <Text style={styles.loadingText}>Loading addresses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Addresses</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#B0B0B0" />
            <Text style={styles.emptyTitle}>No addresses found</Text>
            <Text style={styles.emptySubtitle}>
              Add your first shipping address to get started
            </Text>
            <TouchableOpacity style={styles.addFirstAddressBtn}>
              <Text style={styles.addFirstAddressText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {addresses.map((address) => (
              <AddressCard key={address.id} address={address} />
            ))}
            
            <TouchableOpacity style={styles.addNewAddressBtn}>
              <Ionicons name="add-circle-outline" size={24} color="#53B175" />
              <Text style={styles.addNewAddressText}>Add New Address</Text>
            </TouchableOpacity>
          </>
        )}
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F8',
  },
  header: {
    backgroundColor: '#00332A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addBtn: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addressInfo: {
    flex: 1,
    marginRight: 16,
  },
  addressNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00332A',
    marginRight: 12,
  },
  defaultBadge: {
    backgroundColor: '#53B175',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00332A',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
  },
  addressActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F9F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  setDefaultBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#53B175',
    borderRadius: 12,
    alignItems: 'center',
  },
  setDefaultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  addNewAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addNewAddressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#53B175',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9F8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00332A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstAddressBtn: {
    backgroundColor: '#53B175',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  addFirstAddressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ShippingAddressesScreen; 