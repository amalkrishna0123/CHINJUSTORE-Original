import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ShoppingBag, Package, Truck, CheckCircle, Search, ChevronDown, ShoppingCart, X, Minus, Plus, Trash, Star } from 'lucide-react';
import { CgProfile } from "react-icons/cg";
import { FcGoogle } from 'react-icons/fc';
import { MdLogin } from "react-icons/md";
import { VscAccount } from "react-icons/vsc";
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import { IoIosArrowRoundForward } from "react-icons/io";
import apple from '../assets/apple.jpeg';

const Orders = () => {
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState({
    address: 'Select your location',
    deliveryTime: '-- mins'
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const navigate = useNavigate();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);

  // Fetch orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser?.uid) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const ordersRef = collection(db, 'orders');
        let ordersData = [];
        
        try {
          const q = query(
            ordersRef,
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          ordersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toLocaleDateString() || new Date().toLocaleDateString()
          }));
        } catch (indexError) {
          console.log("Index not yet ready, falling back to basic query");
          
          const basicQuery = query(
            ordersRef,
            where('userId', '==', currentUser.uid)
          );
          
          const querySnapshot = await getDocs(basicQuery);
          ordersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toLocaleDateString() || new Date().toLocaleDateString()
          }));
          
          ordersData.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
          });
        }

        setOrders(ordersData);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  // Load cart items
  useEffect(() => {
    if (currentUser?.cartItems) {
      setCartItems(currentUser.cartItems);
    } else {
      setCartItems([]);
    }
  }, [currentUser]);

  // Cart functions
  const addToCart = async (product) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    try {
      const updatedItems = [...cartItems];
      const existingItemIndex = updatedItems.findIndex(
        (item) => item.id === product.id
      );

      if (existingItemIndex >= 0) {
        updatedItems[existingItemIndex].quantity += 1;
      } else {
        const productToAdd = {
          id: product.id,
          name: product.name,
          originalPrice: product.originalPrice,
          salePrice: product.salePrice,
          offer: product.offer,
          category: product.category,
          imageBase64: product.imageBase64,
          quantity: 1,
          addedAt: new Date().toISOString(),
        };
        updatedItems.push(productToAdd);
      }

      await updateDoc(doc(db, "users", currentUser.uid), {
        cartItems: updatedItems,
      });

      setCartItems(updatedItems);
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  };

  const removeItem = async (itemId) => {
    if (!currentUser) return;

    try {
      const updatedItems = cartItems.filter((item) => item.id !== itemId);
      await updateDoc(doc(db, "users", currentUser.uid), {
        cartItems: updatedItems,
      });
      setCartItems(updatedItems);
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const updateItemQuantity = async (itemId, newQuantity) => {
    if (!currentUser || newQuantity < 1) return;

    try {
      const updatedItems = cartItems.map((item) => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      
      await updateDoc(doc(db, "users", currentUser.uid), {
        cartItems: updatedItems,
      });
      
      setCartItems(updatedItems);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  // Review functions
  const handleAddReview = (order) => {
    setSelectedOrder(order);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async ({ rating, reviewText, order }) => {
    if (!order || !reviewText.trim() || rating === 0) {
      alert("Please provide both rating and review text");
      return;
    }

    try {
      const reviewData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        userEmail: currentUser.email,
        orderId: order.id,
        productId: order.items[0]?.id || "unknown",
        productName: order.items[0]?.name || "Product",
        rating,
        text: reviewText.trim(),
        createdAt: new Date(),
        isVerifiedPurchase: true,
      };

      await addDoc(collection(db, "reviews"), reviewData);
      await updateDoc(doc(db, "orders", order.id), {
        hasReview: true,
        reviewedAt: new Date(),
      });

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, hasReview: true } : o))
      );

      setShowReviewModal(false);
      setSelectedOrder(null);
      alert("Thank you for your review!");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  // Location functions
  const fetchCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            setUserLocation({
              address: `Location detected (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              deliveryTime: '9 mins'
            });
            
            if (currentUser?.uid) {
              await updateDoc(doc(db, 'users', currentUser.uid), {
                location: {
                  address: `Location detected (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
                  coordinates: {
                    lat: latitude,
                    lng: longitude
                  }
                }
              });
            }
          } catch (error) {
            console.error('Error setting location:', error);
            alert("Could not detect your precise location. Using default address.");
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert("Location permission denied. Please allow location access to use this feature.");
          setIsLoadingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    if (currentUser?.location?.address) {
      setUserLocation({
        address: currentUser.location.address,
        deliveryTime: '9 mins'
      });
    }
  }, [currentUser]);

  // Auth functions
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setShowLoginModal(false);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    setShowUserDropdown(false);
    setCartItems([]);
  };

  const handleCartClick = () => {
    if (!currentUser) {
      setShowLoginModal(true);
    } else {
      setShowCart(true);
    }
  };

  // Components
  const UserProfile = () => (
    <div className="relative">
      <div 
        onClick={() => setShowUserDropdown(!showUserDropdown)}
        className="flex items-center space-x-2 cursor-pointer group"
      >
        {currentUser?.photoURL ? (
          <img 
            src={currentUser.photoURL} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border-2 border-gray-200"
          />
        ) : (
          <CgProfile className="text-2xl text-gray-700 group-hover:text-blue-600 transition-colors" />
        )}
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Hello,</span>
          <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">
            {currentUser?.displayName || "My Account"}
          </span>
        </div>
        <ChevronDown size={16} className="text-gray-500" />
      </div>
      
      {showUserDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-100">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-semibold">{currentUser?.displayName}</p>
            <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
          </div>
          <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            My Profile
          </Link>
          <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            My Orders
          </Link>
          <Link to="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Wishlist
          </Link>
          <button 
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );

  const LoginModal = () => {
    if (!showLoginModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-[#39B2A7] bg-opacity-90 rounded-xl w-full max-w-md shadow-xl p-6 transform transition-all border-t-4 border-[#2e978e]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              Sign in to Chinju Store
            </h2>
            <button
              onClick={() => setShowLoginModal(false)}
              className="text-white hover:text-gray-700 bg-gray-100 rounded-full p-2 w-8 h-8 flex items-center justify-center transition-colors"
            >
              ✖
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#65D2CD] flex items-center justify-center mb-4">
              <VscAccount className="text-white text-3xl" />
            </div>

            <p className="text-center text-white mb-6">
              Sign in to access your cart, save favorites, and check out faster!
            </p>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 border hover:text-black border-white rounded-lg py-3.5 px-4 text-white hover:bg-white transition duration-200 mb-4 shadow-sm"
            >
              <FcGoogle size={24} />
              <span className="font-medium">Continue with Google</span>
            </button>

            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full text-white border border-white py-3 rounded-lg hover:bg-white hover:text-black hover:bg-opacity-10 transition duration-200 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Cart = () => {
    if (!showCart) return null;

    const calculateTotal = () => {
      return cartItems.reduce(
        (total, item) => total + item.salePrice * item.quantity,
        0
      );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center md:justify-end">
        <div className="w-full md:w-1/3 lg:w-1/4 h-full bg-white shadow-lg flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Your Cart {cartItems.length > 0 ? `(${cartItems.length})` : ""}
            </h2>
            <button
              onClick={() => setShowCart(false)}
              className="text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full p-2"
            >
              <X size={18} />
            </button>
          </div>

          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <ShoppingCart size={24} />
              </div>
              <p className="text-center text-gray-600 mb-6">
                Your cart is empty
              </p>
              <button
                onClick={() => setShowCart(false)}
                className="w-full bg-[#1a7e74] text-white py-3 rounded-lg hover:bg-[#145f5a] transition duration-200"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center py-4 border-b border-gray-100"
                  >
                    <img
                      src={item.imageBase64 || apple}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="ml-4 flex-1">
                      <h4 className="text-sm font-medium text-gray-800">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500">{item.weight}</p>
                      <div className="flex items-center mt-2">
                        <span className="font-semibold text-gray-900">
                          ₹{item.salePrice || item.originalPrice}
                        </span>
                        {item.originalPrice && (
                          <span className="text-gray-400 text-xs line-through ml-2">
                            ₹{item.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 mb-2"
                      >
                        <Trash size={16} />
                      </button>
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button 
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-gray-500 hover:text-blue-600"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-2 text-gray-800">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-gray-500 hover:text-blue-600"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 p-4">
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{calculateTotal()}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-semibold">₹40</span>
                </div>
                <div className="flex justify-between mb-4 pb-4 border-b border-gray-100">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-semibold text-green-600">-₹0</span>
                </div>
                <div className="flex justify-between mb-6">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold">
                    ₹{calculateTotal() + 40}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setShowCart(false);
                    navigate('/checkout', { state: { cartItems } });
                  }}
                  className="w-full bg-[#1a7e74] text-white py-3 rounded-lg hover:bg-[#145f5a] transition duration-200"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const ReviewModal = ({ isOpen, onClose, onSubmit, order }) => {
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(0);
  
    if (!isOpen || !order) return null;
  
    const handleChange = (e) => setReviewText(e.target.value);
  
    const handleSubmit = () => {
      if (rating > 0 && reviewText.trim().length >= 10) {
        onSubmit({ rating, reviewText, order });
      }
    };
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Write a Review</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={20} />
            </button>
          </div>
  
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Order #{order.id.slice(0, 8)}</h4>
            <div className="flex items-center gap-3">
              {order.items && order.items[0] && (
                <>
                  <img
                    src={order.items[0].imageBase64 || apple}
                    alt={order.items[0].name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="text-sm font-medium">{order.items[0].name}</p>
                    <p className="text-xs text-gray-500">
                      {order.items.length > 1 ? `and ${order.items.length - 1} more items` : ""}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
  
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your experience *
            </label>
            <textarea
              value={reviewText}
              onChange={handleChange}
              className="w-full min-h-[100px] border border-gray-300 rounded-lg p-3 resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell us about your experience..."
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">{reviewText.length}/500 characters</span>
              {reviewText.length > 0 && reviewText.length < 10 && (
                <span className="text-xs text-red-500">Please write at least 10 characters</span>
              )}
            </div>
          </div>
  
          <div className="mb-6">
            <div className="flex justify-center space-x-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1 transition-colors hover:scale-110 transform ${
                    rating >= star ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                  }`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
            </div>
            <div className="text-center text-sm text-gray-500">
              {rating === 0 && "Select a rating"}
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </div>
          </div>
  
          <div className="flex justify-end space-x-3">
            <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!rating || reviewText.trim().length < 10}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Star size={16} className="mr-1" /> Submit Review
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Gradient top bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1"></div>

      {/* Header - Desktop View */}
      <div className="hidden md:block bg-white py-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="text-blue-600 text-3xl font-bold flex items-center commonFont"
            >
              Chinju Store
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium ml-3">
                SUPER SAVER
              </span>
            </Link>
          </div>

          {/* Login and Cart */}
          <div className="flex items-center space-x-6">
            {currentUser ? (
              <UserProfile />
            ) : (
              <div
                className="flex items-center space-x-2 cursor-pointer group"
                onClick={() => setShowLoginModal(true)}
              >
                <CgProfile className="text-2xl text-gray-700 group-hover:text-blue-600 transition-colors" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Sign in</span>
                  <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                    My Account
                  </span>
                </div>
              </div>
            )}
            <div
              className="flex items-center space-x-2 cursor-pointer group"
              onClick={handleCartClick}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-md relative">
                <ShoppingCart className="text-xl text-[#1a7e74]" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Your</span>
                <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                  Cart
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-[#65D2CD] to-[#2CAA9E] p-4">
        {/* Logo Section */}
        <div className="flex justify-between items-center mb-4">
          <Link
            to="/"
            className="bg-white text-[#1a7e74] px-4 py-2 rounded-lg font-bold text-md shadow-md LogoFont"
          >
            Chinju Store
          </Link>
          <div className="flex space-x-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-md"
              onClick={() => !currentUser && setShowLoginModal(true)}
            >
              {currentUser && currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                />
              ) : (
                <CgProfile className="text-xl text-[#1a7e74]" />
              )}
            </div>
            {/* <div
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-md relative"
              onClick={handleCartClick}
            >
              <ShoppingCart className="text-xl text-[#1a7e74]" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </div> */}
          </div>
        </div>

        {/* Mobile User Dropdown */}
        {showUserDropdown && currentUser && (
          <div className="absolute right-4 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 border border-gray-100">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-semibold">
                {currentUser?.displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUser?.email}
              </p>
            </div>
            <Link
              to="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              My Profile
            </Link>
            <Link
              to="/orders"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              My Orders
            </Link>
            <Link
              to="/wishlist"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Wishlist
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}

        {/* Delivery Info */}
        {/* <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-4 backdrop-blur-sm flex items-center">
          <div className="flex flex-col flex-1">
            <div className="text-white font-bold flex items-center">
              <span className="mr-2">
                Delivery in {userLocation.deliveryTime}
              </span>
              <span className="bg-white text-[#1a7e74] text-xs px-2 py-0.5 rounded-full">
                FAST
              </span>
            </div>
            <div className="flex items-center text-sm text-white">
              <span>{userLocation.address}</span>
              <ChevronDown size={14} className="ml-1" />
            </div>
          </div>
          <button
            onClick={fetchCurrentLocation}
            disabled={isLoadingLocation}
            className="bg-white px-3 py-1 rounded-lg text-[#1a7e74] font-medium text-sm"
          >
            {isLoadingLocation ? "Loading..." : "Change"}
          </button>
        </div> */}
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 mt-6 commonFont">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-gray-500 hover:text-blue-500">
            Home
          </Link>
          <div>
            <IoIosArrowRoundForward className="text-lg" />
          </div>
          <div className="text-gray-800">Orders</div>
        </div>
      </div>

      {/* Orders Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 commonFont">
            My Orders
          </h1>
          <p className="text-gray-600 commonFont text-sm">
            Track and view your order history
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 commonFont">
              No orders
            </h3>
            <p className="mt-1 text-sm text-gray-500 commonFont">
              Start shopping to see your orders here.
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#1a7e74] hover:bg-[#145f5a] commonFont"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 commonFont">
                        Order #{order.id.slice(0, 8)}
                      </h2>
                      <p className="text-sm text-gray-500 commonFont">
                        {order.createdAt}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-gray-800 commonFont">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium">
                        Order Status: {order.status || "N/A"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-md font-medium ${
                          order.deliveryStatus?.toLowerCase() === "delivered"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        Delivery Status: {order.deliveryStatus || "Pending"}
                      </span>
                    </div>

                    {(order.deliveryStatus === "Delivered" ||
                      order.deliveryStatus === "delivered") &&
                      !order.hasReview && (
                        <button
                          onClick={() => handleAddReview(order)}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 commonFont"
                        >
                          <Star size={16} />
                          Add Review
                        </button>
                      )}

                    {order.hasReview && (
                      <div className="px-3 py-1 commonFont bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
                        ✓ Review Added
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4 commonFont">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center py-2">
                        <img
                          src={item.imageBase64 || apple}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg mr-3"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-xs font-medium text-gray-900">
                          ₹{item.salePrice * item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4 commonFont">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        Total Amount
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        ₹{order.total}
                      </p>
                    </div>
                  </div>

                  {order.shippingDetails && (
                    <div className="border-t border-gray-200 pt-4 mt-4 commonFont">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Shipping Details
                      </h3>
                      <p className="text-sm text-gray-500">
                        {order.shippingDetails.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.shippingDetails.address}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.shippingDetails.city},{" "}
                        {order.shippingDetails.pincode}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.shippingDetails.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <LoginModal />
      <Cart />
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
        order={selectedOrder}
      />
    </div>
  );
};

export default Orders;