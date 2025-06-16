import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../Firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { BiCurrentLocation } from "react-icons/bi";
import { MapPin, Plus, Trash, Navigation } from 'lucide-react';

const AddressManager = ({ onSelectAddress, selectedAddressId, hideAddressForm = false }) => {
  const { currentUser } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    type: 'manual' // manual, location, or profile
  });
  const [profileAddress, setProfileAddress] = useState(null);
  const [locationAddress, setLocationAddress] = useState(null);

  // Fetch all addresses including profile and location
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        // 1. Fetch saved addresses from addresses collection
        const addressesRef = collection(db, 'addresses');
        const q = query(addressesRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const addressList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 2. Fetch profile address from user document
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Create profile address if user has address info
          if (userData.address || userData.city || userData.pincode) {
            const profileAddr = {
              id: 'profile',
              fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
              phone: userData.mobile || '',
              address: userData.address || '',
              city: userData.place || userData.city || '',
              pincode: userData.pincode || '',
              type: 'profile',
              createdAt: userData.updatedAt || userData.createdAt || new Date()
            };
            setProfileAddress(profileAddr);
          }

          // Create location address if user has location info
          if (userData.location) {
            const locAddr = {
              id: 'location',
              fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
              phone: userData.mobile || '',
              address: userData.location.address || '',
              city: '', // You might need to extract city from address
              pincode: '', // You might need to extract pincode from address
              type: 'location',
              coordinates: userData.location.coordinates,
              createdAt: userData.location.updatedAt || new Date()
            };
            setLocationAddress(locAddr);
          }
        }

        setAddresses(addressList);
      } catch (error) {
        console.error('Error fetching addresses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [currentUser]);

  // Combine all addresses (saved + profile + location)
  const allAddresses = [
    ...addresses,
    ...(profileAddress ? [profileAddress] : []),
    ...(locationAddress ? [locationAddress] : [])
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Here you would typically call a reverse geocoding API
            // For now we'll just use the coordinates
            const locationAddress = `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;
            
            setNewAddress({
              fullName: currentUser?.displayName || '',
              phone: '',
              address: locationAddress,
              city: '',
              pincode: '',
              type: 'location',
              coordinates: { latitude, longitude }
            });
            
            setShowAddForm(true);
          } catch (error) {
            console.error('Error getting address from coordinates:', error);
            alert('Could not get your address. Please enter manually.');
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Please try again or enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please enter manually.');
    }
  };

  // Add new address
  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const addressData = {
        ...newAddress,
        userId: currentUser.uid,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'addresses'), addressData);
      const newAddressWithId = { id: docRef.id, ...addressData };
      setAddresses(prev => [...prev, newAddressWithId]);
      setShowAddForm(false);
      setNewAddress({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        pincode: '',
        type: 'manual'
      });
    } catch (error) {
      console.error('Error adding address:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete address
  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'addresses', addressId));
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    } catch (error) {
      console.error('Error deleting address:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Address List */}
      <div className="space-y-4">
        {allAddresses.map((address) => (
          <div
            key={address.id}
            className={`border rounded-lg p-4 cursor-pointer ${selectedAddressId === address.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            onClick={() => onSelectAddress && onSelectAddress(address)}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{address.fullName || 'No name'}</p>
                  {address.type === 'profile' && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Profile</span>
                  )}
                  {address.type === 'location' && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Location</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{address.phone}</p>
                <p className="text-sm text-gray-600">{address.address}</p>
                <p className="text-sm text-gray-600">{address.city} {address.pincode && `- ${address.pincode}`}</p>
              </div>
              {address.type === 'manual' && !hideAddressForm && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAddress(address.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Address Form */}
      {!hideAddressForm && (
        !showAddForm ? (
          <div className="flex justify-between">
            <button
              onClick={getCurrentLocation}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fff] shadow-sm border border-[#0000000a] text-green-600 hover:text-green-700"
            >
              <BiCurrentLocation size={20} />
              Current
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fff] shadow-sm border border-[#0000000a] text-blue-600 hover:text-blue-700"
            >
              <Plus size={20} />
              Add New
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddAddress} className="space-y-4 border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={newAddress.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={newAddress.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={newAddress.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={newAddress.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  name="pincode"
                  required
                  value={newAddress.pincode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        )
      )}
    </div>
  );
};

export default AddressManager;