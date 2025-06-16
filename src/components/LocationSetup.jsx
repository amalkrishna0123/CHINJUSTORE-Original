// LocationSetup.jsx
import React, { useState, useEffect } from "react";
import { Search, ArrowLeft, MapPin, Target, Loader2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../Firebase";
import { useAuth } from "./AuthContext";
import { BiCurrentLocation } from "react-icons/bi";

const LocationSetup = ({ onClose, onLocationSet }) => {
  const { currentUser } = useAuth();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Enhanced search with better debouncing and loading states
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setShowResults(true);

      const apiKey = "0f026c32f1ac42d58b4afc31e690a961";
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
        searchQuery
      )}&key=${apiKey}&countrycode=in&limit=8`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        const results = data.results
          .map((item) => {
            const components = item.components;
            return {
              name:
                components.village ||
                components.town ||
                components.city ||
                components.hamlet ||
                components.suburb ||
                components.state_district ||
                components.county ||
                components.state,
              state: components.state,
              full: item.formatted,
              lat: item.geometry.lat,
              lng: item.geometry.lng,
            };
          })
          .filter((loc) => loc.name && loc.state);

        setSearchResults(results);
      } catch (error) {
        console.error("Error fetching search results from OpenCage:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

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

        const apiKey = "0f026c32f1ac42d58b4afc31e690a961";
        const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`;

        try {
          const response = await fetch(apiUrl);
          const data = await response.json();

          const components = data.results[0]?.components || {};
          const parts = [
            components.suburb,
            components.village,
            components.county,
          ];

          const formattedAddress = parts.filter(Boolean).join(", ");

          const locationData = {
            address: formattedAddress || `(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            deliveryTime: "9 mins",
            coordinates: {
              lat: latitude,
              lng: longitude,
            },
          };

          setSelectedLocation(locationData);

          if (currentUser?.uid) {
            await saveLocationToFirebase(locationData);
          }
          
          if (onLocationSet) onLocationSet(locationData);
          if (onClose) onClose();
        } catch (error) {
          console.error("Error fetching address from OpenCage API:", error);
          const fallbackLocation = {
            address: `(${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            deliveryTime: "9 mins",
            coordinates: {
              lat: latitude,
              lng: longitude,
            },
          };
          setSelectedLocation(fallbackLocation);
          
          if (currentUser?.uid) {
            await saveLocationToFirebase(fallbackLocation);
          }
          
          if (onLocationSet) onLocationSet(fallbackLocation);
          if (onClose) onClose();
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

  const saveLocationToFirebase = async (location) => {
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        location: {
          address: location.address,
          coordinates: location.coordinates,
        },
      });
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  const handleManualLocationSelect = async (location) => {
    const locationData = {
      address: location.full,
      coordinates: {
        lat: location.lat,
        lng: location.lng,
      },
      deliveryTime: "9 mins",
    };
    
    setSelectedLocation(locationData);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);

    if (currentUser?.uid) {
      await saveLocationToFirebase(locationData);
    }
    
    if (onLocationSet) onLocationSet(locationData);
    if (onClose) onClose();
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setShowResults(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding results to allow for clicks
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
        <a href="/">
            <button 
            onClick={onClose} 
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
            <ArrowLeft size={20} className="text-gray-700" />
            </button>
        </a>
        <h1 className="text-lg font-semibold text-gray-900">Your Location</h1>
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 bg-gray-50">
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2e978e] focus:bordr-[#2e978e] transition-all duration-200 text-gray-900 placeholder-gray-500 outline-none"
            placeholder="Search a new address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
          
          {/* Loading indicator for search */}
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <Loader2 size={18} className="text-red-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Search Results */}
        {showResults && searchQuery.trim().length >= 2 && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  {searchResults.map((location, index) => (
                    <div
                      key={index}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                      onClick={() => handleManualLocationSelect(location)}
                    >
                      <div className="flex items-start">
                        <MapPin size={16} className="text-gray-400 mt-1 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {location.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {location.full}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No locations found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Location Option */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            onClick={fetchCurrentLocation}
          >
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-red-50 rounded-full mr-4">
                {isLoadingLocation ? (
                  <Loader2 size={18} className="text-[#2e978e] animate-spin" />
                ) : (
                  <BiCurrentLocation size={18} className="text-[#2e978e]" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#2e978e] text-base">
                  Current Location
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoadingLocation 
                    ? "Getting your location..." 
                    : "Enable your current location for better services"
                  }
                </p>
              </div>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isLoadingLocation
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-[#2e978e] text-white hover:bg-[#2e978e] active:bg-[#2e978e]"
                }`}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? "Getting..." : "Enable"}
              </button>
            </div>
          </div>
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <MapPin size={16} className="text-green-600 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Selected Location
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {selectedLocation.address}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add some spacing at bottom for better UX */}
      <div className="h-20 bg-gray-50"></div>
    </div>
  );
};

export default LocationSetup;