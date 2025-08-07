import { useState, useEffect } from 'react';
import LoadingIndicator from '../components/LoadingIndicator';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

function Shop() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCart, setShowCart] = useState(false);

  const categories = ['all', 'supplements', 'apparel', 'equipment', 'accessories'];

  useEffect(() => {
    // Load products
    const loadProducts = async () => {
      try {
        // Mock products data - replace with actual API call
        const mockProducts: Product[] = [
          {
            id: 1,
            name: "Whey Protein Powder",
            description: "Premium whey protein for muscle recovery and growth",
            price: 49.99,
            image: "/api/placeholder/300/300",
            category: "supplements",
            inStock: true
          },
          {
            id: 2,
            name: "SweatTeam T-Shirt",
            description: "Official SweatTeam branded performance t-shirt",
            price: 24.99,
            image: "/api/placeholder/300/300",
            category: "apparel",
            inStock: true
          },
          {
            id: 3,
            name: "Resistance Bands Set",
            description: "Complete set of resistance bands for strength training",
            price: 29.99,
            image: "/api/placeholder/300/300",
            category: "equipment",
            inStock: true
          },
          {
            id: 4,
            name: "Workout Water Bottle",
            description: "Insulated water bottle with measurement markers",
            price: 19.99,
            image: "/api/placeholder/300/300",
            category: "accessories",
            inStock: false
          },
          {
            id: 5,
            name: "Creatine Monohydrate",
            description: "Pure creatine for enhanced performance",
            price: 34.99,
            image: "/api/placeholder/300/300",
            category: "supplements",
            inStock: true
          },
          {
            id: 6,
            name: "SweatTeam Hoodie",
            description: "Comfortable hoodie for post-workout wear",
            price: 54.99,
            image: "/api/placeholder/300/300",
            category: "apparel",
            inStock: true
          }
        ];
        setProducts(mockProducts);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    alert('Checkout functionality will be implemented in the next update.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-200 dark:bg-neutral-800">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-200 dark:bg-neutral-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Shop</h1>
          <button
            onClick={() => setShowCart(!showCart)}
            className="relative px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cart ({cart.reduce((total, item) => total + item.quantity, 0)})
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-md capitalize transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-neutral-900 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-800'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg overflow-hidden">
                  <div className="h-48 bg-gray-200 dark:bg-neutral-700 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">Product Image</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{product.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        product.inStock 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={!product.inStock}
                      className={`w-full py-2 rounded-md transition-colors ${
                        product.inStock
                          ? 'bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shopping Cart Sidebar */}
          {showCart && (
            <div className="w-80 bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 h-fit">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Shopping Cart</h2>
              
              {cart.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-700 pb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 dark:text-white">{item.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-200 dark:bg-neutral-700 rounded text-xs"
                          >
                            -
                          </button>
                          <span className="text-gray-800 dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 bg-gray-200 dark:bg-neutral-700 rounded text-xs"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-neutral-700 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-gray-800 dark:text-white">Total:</span>
                      <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                        ${getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={handleCheckout}
                      className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> This is a demo version of the shop. Payment processing and order fulfillment will be implemented in the next update.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Shop; 