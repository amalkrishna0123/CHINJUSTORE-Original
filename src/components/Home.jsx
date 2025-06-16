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
import { IoIosCloseCircle } from "react-icons/io";
import { FcGoogle } from "react-icons/fc";
import apple from "../assets/apple.jpeg";
import { useAuth } from "./AuthContext";
import { MdLogin } from "react-icons/md";
import { collection, getDocs, getDoc } from "firebase/firestore";
import { db } from "../Firebase";
import { query, orderBy, limit } from "firebase/firestore";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { VscAccount } from "react-icons/vsc";
import allproduct from "../assets/allproduct.jpeg";
import { useNavigate } from "react-router-dom";
import ProductsLoader from "./ProductsLoader";
import { AiOutlineInstagram } from "react-icons/ai";
import { PiFacebookLogoBold } from "react-icons/pi";
import { IoLogoWhatsapp } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import ff from "../assets/ff.png";
import fff from "../assets/fff.jpg";
import dot from "../assets/dot.png";
import HomeLoader from "./cart animations/HomeLoader";
import LocationSetup from "./LocationSetup";

const Home = () => {
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [homeLoading, setHomeLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();
  const [productsLoader, setProductsLoader] = useState(true);
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const [index, setIndex] = useState(0);
  const [userLocation, setUserLocation] = useState({
    address: "Select Your Location", // Default address
    deliveryTime: "super fast",
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const words = ["products", "categories", "services", "items"];
  const [groupedCategories, setGroupedCategories] = useState([]);
  // const desiredCategoryOrder = [
  //   "Grocery & Kitchen",
  //   "Snacks & Drinks",
  //   "Beauty & Personal care",
  //   "Household Essentials"
  // ];

  // Modern cool color scheme
  const colors = {
    primary: "#3B82F6", // Blue
    secondary: "#6366F1", // Indigo
    accent: "#8B5CF6", // Purple
    light: "#F3F4F6",
    dark: "#1F2937",
    white: "#FFFFFF",
    success: "#10B981", // Green
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000); // 1 second

    return () => clearInterval(interval);
  }, []);

  const navigateToProduct = (productId, event) => {
    // Prevent event from triggering when clicking on buttons inside the card
    if (event.target.closest("button")) return;
    navigate(`/product/${productId}`);
  };

  // scroll
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Define filtered products with search functionality
  const getFilteredProducts = () => {
    let result =
      selectedCategory === "All" || selectedCategory === "All Products"
        ? products
        : products.filter(
            (product) =>
              product.category === selectedCategory || // main
              product.subcategory === selectedCategory // sub
          );

    if (searchQuery && searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (product) =>
          (product.name && product.name.toLowerCase().includes(query)) ||
          (product.category &&
            product.category.toLowerCase().includes(query)) ||
          (product.subcategory &&
            product.subcategory.toLowerCase().includes(query)) ||
          (product.description &&
            product.description.toLowerCase().includes(query))
      );
    }

    return result;
  };

  // filtered category product
  const getFilteredProductsAndCategories = () => {
    // First filter products as before
    let filteredProducts =
      selectedCategory === "All" || selectedCategory === "All Products"
        ? products
        : products.filter(
            (product) =>
              product.category === selectedCategory ||
              product.subcategory === selectedCategory
          );

    if (searchQuery && searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      filteredProducts = filteredProducts.filter(
        (product) =>
          (product.name && product.name.toLowerCase().includes(query)) ||
          (product.category &&
            product.category.toLowerCase().includes(query)) ||
          (product.subcategory &&
            product.subcategory.toLowerCase().includes(query)) ||
          (product.description &&
            product.description.toLowerCase().includes(query))
      );

      // Also filter categories based on search query
      const filteredGroupedCategories = groupedCategories
        .map((mainCategory) => ({
          ...mainCategory,
          subcategories: mainCategory.subcategories.filter((sub) =>
            sub.name.toLowerCase().includes(query)
          ),
        }))
        .filter((mainCategory) => mainCategory.subcategories.length > 0);

      return { filteredProducts, filteredGroupedCategories };
    }

    return { filteredProducts, filteredGroupedCategories: groupedCategories };
  };

  // Use the filtered data
  const { filteredProducts, filteredGroupedCategories } =
    getFilteredProductsAndCategories();

  // Use the filtered products
  // const filteredProducts = getFilteredProducts();

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const productList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList);
        setProductsLoader(false);
        setHomeLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, []);

  // Fetch categories from Firestore
  //   useEffect(() => {
  //     const fetchCategories = async () => {
  //       try {
  //         const snapshot = await getDocs(collection(db, "categories"));
  //         const fetched = snapshot.docs.map((doc) => ({
  //           id: doc.id,
  //           ...doc.data(),
  //         }));
  //         // Add "All" category at the beginning
  //        // Separate main and sub categories
  // const main = fetched.filter((cat) => cat.type === "main");
  // const sub = fetched.filter((cat) => cat.type === "sub");

  // // Group subcategories under main categories
  // const grouped = main.map((mainCat) => ({
  //   id: mainCat.id,
  //   name: mainCat.name,
  //   subcategories: sub.filter((subCat) => subCat.parentId === mainCat.id),
  // }));

  // // Optional: Add 'All Products' at the top of flat categories if still needed elsewhere
  // setCategories([
  //   { id: "all", name: "All Products", imageBase64: allproduct },
  //   ...fetched,
  // ]);

  // // ✅ Set structured grouped categories
  // setGroupedCategories(grouped);
  // setHomeLoading(false)

  //       } catch (err) {
  //         console.error("Error fetching categories:", err);
  //       }
  //     };

  //     fetchCategories();
  //   }, []);

  // Define the exact desired order (make sure these names exactly match your Firestore data)
 useEffect(() => {
  // Use main category IDs for ordering instead of names
  const CATEGORY_DISPLAY_ORDER = [
    "egWACgVKvqO1o6S3QJqS", // Grocery & Kitchen
    "LqtTquG9TfhkovdvJFdD", // Snacks & Drinks
    "HwEpO9DIkQ2ZFtGxVxWF", // Beauty & Personal care
    "96tY0zTWrAyjLuztp8Pe", // Household Essentials
  ];
  
  // Map main category IDs to their subcategory ID orders
  const SUBCATEGORY_ID_ORDERS = {
    egWACgVKvqO1o6S3QJqS: [
      // Grocery & Kitchen
      "pDIlYhnM25VyAWGanFck", // Fruits & Vegetables
      "o3XBW2tkRKGp7XaqfdJy", // Dairy, Bread & Eggs
      "bsUVGwFHr9mKsd3tDtEA", // Atta, Rice, Oil & Dals
      "obuYruSyIDZ3u8DPZdh2", // Masala & Dry Fruits
      "4F4RBqDTcNLckK86eJ6s", // Breakfast & Sauces
      "6tj4n7TYc0XbQKwy3DpO", // Package Foods
    ],
    LqtTquG9TfhkovdvJFdD: [
      // Snacks & Drinks
      "o9ceHTun7JizNwAUTeEJ", // Tea, Coffee & More
      "EveHMgA7W0evPRujrerW", // Ice Cream & More
      "X09NiEXeEhN9lDh99Hy6", // Frozen Food
      "xigeItGtCwEGoDkM2Lht", // Sweet Cravings
      "7Xyr2X9vpSITeDAKOsZq", // Cold Drinks & Juices
      "qpIobAA2q93w0vQY7WRH", // Munchies
      "tjM9u8y5YZmFARMb7iiI", // Biscuits & Cookies
    ],
    HwEpO9DIkQ2ZFtGxVxWF: [
      "3FaJ10wV0AEHzg3lhHJV", // Makeup
      "KdaOTRsfHTsJLwQRjx3S", // Skin Care
      "olgTss7Hk3ZDfX0fOLQB", // Bath & Body
      "09fIfVCJAJIz10fKrYWD", // Hair Care
      "4PAkqyM0oHQWluSIuOSB", // Fragrances
      "Di8jCGdyVFTinaTAtpls", // Men’s Grooming

      "yCv3oaYE3qJqjaszQKoB", // Feminine Hygiene
      "ywuxnLZcUFgRmLllVe8h", // Oral Care
    ], // Beauty & Personal care
    "96tY0zTWrAyjLuztp8Pe": [
       
       "IEZajimU0SRjcJ2DC0qh", // Home Safety & Hygiene
       "MGjtqz8S76o6tVYItM39", // Laundry Care
       "MLaEYnkCRjBAxhGFDbMU", // Dishwashing Essentials
       "NrWbuediTrSenmg4yWDL", // Paper Products
       "vXoSiAVazyyulVelieK4", // Disinfectants & Sanitizer
       "Rkp5ThzbThlxJviI2k2h", // Tissues & Napkins
       "dTtby9rrqKxMNWrF2L7q", // Bathroom Essentials
       "e9YVg7gy8EJDz4jEq6gS", // Air Fresheners & Deodorizers
       "k2YRjwMMpuSIvzzn2tiP", // Storage & Organizers
       "kgumepwd7COKCfdEtxta", // Batteries & Electricals
       "lBJ15JWhwLtqrIQJNHxp", // Lighting & Bulbs
       "uXT0brFO7EzS3lds8pZh", // Trash Bags & Bins
       
       "5F0eToUsslWjemNS2t35", // Pest Control
    ], // Household Essentials
  };

  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, "categories"));
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Separate main and sub categories
      const mainCategories = fetched.filter((cat) => cat.type === "main");
      const subCategories = fetched.filter((cat) => cat.type === "sub");

      // Sort main categories according to our specific ID order
      const sortedMainCategories = CATEGORY_DISPLAY_ORDER
        .map(id => mainCategories.find(cat => cat.id === id))
        .filter(Boolean);

      // Group subcategories under the sorted main categories with their own ordering
      const grouped = sortedMainCategories.map((mainCat) => {
        if (!mainCat) return null;
        
        const subcats = subCategories.filter((subCat) => subCat.parentId === mainCat.id);
        
        // Sort subcategories if we have a defined ID order for this main category
        let sortedSubcats = [];
        if (SUBCATEGORY_ID_ORDERS[mainCat.id] && SUBCATEGORY_ID_ORDERS[mainCat.id].length > 0) {
          // Create subcategories in exact order specified by ID
          SUBCATEGORY_ID_ORDERS[mainCat.id].forEach((orderedId) => {
            const found = subcats.find(sub => sub.id === orderedId);
            if (found) {
              sortedSubcats.push(found);
            }
          });
          
          // Add any remaining subcategories not in the ordered list
          const remainingSubcats = subcats
            .filter(sub => !SUBCATEGORY_ID_ORDERS[mainCat.id].includes(sub.id))
            .sort((a, b) => a.name.localeCompare(b.name));
          
          sortedSubcats = [...sortedSubcats, ...remainingSubcats];
        } else {
          // Default alphabetical sorting for categories without specific order
          sortedSubcats = [...subcats].sort((a, b) => a.name.localeCompare(b.name));
        }

        return {
          id: mainCat.id,
          name: mainCat.name,
          subcategories: sortedSubcats
        };
      }).filter(Boolean);

      setGroupedCategories(grouped);
      setHomeLoading(false);

      setCategories([
        { id: "all", name: "All Products", imageBase64: allproduct },
        ...fetched,
      ]);

    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  fetchCategories();
}, []);

  // Fetch banners from Firestore
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "banners"));
        const bannerList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBanners(bannerList);
        setHomeLoading(false);
      } catch (err) {
        console.error("Error fetching banners:", err);
      }
    };

    fetchBanners();
  }, []);

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});

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

  // Cart functions
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

  // Update quantity function
  const updateQuantity = async (productId, newQuantity) => {
    if (!currentUser) return;

    try {
      const updatedItems = cartItems.map((item) => {
        if (item.id === productId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });

      if (currentUser?.uid) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          cartItems: updatedItems,
        });
      }

      setCartItems(updatedItems);
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  // Add to cart function
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
        updatedItems.push({
          ...product,
          quantity: 1,
          addedAt: new Date().toISOString(),
        });
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
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const cartItems = userDoc.data().cartItems || [];
        const updatedItems = cartItems.filter((item) => item.id !== productId);

        await updateDoc(doc(db, "users", currentUser.uid), {
          cartItems: updatedItems,
        });

        // Update local state
        setCartItems(updatedItems);
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
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

  const toggleWishlist = async (product) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const wishlist = userDoc.data().wishlist || [];
        const isInWishlist = wishlist.some((item) => item.id === product.id);

        if (isInWishlist) {
          await updateDoc(doc(db, "users", currentUser.uid), {
            wishlist: arrayRemove(product),
          });

          // Update local state
          setWishlist((prev) => prev.filter((item) => item.id !== product.id));
        } else {
          await updateDoc(doc(db, "users", currentUser.uid), {
            wishlist: arrayUnion(product),
          });

          // Update local state
          setWishlist((prev) => [...prev, product]);
        }
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  // Improved location function
  const fetchCurrentLocation = async () => {
    setIsLoadingLocation(true);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const apiKey = "0f026c32f1ac42d58b4afc31e690a961"; // OpenCage API key
        const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`;

        try {
          const response = await fetch(apiUrl);
          const data = await response.json();

          const components = data.results[0]?.components || {};
          const parts = [
            components.suburb, // e.g., Chittattukara
            components.village, // e.g., Pavaratty
            components.county, // e.g., Thrissur
          ];

          const formattedAddress = parts.filter(Boolean).join(", ");

          setUserLocation({
            address:
              formattedAddress ||
              `(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            deliveryTime: "9 mins",
          });

          if (currentUser?.uid) {
            await updateDoc(doc(db, "users", currentUser.uid), {
              location: {
                address: formattedAddress,
                coordinates: {
                  lat: latitude,
                  lng: longitude,
                },
              },
            });
          }
        } catch (error) {
          console.error("Error fetching address from OpenCage API:", error);
          setUserLocation({
            address: `(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            deliveryTime: "9 mins",
          });
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Location permission denied. Please allow location access.");
        setIsLoadingLocation(false);
      }
    );
  };

  // Call this in useEffect when user logs in
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
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
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
      <div className="fixed bg-[#fff] z-50 flex items-center justify-center p-4 top-0 bottom-0 h-screen overflow-hidden">
        <div className="bg-[#fff] border border-[#00000012]  rounded-xl w-full max-w-md shadow-xl p-6 transform transition-all">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Sign in to Chinju Store
            </h2>
            <button
              onClick={() => setShowLoginModal(false)}
              className="rounded-full p-2 text-xl text-[#65D2CD]  flex items-center justify-center transition-colors"
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
              className="w-full flex items-center justify-center gap-2 border border-[#0000000f] hover:text-black rounded-lg py-3.5 px-4 text-white hover:bg-[#fff] transition duration-200 mb-4 shadow-sm"
            >
              <FcGoogle size={24} />
              <span className="font-medium text-[#000]">Continue with Google</span>
            </button>

            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full text-[#000] border border-[#0000000f] shadow-sm py-3 rounded-lg hover:bg-[#fff] hover:text-black hover:bg-opacity-10 hover:border-[#fff] transition duration-200 font-medium"
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

  return (
    <div className="bg-[#ffffffe7] min-h-[300px]">
      {/* Gradient top bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1"></div>

      {/* Header - Desktop View */}
      <div className="hidden md:block bg-white py-4 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="text-blue-600 text-3xl font-bold flex items-center LogoFont">
              Chinju Store
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium ml-3">
                SUPER SAVER
              </span>
            </div>
          </div>

          {/* Delivery Info */}
          {/* Desktop View */}
          <div className="flex items-center bg-gray-50 px-4 py-2 rounded-lg">
            <div className="mr-3">
              <div className="text-blue-600 font-bold commonFont">
                Delivery in fast
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span>{userLocation.address}</span>
                <ChevronDown size={16} className="ml-1" />
              </div>
            </div>
            <div className="h-8 w-px bg-gray-300 mx-2"></div>
            {showLocationSetup && (
              <LocationSetup
                onClose={() => setShowLocationSetup(false)}
                onLocationSet={(location) => {
                  setUserLocation(location);
                  setShowLocationSetup(false);
                }}
              />
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            {/* Floating Label Placeholder */}
            {searchQuery === "" && (
              <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none flex text-gray-400 text-sm sm:text-base">
                <span>Search for&nbsp;</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={words[index]}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.5 }}
                  >
                    {words[index]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}

            {/* Input Field */}
            <div className="bg-gray-50 flex items-center gap-2 px-4 py-3 mb-2 rounded-lg border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Search size={20} className="text-gray-400 z-10" />
              <input
                type="text"
                className="bg-transparent outline-none w-full text-gray-700 placeholder-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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

      {/* Navigation Categories - Desktop View */}
      {/* <div className="hidden md:block bg-white border-t border-gray-100 overflow-x-auto hideScrollbar flex-shrink-0">
        <div className="max-w-7xl mx-auto flex-shrink-0 overflow-x-auto hideScrollbar">
          <div className="flex items-center justify-between px-4 py-3 overflow-x-auto hideScrollbar gap-10">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedCategory === category.name
                    ? " text-yellow-500"
                    : "hover:text-blue-500"
                }`}
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.imageBase64 && (
                  <img
                    src={category.imageBase64}
                    alt={category.name}
                    className="w-12 h-12 object-contain rounded-full"
                  />
                )}
                <span className="font-sm leading-tight text-wrap">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* Mobile Header */}
      <div className="relative md:hidden bg-gradient-to-r from-[#65D2CD] to-[#2CAA9E]">
        <div className=" absolute opacity-20 overflow-hidden top-0 bottom-0">
          <img src={dot} alt="" />
        </div>
        <div className=" p-4 relative">
          {/* Logo Section */}
          <div className="flex justify-between items-center mb-4">
            <div className="bg-white text-[#1a7e74] px-4 py-2 rounded-lg font-bold shadow-md LogoFont">
              Chinju Store
            </div>
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
            <div className="absolute right-4 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-40 border border-gray-100">
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

          {/* Delivery Info */}
          <div className="bg-white bg-opacity-80 rounded-lg p-4 mb-5 shadow-md backdrop-blur-md flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-gray-800 text-sm commonFont">
                  {/* Delivery in {userLocation.deliveryTime} */}
                  Delivery in fast
                </span>
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  FAST
                </span>
              </div>
              <div className="flex items-center mt-1 text-sm text-gray-600">
                <span>{userLocation.address}</span>
              </div>
            </div>


            <a href="/locationSetup">
              <button
                // onClick={fetchCurrentLocation}
                disabled={isLoadingLocation}
                className="ml-4 bg-[#1a7e74] commonFont text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-[#16675f] transition-colors duration-200 disabled:opacity-50"
              >
                {isLoadingLocation ? "Loading..." : "Change"}
              </button>
            </a>
          </div>

          {/* Search Bar */}
          <div className="relative commonFont">
            {/* Floating Label Placeholder */}
            {searchQuery === "" && (
              <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none flex text-gray-400 text-sm sm:text-base">
                <span>Search for&nbsp;</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={words[index]}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.5 }}
                  >
                    {words[index]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}

            {/* Input Field */}
            <div className="bg-gray-50 flex items-center gap-2 px-4 py-3 mb-2 rounded-lg border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Search size={20} className="text-gray-400 z-10" />
              <input
                type="text"
                className="bg-transparent outline-none w-full text-gray-700 placeholder-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Categories - Horizontal Scroll */}
          {/* <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`flex flex-col items-center flex-shrink-0 cursor-pointer transition-colors duration-200 ${
                selectedCategory === category.name
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-black"
              }`}
              onClick={() => setSelectedCategory(category.name)}
            >
              <div
                className={`mb-2 w-[50px] h-[50px] rounded-full flex items-center justify-center border transition-all duration-300 ${
                  selectedCategory === category.name
                    ? "bg-blue-100 border-blue-600 shadow-md"
                    : "bg-white border-gray-300"
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
              <span className="text-[10px] text-[#e9fffa] font-bold text-center break-words leading-tight">
                {category.name}
              </span>
            </div>
          ))}
        </div> */}
        </div>
      </div>

      {/* Render Modals */}
      <LoginModal />
      <Cart isOpen={showCart} onClose={() => setShowCart(false)} />
      {homeLoading && <HomeLoader />}
      <div className="relative bg-[#f3ffff]">
        <div className="absolute top-0 bottom-0 left-0 right-0 z-0 opacity-0 bg-no-repeat">
          <img src={fff} alt="" className="w-full h-full object-cover" />
        </div>
        <div className=" relative">
          {/* Hero Banner */}
          <div className="max-w-7xl mx-auto px-2 mt-3 ">
            <div className="rounded-2xl overflow-hidden">
              <Swiper
                modules={[Autoplay, Pagination]}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                // navigation={true}
                loop={banners.length > 1}
                className="w-full"
              >
                {banners.map((banner) => (
                  <SwiperSlide key={banner.id}>
                    <img
                      src={banner.imageBase64}
                      alt="Banner"
                      className="w-full h-full object-contain "
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          {/* Categories Section */}
          {/* Product/Category Section */}
          <div className="max-w-7xl mx-auto px-4 mt-3 min-h-[300px]">
            {searchQuery && searchQuery.trim().length > 0 ? (
              // Show search results - either categories or products
              <>
                {filteredGroupedCategories.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl text-gray-800 md:mb-4 CategoryTitle lg:text-2xl">
                      Categories matching "{searchQuery}"
                    </h2>
                    {filteredGroupedCategories.map((main) => (
                      <div key={main.id} className="mb-3">
                        <h3 className="text-lg text-gray-700 md:mb-2 lg:text-2xl">
                          {main.name}
                        </h3>
                        <div className="grid md:grid-cols-6 lg:grid-cols-6 grid-cols-4 gap-x-2 md:gap-4">
                          {main.subcategories.map((sub) => (
                            <Link
                              to={`/category/${encodeURIComponent(sub.name)}`}
                              key={sub.id}
                              className="rounded-lg flex flex-col border border-[#00000014] shadow-sm items-center transition-all cursor-pointer overflow-hidden hover:bg-gray-50"
                              onClick={() => setSelectedCategory(sub.name)}
                            >
                              <div className="w-20 h-20 lg:w-[300px] mb-3 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                <img
                                  src={sub.imageBase64 || allproduct}
                                  alt={sub.name}
                                  className="w-20 h-20 object-contain"
                                />
                              </div>
                              <span className="text-[10px] font-bold text-center text-gray-800 leading-tight ">
                                {sub.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredProducts.length > 0 && (
                  <div>
                    <h2 className="text-xl text-gray-800 md:mb-4 CategoryTitle">
                      Products matching "{searchQuery}"
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md cursor-pointer"
                          onClick={(e) => navigateToProduct(product.id, e)}
                        >
                          <div className="relative">
                            <img
                              src={product.imageBase64 || apple}
                              alt={product.name}
                              className="w-full h-48 object-contain"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(product);
                              }}
                              className={`absolute top-2 right-2 p-2 rounded-full ${
                                wishlist.some((item) => item.id === product.id)
                                  ? "text-red-500 bg-white"
                                  : "text-gray-400 bg-white"
                              }`}
                            >
                              <Heart
                                size={20}
                                fill={
                                  wishlist.some(
                                    (item) => item.id === product.id
                                  )
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            </button>
                          </div>
                          <div className="p-4">
                            <h3 className="text-sm font-medium text-gray-800 mb-1 truncate">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2">
                              {product.weight}
                            </p>
                            {renderRating(product.rating || 0)}
                            <div className="flex items-center justify-between mt-3">
                              <div>
                                <span className="font-bold text-gray-900">
                                  ₹{product.salePrice || product.originalPrice}
                                </span>
                                {product.originalPrice && (
                                  <span className="text-gray-400 text-xs line-through ml-2">
                                    ₹{product.originalPrice}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                                className="text-white bg-[#1a7e74] hover:bg-[#145f5a] px-3 py-1 rounded-full text-xs transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredProducts.length === 0 &&
                  filteredGroupedCategories.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-gray-500">
                        No results found for "{searchQuery}"
                      </p>
                    </div>
                  )}
              </>
            ) : (
              // Normal view - show grouped categories
              <>
                {groupedCategories.map((main) => (
                  <div key={main.id} className="mb-3">
                    <h2 className="text-xl text-gray-800 mb-2 md:mb-2 CategoryTitle lg:text-3xl">
                      {main.name}
                    </h2>
                    <div className="grid md:grid-cols-6 lg:grid-cols-5 grid-cols-4 gap-x-3 gap-y-3 md:gap-4 lg:gap-5">
                      {main.subcategories.map((sub) => (
                        <Link
                          to={`/category/${encodeURIComponent(sub.name)}`}
                          key={sub.id}
                          className="rounded-lg flex flex-col items-center transition-all cursor-pointer overflow-hidden hover:bg-gray-50"
                          onClick={() => setSelectedCategory(sub.name)}
                        >
                          <div className="w-20 h-20 border border-[#0000001a] lg:rounded-3xl lg:w-[300px] lg:h-[300px] mb-3 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden">
                            <img
                              src={sub.imageBase64 || allproduct}
                              alt={sub.name}
                              className="w-20 h-20 lg:w-full lg:h-full object-contain lg:rounded-3xl"
                            />
                          </div>
                          <span className="text-[11px] lg:text-base font-bold text-center text-gray-800 leading-tight">
                            {sub.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Features Section */}
          <div className="max-w-7xl mx-auto px-4 mt-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                  <span className="text-xl">
                    <img
                      src="https://res.cloudinary.com/dqydgc2ky/image/upload/v1748593991/time_6953238_ejcooq.png"
                      alt=""
                    />
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">
                    Ultrafast Delivery
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Get your groceries in minutes
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm flex items-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4">
                  <span className="text-xl">
                    <img
                      src="https://res.cloudinary.com/dqydgc2ky/image/upload/v1748594067/fresh_6718182_yftabd.png"
                      alt=""
                    />
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Farm Fresh</h4>
                  <p className="text-gray-600 text-sm">
                    100% fresh products daily
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm flex items-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-4">
                  <span className="text-xl">
                    <img
                      src="https://res.cloudinary.com/dqydgc2ky/image/upload/v1748594151/dollar-symbol_1151390_dikxve.png"
                      alt=""
                    />
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Best Prices</h4>
                  <p className="text-gray-600 text-sm">
                    Save more with exclusive deals
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 mt-5  text-gray-700 relative">
        <div className="absolute bg-[#219085] top-0 bottom-0 left-0 right-0"></div>
        <div className="absolute top-0 bottom-0 left-0 right-0">
          <img
            src={ff}
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="backdrop-blur-[1px] h-full relative">
          <div className="max-w-6xl mx-auto py-8 px-5 flex flex-col md:flex-row justify-between gap-6">
            {/* Logo and Social */}
            <div className="flex flex-col gap-4">
              <div className="text-2xl font-semibold text-[#ffffff] LogoFont">
                Chinju Store
              </div>
              <div className="flex items-center gap-4 text-[#ffffff] text-xl">
                <a
                  href="#"
                  className="hover:text-[#219085] transition-colors duration-200"
                >
                  <AiOutlineInstagram />
                </a>
                <a
                  href="#"
                  className="hover:text-[#219085] transition-colors duration-200"
                >
                  <PiFacebookLogoBold />
                </a>
                <a
                  href="#"
                  className="hover:text-[#219085] transition-colors duration-200"
                >
                  <IoLogoWhatsapp />
                </a>
              </div>
            </div>

            {/* Info or Links Section (optional for future expansion) */}
            <div className="flex flex-col items-start text-sm text-[#fff]">
              <a href="/shippingdelivery" className="hover:underline py-1">
                Shipping & Delivery
              </a>
              <a href="/privacypolicy" className="hover:underline py-1">
                Privacy Policy
              </a>
              <a
                href="/cancellationRefundpolicy"
                className="hover:underline py-1"
              >
                Cancellation & Refund Policy
              </a>
              <a href="/termsandconditions" className="hover:underline py-1">
                Terms & Conditions
              </a>
              <a href="/contact" className="hover:underline py-1">
                Contact Us
              </a>
            </div>

            {/* Copyright */}
            <div className="text-sm text-[#eee] md:text-right flex justify-start">
              <p>© 2025 Chinju Store</p>
              <p>All rights reserved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
