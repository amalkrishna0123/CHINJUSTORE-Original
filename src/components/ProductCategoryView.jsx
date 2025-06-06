import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ShoppingCart,
  Heart,
  X,
  Minus,
  Plus,
  Trash,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { FcGoogle } from "react-icons/fc";
import apple from "../assets/apple.jpeg";
import { useAuth } from "./AuthContext";
import { MdLogin } from "react-icons/md";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc
} from "firebase/firestore";
import { db } from "../Firebase";
import { optimizeProductData } from "../utils/imageCompression";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useParams } from "react-router-dom";
import { IoIosArrowRoundForward } from "react-icons/io";
import allproduct from '../assets/allproduct.jpeg'
import { useNavigate } from 'react-router-dom';

const ProductCategoryView = () => {
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { subcategoryName } = useParams(); // Changed from categoryName to subcategoryName
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const navigateToProduct = (productId, event) => {
    // Prevent event from triggering when clicking on buttons inside the card
    if (event.target.closest('button')) return;
    navigate(`/product/${productId}`);
  };
  const [selectedSubcategory, setSelectedSubcategory] = useState(
    decodeURIComponent(subcategoryName)
  );
  const [wishlist, setWishlist] = useState([]);
  const [userLocation, setUserLocation] = useState({
    address: 'Round North, Kodaly, Kerala',
    deliveryTime: '9 mins'
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  // const { subcategoryName } = useParams();
  console.log("URL parameter:", subcategoryName);
  console.log("Decoded subcategory:", decodeURIComponent(subcategoryName));
  
  // useEffect(() => {
  //   const fetchProducts = async () => {
  //     const snapshot = await getDocs(collection(db, "products"));
  //     const productList = snapshot.docs.map(doc => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }));
  //     console.log("First few products:", productList.slice(0, 3));
  //     setProducts(productList);
  //   };
  //   fetchProducts();
  // }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedSubcategory]);

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const productList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Function to get filtered products based on subcategory and search query
  const getFilteredProducts = () => {
    if (!products || !products.length) return [];
    
    let filtered = [...products];
    
    // If "All Products" is selected, show all products
    if (selectedSubcategory === "All Products") {
      return filtered;
    }
    
    // Filter by category
    filtered = filtered.filter(product => {
      // Check all possible category fields
      const categoryFields = [
        product.category,
        product.categoryName,
        product.subCategory,
        product.subCategoryName,
        product.type
      ].filter(Boolean); // Remove undefined/null values
      
      // Normalize strings for comparison
      const normalize = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');
      const targetCategory = normalize(selectedSubcategory);
      
      return categoryFields.some(field => {
        if (!field) return false;
        return normalize(field).includes(targetCategory) || 
               targetCategory.includes(normalize(field));
      });
    });
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product => {
        const searchFields = [
          product.name,
          product.description,
          product.category,
          product.brand
        ].filter(Boolean);
        
        return searchFields.some(field => 
          field.toLowerCase().includes(query)
        );
      });
    }
    
    return filtered;
  };

//   const debugProductData = () => {
//   if (products.length > 0) {
//     console.log("=== PRODUCT DATA DEBUG ===");
//     console.log("Total products:", products.length);
//     console.log("First product:", products[0]);
//     console.log("All category fields in first product:");
    
//     const firstProduct = products[0];
//     Object.keys(firstProduct).forEach(key => {
//       if (key.toLowerCase().includes('categ') || key.toLowerCase().includes('type')) {
//         console.log(`${key}:`, firstProduct[key]);
//       }
//     });
    
//     console.log("Categories found in all products:");
//     const allCategories = new Set();
//     products.forEach(product => {
//       if (product.category) allCategories.add(product.category);
//       if (product.subcategory) allCategories.add(product.subcategory);
//       if (product.categoryName) allCategories.add(product.categoryName);
//       if (product.subCategoryName) allCategories.add(product.subCategoryName);
//     });
//     console.log(Array.from(allCategories));
//   }
// };


useEffect(() => {
  console.log("Current products with categories:", 
    products.map(p => ({
      id: p.id,
      name: p.name,
      categories: {
        category: p.category,
        categoryName: p.categoryName,
        subCategory: p.subCategory,
        subCategoryName: p.subCategoryName
      }
    }))
  );
}, [products]);
  // Fetch categories and subcategories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Separate main and sub categories
        const mainCategories = fetched.filter(cat => cat.type === "main");
        const subCategories = fetched.filter(cat => cat.type === "sub");
        
        // Create a flat list of all subcategories for the selector
        setCategories([
          { id: "all", name: "All Products", imageBase64: allproduct },
          ...subCategories,
        ]);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Load cart and wishlist when user changes
  useEffect(() => {
    if (currentUser?.cartItems) {
      setCartItems(currentUser.cartItems);
    } else {
      setCartItems([]);
    }
    if (currentUser?.wishlist) {
      setWishlist(currentUser.wishlist);
    } else {
      setWishlist([]);
    }
  }, [currentUser]);

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
    setWishlist([]);
  };

  // Cart functions - Updated to match ProductViewAll.jsx
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
        // Create a new product object with only necessary data
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
        
        // Optimize the product data by compressing images
        const optimizedProduct = await optimizeProductData(productToAdd);
        updatedItems.push(optimizedProduct);
      }

      await updateDoc(doc(db, "users", currentUser.uid), {
        cartItems: updatedItems,
      });

      setCartItems(updatedItems);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const removeFromCart = async (productId) => {
    if (!currentUser) return;

    try {
      const updatedItems = cartItems.filter((item) => item.id !== productId);

      await updateDoc(doc(db, "users", currentUser.uid), {
        cartItems: updatedItems,
      });

      setCartItems(updatedItems);
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (!currentUser?.uid) return;

    try {
      const updatedItems = cartItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );

      await updateDoc(doc(db, "users", currentUser.uid), {
        cartItems: updatedItems,
      });

      setCartItems(updatedItems);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (id) => {
    try {
      const updatedItems = cartItems.filter((item) => item.id !== id);

      if (currentUser?.uid) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          cartItems: updatedItems,
        });
      }

      setCartItems(updatedItems);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  // Wishlist functions - Updated to match ProductViewAll.jsx
  const toggleWishlist = async (product) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    try {
      setLoading(true);
      const isInWishlist = wishlist.some((item) => item.id === product.id);

      if (isInWishlist) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          wishlist: arrayRemove(product),
        });
        setWishlist((prev) => prev.filter((item) => item.id !== product.id));
      } else {
        // Create a simplified product object with only necessary data
        const productToAdd = {
          id: product.id,
          name: product.name,
          originalPrice: product.originalPrice,
          salePrice: product.salePrice,
          offer: product.offer,
          category: product.category,
          imageBase64: product.imageBase64,
        };
        
        // Optimize the product data by compressing images
        const optimizedProduct = await optimizeProductData(productToAdd);
        
        await updateDoc(doc(db, "users", currentUser.uid), {
          wishlist: arrayUnion(optimizedProduct),
        });
        setWishlist((prev) => [...prev, optimizedProduct]);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  // Render stars based on rating
  const renderRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400">
            ★
          </span>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="text-yellow-400">
            ★
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-gray-300">
            ★
          </span>
        );
      }
    }

    return <div className="flex text-xs">{stars}</div>;
  };

  // Handle cart click
  const handleCartClick = () => {
    if (!currentUser) {
      setShowLoginModal(true);
    } else {
      setShowCart(true);
    }
  };
  const fetchCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Set a simple location without relying on Google API
            setUserLocation({
              address: `Location detected (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              deliveryTime: '9 mins'
            });
            
            // Save location to user's profile if logged in
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
    const fetchUserLocation = async () => {
      if (currentUser?.uid) {
        setIsLoadingLocation(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().location) {
            setUserLocation(userDoc.data().location);
          }
        } catch (error) {
          console.error('Error fetching user location:', error);
        } finally {
          setIsLoadingLocation(false);
        }
      }
    };

    fetchUserLocation();
  }, [currentUser]);
  // User Profile Component
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
            <p className="text-xs text-gray-500 truncate">
              {currentUser?.email}
            </p>
          </div>
          <a
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            My Profile
          </a>
          <a
            href="/orders"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            My Orders
          </a>
          <a
            href="/wishlist"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Wishlist
          </a>
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

  // Login Modal Component
  const LoginModal = () => {
    if (!showLoginModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg w-full max-w-md shadow-xl p-6 transform transition-all">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Sign in to Zepto
            </h2>
            <button
              onClick={() => setShowLoginModal(false)}
              className="text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full p-2"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <span className="text-2xl">👤</span>
            </div>

            <p className="text-center text-gray-600 mb-6">
              Sign in to access your cart, save favorites, and check out faster!
            </p>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 px-4 text-gray-700 hover:bg-gray-50 transition duration-200 mb-4"
            >
              <FcGoogle size={24} />
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full text-gray-600 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Cart Component
  const Cart = () => {
    if (!showCart) return null;

    const calculateTotal = () => {
      return cartItems.reduce(
        (total, item) => total + item.salePrice * item.quantity,
        0
      );
    };

    return (
      <div className="fixed inset-0 bg-transparent bg-opacity-50 z-50 flex items-center justify-center md:justify-end">
        <div className="w-full md:w-1/4 h-full md:h-screen bg-white md:shadow-lg transform transition-transform duration-300 flex flex-col">
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
                      <span className="font-semibold text-gray-900">₹{item.salePrice || item.originalPrice}</span>

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
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          className="px-2 py-1 text-gray-500 hover:text-blue-600"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-2 text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
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
                onClick={() => navigate('/order-confirm')}
                className="w-full bg-[#1a7e74] text-white py-3 rounded-lg hover:bg-[#145f5a] transition duration-200">
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Get filtered products using the search function
  const filteredProducts = getFilteredProducts();

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
              className="text-blue-600 text-3xl font-bold flex items-center"
            >
              Chinju Store
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium ml-3">
                SUPER SAVER
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="bg-gray-50 flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search for products..."
              className="bg-transparent outline-none w-full text-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
            className="bg-white text-[#1a7e74] px-4 py-2 rounded-lg font-bold text-xl shadow-md"
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
            <a
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              My Profile
            </a>
            <a
              href="/orders"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              My Orders
            </a>
            <a
              href="/wishlist"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Wishlist
            </a>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative w-full mb-4">
          <div className="flex items-center bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
            <Search size={18} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search for fruits, vegetables, groceries..."
              className="flex-1 outline-none text-gray-700 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Categories - Horizontal Scroll */}
        {/* <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`flex flex-col items-center flex-shrink-0 ${
                selectedSubcategory === category.name
                  ? "text-white"
                  : "text-white text-opacity-90 hover:text-opacity-100"
              }`}
              onClick={() => setSelectedSubcategory(category.name)}
            >
              <div
                className={`mb-2 w-14 h-14 rounded-full flex items-center justify-center shadow-md bg-white ${
                  selectedSubcategory === category.name
                    ? "border-2 border-white"
                    : ""
                }`}
              >
                {category.imageBase64 && (
                  <img
                    src={category.imageBase64}
                    alt={category.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                )}
              </div>
              <span className="text-xs font-medium whitespace-nowrap text-center">
                {category.name}
              </span>
            </div>
          ))}
        </div> */}
      </div>

      {/* Render Modals */}
      <LoginModal />
      <Cart />

      {/* Main Content - Product Listing */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex items-center gap-2">
          <div className="hover:text-blue-500">
            <Link to="/">Home</Link>
          </div>
          <div>
            <IoIosArrowRoundForward className="text-lg" />
          </div>
          <div>{selectedSubcategory}</div>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedSubcategory}
          </h2>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">😕</div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              No Products Found
            </h3>
            <p className="text-gray-500">
              Try selecting a different category or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer "
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
                onClick={(e) => navigateToProduct(product.id, e)}
              >
                <div className="relative">
                  <img
                    src={product.imageBase64 || apple}
                    alt={product.name}
                    className="w-full h-40 md:h-60 object-cover"
                  />
                  {product.offer > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-lg font-medium">
                      {product.offer}% OFF
                    </div>
                  )}
                  {hoveredProduct === product.id && (
                    <button
                      onClick={() => toggleWishlist(product)}
                      disabled={loading}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
                        wishlist.some((item) => item.id === product.id)
                          ? "bg-red-100 text-red-500"
                          : "bg-white text-gray-600 hover:text-red-500"
                      }`}
                    >
                      <Heart
                        size={16}
                        fill={
                          wishlist.some((item) => item.id === product.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-gray-800">{product.name}</h4>
                  <p className="text-gray-500 text-xs mb-1">{product.weight}</p>
                  {/* {renderRating(product.rating || 4)} */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-gray-900">
                      ₹{product.salePrice || product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-gray-400 text-xs line-through">
                        ₹{product.originalPrice}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const isInCart = cartItems.some(
                        (item) => item.id === product.id
                      );
                      isInCart
                        ? removeFromCart(product.id)
                        : addToCart(product);
                    }}
                    className={`w-full rounded-lg py-2 mt-3 text-sm font-medium transition-colors flex items-center justify-center ${
                      cartItems.some((item) => item.id === product.id)
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {cartItems.some((item) => item.id === product.id) ? (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={16} className="mr-2" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCategoryView;