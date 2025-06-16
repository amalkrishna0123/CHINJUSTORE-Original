import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../Firebase";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { FaStar } from "react-icons/fa6";
import {
  Search,
  ChevronDown,
  ShoppingCart,
  Heart,
  X,
  Minus,
  Plus,
  Trash,
  ArrowLeft,
} from "lucide-react";
import { CgProfile } from "react-icons/cg";
import { VscAccount } from "react-icons/vsc";
import { IoIosCloseCircle } from "react-icons/io";
import { MdLogin } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "./AuthContext";
import apple from "../assets/apple.jpeg";
import { updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Link } from "react-router-dom";
import { optimizeProductData } from "../utils/imageCompression";
import ReviewSystem from "./ReviewSystem";

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [subImages, setSubImages] = useState([]);
  const [userLocation, setUserLocation] = useState({
    address: "Round North, Kodaly, Kerala", // Default address
    deliveryTime: "9 mins",
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // fetchuserwishlist
  useEffect(() => {
    const fetchUserWishlist = async () => {
      if (currentUser?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setWishlist(data.wishlist || []);
          }
        } catch (error) {
          console.error("Error fetching wishlist from Firestore:", error);
        }
      }
    };

    fetchUserWishlist();
  }, [currentUser]);

  // Fetch product details when component mounts
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          setProduct({
            id: productSnap.id,
            ...productSnap.data(),
          });
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
      console.log("productId is", productId);
    }
  }, [productId]);

  // Set selected image and sub-images when product is loaded
  useEffect(() => {
    if (product) {
      setSelectedImage(product.imageBase64);
      // Assuming product.subImages is an array of additional images
      setSubImages(product.subImages || []);
    }
  }, [product]);

  // Load cart items
  // useEffect(() => {
  //   if (currentUser?.cartItems) {
  //     setCartItems(currentUser.cartItems);
  //   } else {
  //     setCartItems([]);
  //   }
  //   if (currentUser?.wishlist) {
  //     setWishlist(currentUser.wishlist);
  //   } else {
  //     setWishlist([]);
  //   }
  // }, [currentUser]);

  // fetch cart items live updation
  useEffect(() => {
    let unsubscribe = null;

    if (currentUser?.uid) {
      // Set up real-time listener for user document
      unsubscribe = onSnapshot(
        doc(db, "users", currentUser.uid),
        (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setCartItems(userData.cartItems || []);
            setWishlist(userData.wishlist || []);
          }
        },
        (error) => {
          console.error("Error listening to user data:", error);
        }
      );
    } else {
      // Clear cart and wishlist when user logs out
      setCartItems([]);
      setWishlist([]);
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.uid]);

  // Fetch all products for related products section
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const productList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllProducts(productList);
      } catch (err) {
        console.error("Error fetching all products:", err);
      }
    };

    fetchAllProducts();
  }, []);

  // Handle quantity change
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // quantity increase
  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  // Add to cart function
  const addToCart = async () => {
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
        // If item exists, remove it from cart
        updatedItems.splice(existingItemIndex, 1);
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
          quantity: quantity,
          addedAt: new Date().toISOString(),
        };

        // Optimize the product data by compressing images
        const optimizedProduct = await optimizeProductData(productToAdd);
        updatedItems.push(optimizedProduct);
      }

      await updateDoc(doc(db, "users", currentUser.uid), {
        cartItems: updatedItems,
      });

      // Note: We don't need to manually update state here because
      // the real-time listener will handle it
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  };

  // removecart
  const removeFromCart = async (productId) => {
    if (!currentUser) return;

    try {
      const updatedItems = cartItems.filter((item) => item.id !== productId);

      await updateDoc(doc(db, "users", currentUser.uid), {
        cartItems: updatedItems,
      });

      // Note: We don't need to manually update state here because
      // the real-time listener will handle it
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  // scroll
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);


  // Toggle wishlist
  const toggleWishlist = async () => {
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


  // Handle cart click
  const handleCartClick = () => {
    if (!currentUser) {
      setShowLoginModal(true);
    } else {
      setShowCart(true);
    }
  };

  // Remove item from cart
  const removeItem = async (itemId) => {
    try {
      const updatedItems = cartItems.filter((item) => item.id !== itemId);
      await updateDoc(doc(db, "users", currentUser.uid), {
        cartItems: updatedItems,
      });
      setCartItems(updatedItems);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setShowLoginModal(false);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  // fetchcurrentlocation
  const fetchCurrentLocation = () => {
    setIsLoadingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Set a simple location without relying on Google API
            setUserLocation({
              address: `Location detected (${latitude.toFixed(
                4
              )}, ${longitude.toFixed(4)})`,
              deliveryTime: "9 mins",
            });

            // Save location to user's profile if logged in
            if (currentUser?.uid) {
              await updateDoc(doc(db, "users", currentUser.uid), {
                location: {
                  address: `Location detected (${latitude.toFixed(
                    4
                  )}, ${longitude.toFixed(4)})`,
                  coordinates: {
                    lat: latitude,
                    lng: longitude,
                  },
                },
              });
            }
          } catch (error) {
            console.error("Error setting location:", error);
            alert(
              "Could not detect your precise location. Using default address."
            );
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Location permission denied. Please allow location access to use this feature."
          );
          setIsLoadingLocation(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setIsLoadingLocation(false);
    }
  };

  // fetchuserlocation
  useEffect(() => {
    const fetchUserLocation = async () => {
      if (currentUser?.uid) {
        setIsLoadingLocation(true);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data().location) {
            setUserLocation(userDoc.data().location);
          }
        } catch (error) {
          console.error("Error fetching user location:", error);
        } finally {
          setIsLoadingLocation(false);
        }
      }
    };

    fetchUserLocation();
  }, [currentUser]);


  // Logout handler
  const handleLogout = async () => {
    await logout();
    setShowUserDropdown(false);
    setCartItems([]);
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

    return <div className="flex text-sm">{stars}</div>;
  };

  // Get related products
  const relatedProducts = allProducts.filter(
    (p) => p.category === product?.category && p.id !== product?.id
  );

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
      <div className="fixed inset-0 bg-[#fff] border border-[#0000000f] bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-[#fff] bg-opacity-90 rounded-xl w-full max-w-md shadow-xl p-6 transform transition-all border border-[#00000010]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold commonFont">
              Sign in to Chinju Store
            </h2>
            <button
              onClick={() => setShowLoginModal(false)}
              className="text-[#39B2A7] text-xl rounded-full p-2 flex items-center justify-center transition-colors"
            >
              <IoIosCloseCircle/>
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#65D2CD] flex items-center justify-center mb-4">
              <VscAccount className="text-white text-3xl" />
            </div>

            <p className="text-center mb-6">
              Sign in to access your cart, save favorites, and check out faster!
            </p>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center border border-[#00000010] justify-center gap-2 hover:text-black rounded-lg py-3.5 px-4 hover:bg-white transition duration-200 mb-4 shadow-sm"
            >
              <FcGoogle size={24} />
              <span className="font-medium">Continue with Google</span>
            </button>

            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full border border-[#00000010] shadow-sm py-3 rounded-lg  hover:text-black hover:bg-opacity-10 transition duration-200 font-medium"
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
                  onClick={() => navigate("/order-confirm")}
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-gray-500 mb-4">Product not found</div>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Gradient top bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1"></div>

      {/* Header - Desktop View */}
      <div className="hidden md:block bg-white py-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="text-blue-600 text-3xl font-bold flex items-center LogoFont"
            >
              Chinju Store
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium ml-3">
                SUPER SAVER
              </span>
            </Link>
          </div>

          {/* Delivery Info */}
          {/* <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-4 backdrop-blur-sm flex items-center">
          <div className="flex flex-col flex-1">
            <div className="text-black font-bold flex items-center">
              <span className="mr-2">
                Delivery in {userLocation.deliveryTime}
              </span>
              <span className="bg-white text-[#1a7e74] text-xs px-2 py-0.5 rounded-full">
                FAST
              </span>
            </div>
            <div className="flex items-center text-sm md:text-black text-black">
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

          {/* Search Bar */}
          {/* <div className="w-1/3">
            <div className="bg-gray-50 flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search for products..."
                className="bg-transparent outline-none w-full text-gray-700"
              />
            </div>
          </div> */}

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
            <div className="flex items-center space-x-2 cursor-pointer group">
              <Link
                to="/login"
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-md relative">
                  <MdLogin className="text-xl text-[#1a7e74]" />
                </div>

                <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                  Login
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-[#65D2CD] to-[#2CAA9E] px-4 py-4">
        {/* Logo Section */}
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="bg-white text-[#1a7e74] px-4 py-2 rounded-lg font-bold text-xl commonFont shadow-md"
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
      </div>

      {/* Product Detail Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center text-sm mb-4 commonFont">
          <Link to="/" className="text-gray-500 hover:text-blue-600">
            Home
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link
            to={`/category/${product.category}`}
            className="text-gray-500 hover:text-blue-600"
          >
            {product.category}
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-800 font-medium truncate max-w-[150px]">
            {product.name}
          </span>
        </div>

        {/* Back Button (Mobile) */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center mb-4 text-gray-600 hover:text-blue-600 md:hidden commonFont text-sm"
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </button>

        {/* Product Details Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="md:w-1/3 w-full p-4 md:p-6 bg-gray-50">
              <div className="aspect-square rounded-lg overflow-hidden bg-white flex items-center justify-center mb-4">
                <img
                  src={selectedImage || product.imageBase64 || apple}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              {product.subImagesBase64?.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  <div
                    className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                      selectedImage === product.imageBase64
                        ? "border-blue-500"
                        : "border-gray-200"
                    } hover:border-blue-500 transition-colors`}
                    onClick={() => setSelectedImage(product.imageBase64)}
                  >
                    <img
                      src={product.imageBase64}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {product.subImagesBase64.map((img, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                        selectedImage === img
                          ? "border-blue-500"
                          : "border-gray-200"
                      } hover:border-blue-500 transition-colors`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <img
                        src={img}
                        alt={`${product.name} - ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div
              className="md:w-2/3 w-full px-4 md:p-6 md:max-h-[70vh] md:overflow-y-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <style jsx>{`
                @media (min-width: 768px) {
                  div::-webkit-scrollbar {
                    display: none;
                  }
                }
              `}</style>
              {/* Title, Price */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3">
                <div>
                  <h1 className="text-lg font-semibold commonFont md:text-2xl text-gray-800 mb-1">
                    {product.name}
                  </h1>
                  <p className="text-gray-500">{product.weight}</p>
                  {/* {renderRating(product.rating || 4)} */}
                </div>
                <div className="mt-3 md:mt-0 md:text-right commonFont">
                  <div className="flex items-center md:justify-end gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{product.salePrice || product.originalPrice}
                    </span>
                    {product.originalPrice && product.salePrice && (
                      <span className="text-gray-400 text-sm line-through">
                        ₹{product.originalPrice}
                      </span>
                    )}
                  </div>
                  {product.offer > 0 && (
                    <div className="text-green-600 text-sm font-medium">
                      {product.offer}% OFF
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="mb-2 commonFont">Description</h3>
                <p className="text-gray-600">
                  {product.description ||
                    "Fresh and high-quality product. No description available."}
                </p>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <h3 className="commonFont mb-2">Quantity</h3>
                <div className="flex items-center">
                  <button
                    onClick={decreaseQuantity}
                    className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={increaseQuantity}
                    className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col md:flex-row gap-4">
                {product.stock === "Available" ? (
  <button
    onClick={(e) => {
      e.stopPropagation();
      const isInCart = cartItems.some((item) => item.id === product.id);
      isInCart ? removeFromCart(product.id) : addToCart(product);
    }}
    className={`w-full rounded-lg py-2 mt-2 text-sm font-medium transition-colors flex items-center justify-center ${
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
          />
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
) : (
  <button
    disabled
    className="w-full rounded-lg py-2 mt-2 text-sm font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
  >
    Out of Stock
  </button>
)}


                <button
                  onClick={() => toggleWishlist(product)}
                  disabled={loading}
                  className={`w-full md:w-auto flex-1 border border-gray-300 rounded-lg py-3 px-6 flex items-center justify-center transition-colors ${
                    wishlist.some((item) => item.id === product.id)
                      ? "bg-red-100 text-red-500 border-red-500"
                      : "bg-white text-gray-600 hover:text-red-500 hover:border-red-500"
                  }`}
                >
                  <Heart
                    size={16}
                    fill={
                      wishlist.some((item) => item.id === product.id)
                        ? "currentColor"
                        : "none"
                    }
                    className="mr-2"
                  />
                  {wishlist.some((item) => item.id === product.id)
                    ? "Wishlisted"
                    : "Add to Wishlist"}
                </button>
              </div>

              {/* Additional Info */}
              <div className="border-t border-gray-100 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Details */}
                  <div>
                    <h3 className="mb-3 commonFont">Product Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category</span>
                        <span className="font-medium">
                          {product.category || "Groceries"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Weight</span>
                        <span className="font-medium">
                          {product.weight || "500g"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Stock</span>
                        <span
                          className={`font-medium ${
                            product.stock > 10
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {product.stock > 0
                            ? `${product.stock} available`
                            : "Out of stock"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Storage</span>
                        <span className="font-medium">
                          {product.storage || "Keep refrigerated"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  {/* Delivery Info */}
                  <div>
                    <h3 className="mb-3 commonFont">Delivery Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Delivery Time</span>
                        <span className="font-medium text-green-600">
                          9 minutes
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Delivery Fee</span>
                        <span className="font-medium">₹40</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Free Delivery</span>
                        <span className="font-medium">
                          On orders above ₹200
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Return Policy</span>
                        <span className="font-medium">
                          Easy returns within 24 hours
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review System */}
              <div className="border-t border-gray-100 pt-6 mt-6">
                <ReviewSystem productId={productId} />
              </div>
            </div>
          </div>
          <div className=" px-2 pb-2">
            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div className="mt-12 border-t border-gray-100 pt-6">
                <h3 className="text-lg mb-4 text-grey-900 commonFont">
                  You May Also Like
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {relatedProducts.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/product/${item.id}`)}
                    >
                      <div className="aspect-square bg-white rounded-lg flex items-center justify-center p-2 mb-3">
                        <img
                          src={item.imageBase64 || apple}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm mb-1 clamp-text">
                          {item.name}
                        </h4>
                        <div className="flex justify-between items-center">
                          <p
                            className={`text-xs mb-1 mt-1 px-2 py-1 rounded-sm text-white shadow-sm flex justify-start items-center 
    ${item.stock === "Available" ? "bg-green-600" : "bg-red-600"}`}
                          >
                            {item.stock}
                          </p>
                          <div className="flex items-center gap-0.5">
                            <div className="font-medium">4</div>
                            <span className="text-sm text-[#ffea00]">
                              <FaStar />
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 font-semibold">
                          {item.weight || "500g"}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-semibold text-gray-900">
                            ₹{item.salePrice}
                          </span>
                          <button
                            className="bg-blue-50 text-blue-600 p-1 rounded-full hover:bg-blue-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item);
                            }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {wishlist.length > 0 && (
          <div className="max-w-[1400px] mx-auto px-4 py-8">
            <h2 className="text-xl font-bold mb-4">Your Wishlist</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  <img
                    src={item.imageBase64 || apple}
                    alt={item.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-sm font-semibold truncate">
                      {item.name}
                    </h3>
                    <div className="mt-2 text-sm text-gray-700">
                      ₹{item.salePrice || item.originalPrice}
                    </div>
                    <Link
                      to={`/product/${item.id}`}
                      className="inline-block mt-2 text-blue-500 text-sm hover:underline"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <LoginModal />
      <Cart isOpen={showCart} onClose={() => setShowCart(false)} />
    </div>
  );
};

export default ProductDetail;
