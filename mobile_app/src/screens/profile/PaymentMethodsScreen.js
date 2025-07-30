import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PaymentMethodsScreen = ({ navigation }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock payment methods data - replace with API call
  useEffect(() => {
    const mockPaymentMethods = [
      {
        id: '1',
        type: 'card',
        cardType: 'visa',
        lastFour: '4242',
        expiryMonth: '12',
        expiryYear: '25',
        cardholderName: 'John Doe',
        isDefault: true,
      },
      {
        id: '2',
        type: 'card',
        cardType: 'mastercard',
        lastFour: '8888',
        expiryMonth: '08',
        expiryYear: '26',
        cardholderName: 'John Doe',
        isDefault: false,
      },
      {
        id: '3',
        type: 'paypal',
        email: 'john.doe@example.com',
        isDefault: false,
      },
    ];

    setTimeout(() => {
      setPaymentMethods(mockPaymentMethods);
      setLoading(false);
    }, 1000);
  }, []);

  const setDefaultPayment = (paymentId) => {
    setPaymentMethods(prevMethods =>
      prevMethods.map(method => ({
        ...method,
        isDefault: method.id === paymentId,
      }))
    );
  };

  const deletePaymentMethod = (paymentId) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prevMethods =>
              prevMethods.filter(method => method.id !== paymentId)
            );
          },
        },
      ]
    );
  };

  const getCardIcon = (cardType) => {
    switch (cardType) {
      case 'visa': return 'card-outline';
      case 'mastercard': return 'card-outline';
      case 'amex': return 'card-outline';
      default: return 'card-outline';
    }
  };

  const getCardColor = (cardType) => {
    switch (cardType) {
      case 'visa': return '#1A1F71';
      case 'mastercard': return '#EB001B';
      case 'amex': return '#006FCF';
      default: return '#666';
    }
  };

  const PaymentMethodCard = ({ method }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <View style={styles.paymentNameRow}>
            {method.type === 'card' ? (
              <>
                <View style={[styles.cardIcon, { backgroundColor: getCardColor(method.cardType) + '20' }]}>
                  <Ionicons name={getCardIcon(method.cardType)} size={24} color={getCardColor(method.cardType)} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardType}>
                    {method.cardType.charAt(0).toUpperCase() + method.cardType.slice(1)} •••• {method.lastFour}
                  </Text>
                  <Text style={styles.cardholderName}>{method.cardholderName}</Text>
                  <Text style={styles.expiryDate}>Expires {method.expiryMonth}/{method.expiryYear}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={[styles.paypalIcon, { backgroundColor: '#0070BA' + '20' }]}>
                  <Ionicons name="logo-paypal" size={24} color="#0070BA" />
                </View>
                <View style={styles.paypalInfo}>
                  <Text style={styles.paypalText}>PayPal</Text>
                  <Text style={styles.paypalEmail}>{method.email}</Text>
                </View>
              </>
            )}
          </View>
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <View style={styles.paymentActions}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => console.log('Edit payment method:', method.id)}
          >
            <Ionicons name="create-outline" size={20} color="#53B175" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => deletePaymentMethod(method.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      {!method.isDefault && (
        <TouchableOpacity 
          style={styles.setDefaultBtn}
          onPress={() => setDefaultPayment(method.id)}
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
        <Text style={styles.loadingText}>Loading payment methods...</Text>
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
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color="#B0B0B0" />
            <Text style={styles.emptyTitle}>No payment methods</Text>
            <Text style={styles.emptySubtitle}>
              Add a payment method to make checkout faster
            </Text>
            <TouchableOpacity style={styles.addFirstPaymentBtn}>
              <Text style={styles.addFirstPaymentText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {paymentMethods.map((method) => (
              <PaymentMethodCard key={method.id} method={method} />
            ))}
            
            <TouchableOpacity style={styles.addNewPaymentBtn}>
              <Ionicons name="add-circle-outline" size={24} color="#53B175" />
              <Text style={styles.addNewPaymentText}>Add New Payment Method</Text>
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
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentInfo: {
    flex: 1,
    marginRight: 16,
  },
  paymentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00332A',
    marginBottom: 4,
  },
  cardholderName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  expiryDate: {
    fontSize: 14,
    color: '#666',
  },
  paypalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  paypalInfo: {
    flex: 1,
  },
  paypalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00332A',
    marginBottom: 4,
  },
  paypalEmail: {
    fontSize: 14,
    color: '#666',
  },
  defaultBadge: {
    backgroundColor: '#53B175',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  paymentActions: {
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
  addNewPaymentBtn: {
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
  addNewPaymentText: {
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
  addFirstPaymentBtn: {
    backgroundColor: '#53B175',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  addFirstPaymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PaymentMethodsScreen; 