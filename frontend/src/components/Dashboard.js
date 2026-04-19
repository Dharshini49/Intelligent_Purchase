import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiPlus, FiTrendingUp, FiBell, FiShoppingBag, FiTrash2, 
  FiDollarSign, FiClock, FiZap, FiStar, FiTrendingDown,
  FiBarChart2, FiTarget, FiAward, FiActivity, FiChevronRight,
  FiRefreshCw, FiAlertCircle, FiCheckCircle, FiLoader
} from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    total_products: 0,
    buy_now: 0,
    wait: 0,
    buy_soon: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductUrl, setNewProductUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchStats();
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`, {
        withCredentials: true
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/stats`, {
        withCredentials: true
      });
      setStats(response.data || {
        total_products: 0,
        buy_now: 0,
        wait: 0,
        buy_soon: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchStats()]);
    setTimeout(() => setRefreshing(false), 1000);
    toast.success('Dashboard refreshed!');
  };

  const addProduct = async () => {
    if (!newProductUrl.trim()) {
      toast.error('Please enter a product URL');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/products`, 
        { url: newProductUrl },
        { withCredentials: true }
      );
      toast.success('Product added successfully!');
      setShowAddModal(false);
      setNewProductUrl('');
      await fetchProducts();
      await fetchStats();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.response?.data?.error || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId, event) => {
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to remove this product?')) {
      return;
    }
    
    setDeletingId(productId);
    try {
      await axios.delete(`${API_URL}/products/${productId}`, {
        withCredentials: true
      });
      toast.success('Product removed successfully');
      await fetchProducts();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to remove product');
    } finally {
      setDeletingId(null);
    }
  };

  const getFilteredProducts = () => {
    if (activeFilter === 'all') return products;
    if (activeFilter === 'buy_now') return products.filter(p => p.decision === 'BUY_NOW');
    if (activeFilter === 'buy_soon') return products.filter(p => p.decision === 'BUY_SOON');
    if (activeFilter === 'wait') return products.filter(p => p.decision === 'WAIT');
    return products;
  };

  const getDecisionColor = (decision) => {
    switch(decision) {
      case 'BUY_NOW': return '#10b981';
      case 'BUY_SOON': return '#f59e0b';
      default: return '#ef4444';
    }
  };

  const getDecisionBg = (decision) => {
    switch(decision) {
      case 'BUY_NOW': return 'rgba(16, 185, 129, 0.15)';
      case 'BUY_SOON': return 'rgba(245, 158, 11, 0.15)';
      default: return 'rgba(239, 68, 68, 0.15)';
    }
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.animatedBg}>
        <div style={{...styles.gradientOrb1, transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`}}></div>
        <div style={{...styles.gradientOrb2, transform: `translate(${mousePosition.x * -0.008}px, ${mousePosition.y * -0.008}px)`}}></div>
        <div style={{...styles.gradientOrb3, transform: `translate(${mousePosition.x * 0.005}px, ${mousePosition.y * -0.005}px)`}}></div>
      </div>

      {/* Floating Particles */}
      <div style={styles.particlesContainer}>
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.particle,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${8 + Math.random() * 12}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              opacity: 0.1 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>🛍️</div>
            <div>
              <h1 style={styles.logo}>Price Decision System</h1>
              <p style={styles.tagline}>AI-Powered Smart Shopping Assistant</p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.refreshButton} onClick={refreshData} disabled={refreshing}>
              <FiRefreshCw size={18} className={refreshing ? 'spin' : ''} />
            </button>
            <button style={styles.addButton} onClick={() => setShowAddModal(true)}>
              <FiPlus size={20} />
              <span>Track Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid with Animations */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard} className="stat-card">
          <div style={styles.statIconWrapper('#3b82f6')}>
            <FiShoppingBag size={24} color="#3b82f6" />
          </div>
          <div>
            <div style={styles.statValue}>
              <span className="stat-number">{stats.total_products}</span>
            </div>
            <div style={styles.statLabel}>Total Products</div>
          </div>
          <div style={styles.statTrend}>
            <FiBarChart2 size={16} />
          </div>
        </div>

        <div style={styles.statCard} className="stat-card">
          <div style={styles.statIconWrapper('#10b981')}>
            <FiZap size={24} color="#10b981" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.buy_now}</div>
            <div style={styles.statLabel}>Buy Now</div>
          </div>
          <div style={styles.statBadge('buy-now')}>Hot Deal</div>
        </div>

        <div style={styles.statCard} className="stat-card">
          <div style={styles.statIconWrapper('#f59e0b')}>
            <FiClock size={24} color="#f59e0b" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.buy_soon}</div>
            <div style={styles.statLabel}>Buy Soon</div>
          </div>
          <div style={styles.statBadge('buy-soon')}>Act Fast</div>
        </div>

        <div style={styles.statCard} className="stat-card">
          <div style={styles.statIconWrapper('#ef4444')}>
            <FiTrendingDown size={24} color="#ef4444" />
          </div>
          <div>
            <div style={styles.statValue}>{stats.wait}</div>
            <div style={styles.statLabel}>Wait</div>
          </div>
          <div style={styles.statBadge('wait')}>Patience</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.filterLeft}>
          <h2 style={styles.sectionTitle}>Your Products</h2>
          <span style={styles.productCount}>{filteredProducts.length} items</span>
        </div>
        <div style={styles.filterRight}>
          <button 
            style={activeFilter === 'all' ? styles.filterActive : styles.filterButton}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button 
            style={activeFilter === 'buy_now' ? styles.filterActive : styles.filterButton}
            onClick={() => setActiveFilter('buy_now')}
          >
            Buy Now
          </button>
          <button 
            style={activeFilter === 'buy_soon' ? styles.filterActive : styles.filterButton}
            onClick={() => setActiveFilter('buy_soon')}
          >
            Buy Soon
          </button>
          <button 
            style={activeFilter === 'wait' ? styles.filterActive : styles.filterButton}
            onClick={() => setActiveFilter('wait')}
          >
            Wait
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>No products found</h3>
          <p style={styles.emptyText}>Start tracking products to get AI-powered recommendations</p>
          <button style={styles.emptyButton} onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add Your First Product
          </button>
        </div>
      ) : (
        <div style={styles.productsGrid}>
          {filteredProducts.map((product, index) => {
            const savings = product.original_price && product.original_price > product.current_price 
              ? (product.original_price - product.current_price).toFixed(2) 
              : null;
            const decisionColor = getDecisionColor(product.decision);
            
            return (
              <div 
                key={product.id} 
                style={{
                  ...styles.productCard,
                  animationDelay: `${index * 0.05}s`,
                  transform: hoveredCard === product.id ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                }}
                className="product-card"
                onClick={() => navigate(`/product/${product.id}`)}
                onMouseEnter={() => setHoveredCard(product.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={styles.cardGlow}></div>
                <div style={styles.cardHeader}>
                  <div style={{...styles.decisionBadge, background: getDecisionBg(product.decision), color: decisionColor}}>
                    <span style={styles.decisionEmoji}>
                      {product.decision === 'BUY_NOW' && '🟢'}
                      {product.decision === 'BUY_SOON' && '🟡'}
                      {product.decision === 'WAIT' && '🔴'}
                    </span>
                    {product.decision === 'BUY_NOW' ? 'BUY NOW' : product.decision === 'BUY_SOON' ? 'BUY SOON' : 'WAIT'}
                  </div>
                  <button 
                    style={styles.deleteButton}
                    onClick={(e) => deleteProduct(product.id, e)}
                    disabled={deletingId === product.id}
                  >
                    {deletingId === product.id ? <FiLoader className="spin" /> : <FiTrash2 size={16} />}
                  </button>
                </div>

                <h3 style={styles.productName}>{product.name || 'Product'}</h3>
                
                <div style={styles.priceSection}>
                  <div style={styles.currentPrice}>
                    <span style={styles.currency}>$</span>
                    <span style={styles.priceAmount}>{(product.current_price || 0).toFixed(2)}</span>
                  </div>
                  {product.original_price && product.original_price > product.current_price && (
                    <div style={styles.originalPrice}>${product.original_price.toFixed(2)}</div>
                  )}
                </div>

                {savings && (
                  <div style={styles.savingsBadge}>
                    <FiStar size={12} />
                    <span>Save ${savings}</span>
                  </div>
                )}

                <div style={styles.confidenceSection}>
                  <div style={styles.confidenceLabel}>
                    <FiActivity size={12} />
                    <span>AI Confidence</span>
                  </div>
                  <div style={styles.confidenceBar}>
                    <div style={{
                      ...styles.confidenceFill,
                      width: `${product.confidence || 0}%`,
                      background: decisionColor
                    }} />
                  </div>
                  <div style={styles.confidenceValue}>{product.confidence || 0}%</div>
                </div>

                <div style={styles.cardFooter}>
                  <span style={styles.productId}>ID: {product.id}</span>
                  <span style={styles.viewDetails}>
                    View Details <FiChevronRight size={14} style={{ marginLeft: '4px' }} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Product</h3>
              <button style={styles.modalClose} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>Enter any product URL from Amazon, Flipkart, or any e-commerce store</p>
              <input
                type="text"
                style={styles.modalInput}
                placeholder="https://www.amazon.com/product/dp/..."
                value={newProductUrl}
                onChange={(e) => setNewProductUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addProduct()}
                autoFocus
              />
              <div style={styles.exampleUrls}>
                <span style={styles.exampleLabel}>Quick examples:</span>
                <button style={styles.exampleButton} onClick={() => setNewProductUrl('https://www.amazon.com/Sony-Headphones/dp/B0B4B8R8R9')}>
                  Sony Headphones
                </button>
                <button style={styles.exampleButton} onClick={() => setNewProductUrl('https://www.amazon.com/Apple-iPhone/dp/B0CM5J7L7T')}>
                  iPhone 15
                </button>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.modalCancel} onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button style={styles.modalSubmit} onClick={addProduct} disabled={loading}>
                {loading ? <FiLoader className="spin" /> : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-10px) translateX(5px); }
          66% { transform: translateY(10px) translateX(-5px); }
        }
        
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        @keyframes particleFloat {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        .stat-card {
          animation: slideIn 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }
        
        .product-card {
          animation: slideIn 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .spin {
          animation: rotate 1s linear infinite;
        }
        
        .stat-number {
          display: inline-block;
          animation: pulse 2s ease-in-out infinite;
        }
        
        button:hover .spin {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    padding: '20px',
    position: 'relative',
    overflowX: 'hidden',
  },
  animatedBg: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  gradientOrb1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(102,126,234,0.25) 0%, transparent 70%)',
    borderRadius: '50%',
    top: '-200px',
    left: '-200px',
    transition: 'transform 0.1s ease-out',
  },
  gradientOrb2: {
    position: 'absolute',
    width: '700px',
    height: '700px',
    background: 'radial-gradient(circle, rgba(245,87,108,0.2) 0%, transparent 70%)',
    borderRadius: '50%',
    bottom: '-300px',
    right: '-250px',
    transition: 'transform 0.1s ease-out',
  },
  gradientOrb3: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(79,172,254,0.2) 0%, transparent 70%)',
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'transform 0.1s ease-out',
  },
  particlesContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: '50%',
    animation: 'particleFloat linear infinite',
  },
  header: {
    position: 'relative',
    zIndex: 2,
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    marginBottom: '30px',
    padding: '20px 30px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  logoIcon: {
    fontSize: '40px',
    animation: 'float 3s ease-in-out infinite',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #fff 0%, #a0aec0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  tagline: {
    fontSize: '12px',
    color: '#a0aec0',
    margin: '4px 0 0',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  refreshButton: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '10px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  addButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  statsGrid: {
    position: 'relative',
    zIndex: 2,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  statIconWrapper: (color) => ({
    width: '50px',
    height: '50px',
    background: `${color}20`,
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: '13px',
    color: '#a0aec0',
    marginTop: '4px',
  },
  statTrend: {
    marginLeft: 'auto',
    color: '#10b981',
  },
  statBadge: (type) => ({
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: type === 'buy-now' ? 'rgba(16,185,129,0.2)' : type === 'buy-soon' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600',
    color: type === 'buy-now' ? '#10b981' : type === 'buy-soon' ? '#f59e0b' : '#ef4444',
  }),
  filterBar: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  filterLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
  },
  productCount: {
    background: 'rgba(102, 126, 234, 0.2)',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#a0aec0',
  },
  filterRight: {
    display: 'flex',
    gap: '10px',
  },
  filterButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#a0aec0',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  filterActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#ffffff',
    cursor: 'pointer',
  },
  productsGrid: {
    position: 'relative',
    zIndex: 2,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
  productCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(102,126,234,0.1) 0%, transparent 70%)',
    opacity: 0,
    transition: 'opacity 0.3s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  decisionBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  decisionEmoji: {
    fontSize: '12px',
  },
  deleteButton: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#ef4444',
    transition: 'all 0.3s',
  },
  productName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '15px',
    lineHeight: '1.4',
    minHeight: '44px',
  },
  priceSection: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
    marginBottom: '12px',
  },
  currentPrice: {
    display: 'flex',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#10b981',
    marginRight: '2px',
  },
  priceAmount: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#10b981',
  },
  originalPrice: {
    fontSize: '14px',
    textDecoration: 'line-through',
    color: '#a0aec0',
  },
  savingsBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(16, 185, 129, 0.15)',
    padding: '4px 10px',
    borderRadius: '10px',
    fontSize: '12px',
    color: '#10b981',
    marginBottom: '15px',
  },
  confidenceSection: {
    marginTop: '15px',
    marginBottom: '15px',
  },
  confidenceLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#a0aec0',
    marginBottom: '8px',
  },
  confidenceBar: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  confidenceValue: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'right',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '15px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    marginTop: '5px',
  },
  productId: {
    fontSize: '11px',
    color: '#a0aec0',
  },
  viewDetails: {
    fontSize: '12px',
    color: '#667eea',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
  },
  emptyState: {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    padding: '80px 20px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
    animation: 'float 3s ease-in-out infinite',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '10px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#a0aec0',
    marginBottom: '20px',
  },
  emptyButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease',
  },
  modal: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '24px',
    width: '90%',
    maxWidth: '500px',
    overflow: 'hidden',
    animation: 'slideIn 0.3s ease',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  modalHeader: {
    padding: '20px 25px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '32px',
    color: '#a0aec0',
    cursor: 'pointer',
    transition: 'color 0.3s',
  },
  modalBody: {
    padding: '25px',
  },
  modalText: {
    fontSize: '13px',
    color: '#a0aec0',
    marginBottom: '20px',
  },
  modalInput: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#ffffff',
    marginBottom: '15px',
    outline: 'none',
    transition: 'all 0.3s',
  },
  exampleUrls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  exampleLabel: {
    fontSize: '12px',
    color: '#a0aec0',
  },
  exampleButton: {
    background: 'rgba(102, 126, 234, 0.2)',
    border: '1px solid rgba(102, 126, 234, 0.3)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '11px',
    color: '#667eea',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  modalFooter: {
    padding: '20px 25px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  modalCancel: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#a0aec0',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  modalSubmit: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};

export default Dashboard;