import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, Modal, Pressable, ScrollView } from 'react-native';
import { useCart } from '../context/CartContext';
import { dataService } from '../services/dataService';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

const CheckoutScreen = ({ navigation }) => {
  const { getCartItemsWithPricing, getCartTotal, clearCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [comment, setComment] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    const fetchAddresses = async () => {
      setLoadingAddresses(true);
      const result = await dataService.addresses.getAll();
      if (result.success && result.data.length > 0) {
        setAddresses(result.data);
        const defaultAddr = result.data.find(a => a.isDefault) || result.data[0];
        setSelectedAddressId(defaultAddr.id);
        setStreet(defaultAddr.street || '');
        setHouseNumber(defaultAddr.houseNumber || '');
        setDistrict(defaultAddr.district || '');
      }
      setLoadingAddresses(false);
    };
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (addresses.length > 0 && selectedAddressId) {
      const addr = addresses.find(a => a.id === selectedAddressId);
      if (addr) {
        setStreet(addr.street || '');
        setHouseNumber(addr.houseNumber || '');
        setDistrict(addr.district || '');
      }
    }
  }, [selectedAddressId]);

  const cartItems = getCartItemsWithPricing();
  const subtotal = getCartTotal();
  const deliveryFee = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!street.trim() || !houseNumber.trim() || !district.trim()) {
      Alert.alert('Address Required', 'Please enter street, house number, and district.');
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }
    
    setPlacingOrder(true);
    try {
      console.log('Starting order placement...');
      console.log('Cart items:', cartItems);
      console.log('Cart items with pricing details:');
      cartItems.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          id: item.id,
          name: item.product?.name,
          quantity: item.quantity,
          originalPrice: item.originalPrice,
          finalPrice: item.finalPrice,
          promotionalPrice: item.promotionalPrice,
          savings: item.savings,
          totalPrice: item.totalPrice,
          hasPromotion: !!item.product?.promotion,
          promotionType: item.product?.promotion?.type
        });
      });
      console.log('Address:', { street, houseNumber, district });
      console.log('Payment method:', paymentMethod);
      console.log('Total:', total);
      
      const addressString = `${street}, ${houseNumber}, ${district}`;
      const orderData = {
        items: cartItems.map(item => {
          if (item.type === 'box') {
            return {
              boxId: Number(item.id),
              quantity: item.quantity,
              price: item.finalPrice,
              itemType: 'box',
              boxTitle: item.product?.title || item.product?.name,
              boxDescription: item.product?.description,
              boxProducts: item.product?.products || []
            };
          } else {
            return {
              productId: Number(item.id),
              quantity: item.quantity,
              price: item.finalPrice,
              itemType: 'product'
            };
          }
        }),
        deliveryAddress: addressString,
        comment: comment || '',
        paymentMethod: paymentMethod || 'cash',
        totalAmount: total || 0,
      };
      console.log('Order data being sent:', JSON.stringify(orderData, null, 2));
      
      const result = await dataService.orders.create(orderData);
      console.log('Order creation result:', result);
      
      if (result && result.success) {
        clearCart();
        setSuccessModalVisible(true);
      } else {
        const errorMessage = result?.error?.message || result?.error || 'Failed to place order.';
        console.error('Order failed:', errorMessage);
        Alert.alert('Order Failed', errorMessage);
      }
    } catch (error) {
      console.error('Order placement error:', error);
      Alert.alert('Order Failed', 'An error occurred. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };



  // Address Card UI
  const renderAddressCard = () => {
    const addr = addresses.find(a => a.id === selectedAddressId);
    if (!addr) return null;
    return (
      <View style={styles.addressCard}>
        <Text style={styles.addressCardTitle}>{addr.name || 'Address'}</Text>
        <View style={styles.addressFieldsContainer}>
          <View style={styles.addressField}>
            <Text style={styles.addressFieldLabel}>Street</Text>
            <Text style={styles.addressFieldValue}>{addr.street}</Text>
          </View>
          <View style={styles.addressField}>
            <Text style={styles.addressFieldLabel}>House Number</Text>
            <Text style={styles.addressFieldValue}>{addr.houseNumber}</Text>
          </View>
          <View style={styles.addressField}>
            <Text style={styles.addressFieldLabel}>District</Text>
            <Text style={styles.addressFieldValue}>{addr.district}</Text>
          </View>
        </View>
        <Pressable style={styles.changeBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.changeBtnText}>Change Address</Text>
        </Pressable>
      </View>
    );
  };

  // Modal for address selection
  const renderAddressModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Address</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            {addresses.map(addr => (
              <Pressable
                key={addr.id}
                style={[styles.modalAddressItem, addr.id === selectedAddressId && styles.modalAddressItemSelected]}
                onPress={() => {
                  setSelectedAddressId(addr.id);
                  setModalVisible(false);
                }}
              >
                <View style={styles.modalAddressContent}>
                  <Text style={styles.modalAddressName}>{addr.name}</Text>
                  <View style={styles.modalAddressFields}>
                    <Text style={styles.modalAddressText}>Street: {addr.street}</Text>
                    <Text style={styles.modalAddressText}>Number: {addr.houseNumber}</Text>
                    <Text style={styles.modalAddressText}>District: {addr.district}</Text>
                  </View>
                </View>
                {addr.id === selectedAddressId && <Text style={styles.selectedMark}>✓</Text>}
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  // Success Modal
  const renderSuccessModal = () => (
    <Modal
      visible={successModalVisible}
      animationType="fade"
      transparent
      onRequestClose={() => setSuccessModalVisible(false)}
    >
      <View style={styles.successModalOverlay}>
        <View style={styles.successModalContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4BB543" />
          </View>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSubtitle}>
            Thank you for your purchase. Your order has been submitted successfully.
          </Text>
          <Pressable 
            style={styles.successButton} 
            onPress={() => {
              setSuccessModalVisible(false);
              // Reset navigation to MainTabs, closing all screens in the stack
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }}
          >
            <Text style={styles.successButtonText}>Go Back Home</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        {loadingAddresses ? (
          <ActivityIndicator style={{ marginVertical: 20 }} />
        ) : addresses.length > 0 ? (
          <>
            <View style={styles.addressForm}>
              <View style={styles.formField}>
                <Text style={styles.inputLabel}>Street Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter street name"
                  value={street}
                  onChangeText={setStreet}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.inputLabel}>House Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter house number"
                  value={houseNumber}
                  onChangeText={setHouseNumber}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.inputLabel}>District</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter district"
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>
            </View>
            <Pressable style={styles.changeBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.changeBtnText}>Select Different Address</Text>
            </Pressable>
            {renderAddressModal()}
            {renderSuccessModal()}
          </>
        ) : (
          <View style={styles.addressForm}>
            <View style={styles.formField}>
              <Text style={styles.inputLabel}>Street Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter street name"
                value={street}
                onChangeText={setStreet}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.inputLabel}>House Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter house number"
                value={houseNumber}
                onChangeText={setHouseNumber}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.inputLabel}>District</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter district"
                value={district}
                onChangeText={setDistrict}
              />
            </View>
          </View>
        )}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>{deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Comment</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment (optional)"
          value={comment}
          onChangeText={setComment}
          multiline
        />
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentContainer}>
          <Pressable 
            style={[
              styles.paymentOption, 
              paymentMethod === 'cash' && styles.paymentOptionSelected
            ]}
            onPress={() => setPaymentMethod('cash')}
          >
            <View style={styles.paymentOptionContent}>
              <Ionicons 
                name="cash-outline" 
                size={20} 
                color={paymentMethod === 'cash' ? '#2ecc71' : '#666'} 
              />
              <View style={styles.paymentOptionText}>
                <Text style={[
                  styles.paymentOptionTitle,
                  paymentMethod === 'cash' && styles.paymentOptionTitleSelected
                ]}>
                  Cash on Delivery
                </Text>
                <Text style={styles.paymentOptionSubtitle}>
                  Pay with cash when your order arrives
                </Text>
              </View>
            </View>
            {paymentMethod === 'cash' && (
              <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
            )}
          </Pressable>
          
          <Pressable 
            style={[
              styles.paymentOption, 
              paymentMethod === 'card' && styles.paymentOptionSelected
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentOptionContent}>
              <Ionicons 
                name="card-outline" 
                size={20} 
                color={paymentMethod === 'card' ? '#2ecc71' : '#666'} 
              />
              <View style={styles.paymentOptionText}>
                <Text style={[
                  styles.paymentOptionTitle,
                  paymentMethod === 'card' && styles.paymentOptionTitleSelected
                ]}>
                  Card on Delivery
                </Text>
                <Text style={styles.paymentOptionSubtitle}>
                  Pay with card when your order arrives
                </Text>
              </View>
            </View>
            {paymentMethod === 'card' && (
              <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
            )}
          </Pressable>
        </View>
        <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder} disabled={placingOrder}>
          {placingOrder ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeOrderText}>Place Order</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  addressCard: {
    backgroundColor: '#f7f9f8',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addressCardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  addressCardText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  changeBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#2ecc71',
    borderRadius: 6,
  },
  changeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  addressForm: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 4,
    backgroundColor: '#fafafa',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#555',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#f5f5f5',
    minHeight: 60,
    marginBottom: 10,
  },
  paymentPlaceholder: {
    color: '#888',
    marginBottom: 20,
  },
  placeOrderBtn: {
    backgroundColor: '#2ecc71',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalAddressItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalAddressItemSelected: {
    backgroundColor: '#e8f5e9',
  },
  modalAddressContent: {
    flex: 1,
  },
  modalAddressName: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  modalAddressFields: {
    marginTop: 4,
  },
  modalAddressText: {
    fontSize: 15,
    color: '#333',
  },
  selectedMark: {
    color: '#2ecc71',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalCloseBtn: {
    marginTop: 16,
    backgroundColor: '#2ecc71',
    borderRadius: 6,
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  addressFieldsContainer: {
    marginBottom: 8,
  },
  addressField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addressFieldLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: 'bold',
  },
  addressFieldValue: {
    fontSize: 14,
    color: '#333',
  },
  formField: {
    marginBottom: 10,
  },
  paymentContainer: {
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  paymentOptionSelected: {
    borderColor: '#2ecc71',
    borderWidth: 2,
    backgroundColor: '#f0fff4',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentOptionTitleSelected: {
    color: '#2ecc71',
  },
  paymentOptionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  successButton: {
    backgroundColor: '#4BB543',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen; 