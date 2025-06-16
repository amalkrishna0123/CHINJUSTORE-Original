// DeliveryLogin.jsx
import React, { useState } from 'react';
import { User, Phone } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import { useNavigate } from 'react-router-dom';

const DeliveryLogin = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleDeliveryLogin = async (e) => {
    e.preventDefault();
    // setError('');
    // setLoading(true);

    try {
      if (!name || !phone) {
        // setError('Please enter name and phone number');
        return;
      }

      const deliveryBoysRef = collection(db, 'deliveryBoys');
      const querySnapshot = await getDocs(deliveryBoysRef);
      const deliveryBoy = querySnapshot.docs.find(
        (doc) => doc.data().name === name && doc.data().phone === phone
      );

      if (deliveryBoy && deliveryBoy.data().status === 'active') {
        localStorage.setItem('isDelivery', 'true');
        localStorage.setItem('deliveryName', name);
        localStorage.setItem('deliveryPhone', phone);
        localStorage.setItem('deliveryBoyId', deliveryBoy.id);
        navigate('/delivery-dashboard', { replace: true });
      } else if (deliveryBoy && deliveryBoy.data().status !== 'active') {
        // setError('Your account is currently inactive. Please contact admin.');
      } else {
        // setError('Invalid credentials. Please check your name and phone number.');
      }
    } catch (error) {
      console.error('Login error:', error);
    //   setError('Failed to login. Please try again.');
    }

    // setLoading(false);
  };

  return (
    <form onSubmit={handleDeliveryLogin} className="space-y-6 w-full flex flex-col justify-center items-center px-2 min-h-screen">
      <div className="space-y-4 w-full">
        <div className="relative w-full">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
            placeholder="Your Name"
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
            placeholder="Phone Number"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
      >
        Sign in as Delivery
      </button>
    </form>
  );
};

export default DeliveryLogin;
