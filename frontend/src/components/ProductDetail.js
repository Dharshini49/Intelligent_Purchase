import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area
} from 'recharts';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, FiTrendingUp, FiTrendingDown, FiActivity, 
  FiDollarSign, FiClock, FiZap, FiStar, FiAward, FiShield,
  FiAlertCircle, FiCheckCircle, FiInfo, FiExternalLink,
  FiBarChart2, FiCalendar, FiPercent
} from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProductDetails();
    const interval = setInterval(fetchProductDetails, 60000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products/${id}`, {
        withCredentials: true
      });
      setProduct(response.data);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load product details');
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const getDecisionConfig = (decision) => {
    switch(decision) {
      case 'BUY_NOW':
        return {
          title: 'BUY NOW',
          icon: <FiZap size={24} />,
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)',
          message: 'Perfect time to purchase!'
        };
      case 'BUY_SOON':
        return {
          title: 'BUY BEFORE INCREASE',
          icon: <FiClock size={24} />,
          gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)',
          message: 'Price may increase soon!'
        };
      default:
        return {
          title: 'WAIT',
          icon: <FiTrendingDown size={24} />,
          gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          message: 'Better deals coming soon'
        };
    }
  };

  // Function to create evenly spaced chart data with clean intervals
  const prepareChartData = () => {
    if (!product || !product.price_history || product.price_history.length === 0) {
      return [];
    }

    // Get date range
    const dates = product.price_history.map(item => new Date(item.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date();
    
    // Create a map of actual prices by date
    const priceMap = new Map();
    product.price_history.forEach(item => {
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      priceMap.set(dateKey, item.price);
    });
    
    // Create daily data points
    const dailyData = [];
    const currentDate = new Date(minDate);
    
    while (currentDate <= maxDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const price = priceMap.get(dateKey);
      
      dailyData.push({
        date: new Date(currentDate),
        dateStr: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: price || null,
        fullDate: new Date(currentDate),
        isActual: price !== null
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Interpolate missing values
    for (let i = 0; i < dailyData.length; i++) {
      if (dailyData[i].price === null) {
        let prevPrice = null;
        let nextPrice = null;
        let prevIndex = -1;
        let nextIndex = -1;
        
        for (let j = i - 1; j >= 0; j--) {
          if (dailyData[j].price !== null) {
            prevPrice = dailyData[j].price;
            prevIndex = j;
            break;
          }
        }
        
        for (let j = i + 1; j < dailyData.length; j++) {
          if (dailyData[j].price !== null) {
            nextPrice = dailyData[j].price;
            nextIndex = j;
            break;
          }
        }
        
        if (prevPrice !== null && nextPrice !== null) {
          const totalSteps = nextIndex - prevIndex;
          const step = (nextPrice - prevPrice) / totalSteps;
          dailyData[i].price = parseFloat((prevPrice + (step * (i - prevIndex))).toFixed(2));
        } else if (prevPrice !== null) {
          dailyData[i].price = prevPrice;
        } else if (nextPrice !== null) {
          dailyData[i].price = nextPrice;
        }
      }
    }
    
    // Take last 30 days
    const last30Days = dailyData.slice(-30);
    
    // Create final data with evenly spaced ticks (show every 3-4 days)
    const finalData = last30Days.map(item => ({
      ...item,
      dateStr: item.dateStr
    }));
    
    return finalData;
  };

  // Prepare prediction data
  const preparePredictionData = () => {
    if (!product || !product.predictions || !product.predictions.prices) {
      return [];
    }
    
    const predictionData = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    
    for (let i = 0; i < product.predictions.prices.length; i++) {
      const predDate = new Date(startDate);
      predDate.setDate(startDate.getDate() + i);
      predictionData.push({
        date: predDate,
        dateStr: predDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: product.predictions.prices[i],
        isPrediction: true
      });
    }
    
    return predictionData;
  };

  // Custom tick formatter for X-axis - shows dates at consistent intervals
  const formatXAxisTick = (value, index, allData) => {
    if (!allData || allData.length === 0) return '';
    
    // Show every 4th tick (approximately every 3-4 days)
    if (index % 4 === 0 || index === allData.length - 1) {
      return allData[index]?.dateStr || '';
    }
    return '';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading product insights...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={styles.errorContainer}>
        <FiAlertCircle size={64} color="#ef4444" />
        <h2 style={styles.errorTitle}>Oops! Something went wrong</h2>
        <p style={styles.errorText}>{error || 'Product not found'}</p>
        <button style={styles.errorButton} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const decisionConfig = getDecisionConfig(product.recommendation?.decision);
  const discount = product.discount_info?.discount_percentage || 0;
  const savings = product.original_price && product.current_price 
    ? (product.original_price - product.current_price).toFixed(2) 
    : 0;

  // Prepare chart data
  const historyData = prepareChartData();
  const predictionData = preparePredictionData();
  
  // Combine data for chart
  const allChartData = [...historyData, ...predictionData].map(item => ({
    date: item.dateStr,
    historicalPrice: item.isPrediction ? null : item.price,
    predictedPrice: item.isPrediction ? item.price : null,
    fullDate: item.date
  }));

  // Calculate insights
  const prices = product.price_history?.map(p => p.price) || [];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / (prices.length || 1);
  const currentPrice = product.current_price;
  const percentAboveLowest = ((currentPrice - minPrice) / minPrice * 100).toFixed(0);

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.animatedBg}>
        <div style={styles.glowOrb1}></div>
        <div style={styles.glowOrb2}></div>
        <div style={styles.glowOrb3}></div>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/dashboard')}>
          <FiArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <div style={styles.headerActions}>
          {product.url && (
            <a href={product.url} target="_blank" rel="noopener noreferrer" style={styles.externalLink}>
              <FiExternalLink size={18} />
              <span>View on Store</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Product Title Section */}
        <div style={styles.titleSection}>
          <h1 style={styles.productTitle}>{product.name}</h1>
          <div style={styles.productId}>Product ID: {product.id}</div>
        </div>

        {/* Recommendation Card */}
        <div style={{...styles.recommendationCard, background: decisionConfig.gradient}}>
          <div style={styles.recommendationIcon}>{decisionConfig.icon}</div>
          <div style={styles.recommendationContent}>
            <div style={styles.recommendationLabel}>AI Recommendation</div>
            <div style={styles.recommendationTitle}>{decisionConfig.title}</div>
            <div style={styles.recommendationMessage}>{decisionConfig.message}</div>
          </div>
          <div style={styles.confidenceBadge}>
            <div style={styles.confidenceCircle}>
              <span style={styles.confidenceValue}>{product.recommendation?.confidence || 0}%</span>
              <span style={styles.confidenceLabel}>confidence</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><FiDollarSign size={24} color="#10b981" /></div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Current Price</div>
              <div style={styles.statValue}>${product.current_price?.toFixed(2)}</div>
              {product.original_price && (
                <div style={styles.statOldPrice}>${product.original_price?.toFixed(2)}</div>
              )}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}><FiPercent size={24} color="#f59e0b" /></div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Discount</div>
              <div style={styles.statValue}>{discount}% OFF</div>
              {savings > 0 && (
                <div style={styles.statSavings}>Save ${savings}</div>
              )}
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}><FiActivity size={24} color="#667eea" /></div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Price Trend</div>
              <div style={styles.statValue}>
                {product.predictions?.trend === 'upward' && <><FiTrendingUp /> Rising</>}
                {product.predictions?.trend === 'downward' && <><FiTrendingDown /> Falling</>}
                {product.predictions?.trend === 'stable' && <>Stable</>}
              </div>
              <div style={styles.statSubtext}>Next 7 days</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}><FiStar size={24} color="#f59e0b" /></div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>Seller Action</div>
              <div style={styles.statValue}>
                {product.seller_insights?.next_move_prediction || 'Analyzing...'}
              </div>
              <div style={styles.statSubtext}>Predicted move</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabNav}>
          <button 
            style={{...styles.tabButton, ...(activeTab === 'overview' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('overview')}
          >
            <FiBarChart2 /> Overview
          </button>
          <button 
            style={{...styles.tabButton, ...(activeTab === 'analysis' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('analysis')}
          >
            <FiActivity /> Analysis
          </button>
          <button 
            style={{...styles.tabButton, ...(activeTab === 'insights' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('insights')}
          >
            <FiInfo /> Insights
          </button>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === 'overview' && (
            <>
              {/* Price Chart with Clean Intervals */}
              <div style={styles.chartCard}>
                <div style={styles.chartHeader}>
                  <h3 style={styles.chartTitle}>Price History & Prediction</h3>
                  <div style={styles.chartLegend}>
                    <span><span style={{background: '#10b981'}}></span> Historical Price</span>
                    <span><span style={{background: '#f59e0b'}}></span> Predicted Price</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={allChartData}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#a0aec0" 
                      interval={Math.floor(allChartData.length / 8)} // Show ~8 ticks total
                      tick={{ fontSize: 11, fill: '#cbd5e0' }}
                      tickMargin={10}
                    />
                    <YAxis 
                      stroke="#a0aec0"
                      tick={{ fontSize: 11, fill: '#cbd5e0' }}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value) => [`$${value?.toFixed(2)}`, 'Price']}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#cbd5e0' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="historicalPrice" 
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      name="Historical Price"
                      dot={false}
                      activeDot={{ r: 6, fill: "#10b981" }}
                      connectNulls={true}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predictedPrice" 
                      stroke="#f59e0b" 
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                      name="Predicted Price"
                      dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div style={styles.chartFooter}>
                  <FiCalendar size={14} />
                  <span>Continuous daily timeline - Last 30 days history + 7 days forecast (showing key dates for clarity)</span>
                </div>
              </div>

              {/* Reasoning Section */}
              <div style={styles.reasoningCard}>
                <div style={styles.reasoningHeader}>
                  <FiInfo size={20} color="#667eea" />
                  <h3>Why this recommendation?</h3>
                </div>
                <p style={styles.reasoningText}>{product.recommendation?.reasoning}</p>
              </div>
            </>
          )}

          {activeTab === 'analysis' && (
            <div style={styles.analysisGrid}>
              <div style={styles.analysisCard}>
                <div style={styles.analysisIcon}><FiShield size={28} color="#10b981" /></div>
                <h4 style={styles.analysisTitle}>Discount Authenticity</h4>
                <div style={styles.analysisStatus}>
                  {product.discount_info?.is_genuine ? (
                    <><FiCheckCircle color="#10b981" /> <span style={{color: '#10b981'}}>Genuine Discount</span></>
                  ) : (
                    <><FiAlertCircle color="#ef4444" /> <span style={{color: '#ef4444'}}>Fake Discount Warning</span></>
                  )}
                </div>
                <p style={styles.analysisText}>{product.discount_info?.message}</p>
              </div>

              <div style={styles.analysisCard}>
                <div style={styles.analysisIcon}><FiTrendingUp size={28} color="#667eea" /></div>
                <h4 style={styles.analysisTitle}>Seller Strategy</h4>
                <div style={styles.analysisStatus}>
                  Confidence: <span style={{color: '#f59e0b'}}>{product.seller_insights?.confidence}%</span>
                </div>
                <p style={styles.analysisText}>{product.seller_insights?.message}</p>
                {product.seller_insights?.patterns?.map((pattern, i) => (
                  <div key={i} style={styles.patternBadge}>{pattern}</div>
                ))}
              </div>

              <div style={styles.analysisCard}>
                <div style={styles.analysisIcon}><FiAward size={28} color="#f59e0b" /></div>
                <h4 style={styles.analysisTitle}>Price Analysis</h4>
                <div style={styles.analysisStats}>
                  <div>📈 30-Day High: <span style={{color: '#ef4444'}}>${maxPrice.toFixed(2)}</span></div>
                  <div>📉 30-Day Low: <span style={{color: '#10b981'}}>${minPrice.toFixed(2)}</span></div>
                  <div>📊 Average: <span style={{color: '#667eea'}}>${avgPrice.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div style={styles.insightsContainer}>
              <div style={styles.insightCard}>
                <div style={styles.insightIcon}>💰</div>
                <div>
                  <h4 style={styles.insightTitle}>Best Time to Buy</h4>
                  <p style={styles.insightText}>Based on historical patterns, prices typically drop during weekends. Consider waiting for Saturday/Sunday for potential better deals.</p>
                </div>
              </div>
              <div style={styles.insightCard}>
                <div style={styles.insightIcon}>📊</div>
                <div>
                  <h4 style={styles.insightTitle}>Price Volatility</h4>
                  <p style={styles.insightText}>This product shows moderate price fluctuations. Setting up price alerts can help you catch the best deals when they appear.</p>
                </div>
              </div>
              <div style={styles.insightCard}>
                <div style={styles.insightIcon}>🎯</div>
                <div>
                  <h4 style={styles.insightTitle}>Target Price Analysis</h4>
                  <p style={styles.insightText}>
                    Historical lowest price was <strong style={{color: '#10b981'}}>${minPrice.toFixed(2)}</strong>. 
                    Current price is <strong style={{color: percentAboveLowest > 0 ? '#f59e0b' : '#10b981'}}>{percentAboveLowest}% above lowest</strong>.
                    {percentAboveLowest < 10 ? ' Great time to buy!' : ' Consider waiting for a better opportunity.'}
                  </p>
                </div>
              </div>
              <div style={styles.insightCard}>
                <div style={styles.insightIcon}>💡</div>
                <div>
                  <h4 style={styles.insightTitle}>Pro Tip</h4>
                  <p style={styles.insightText}>Based on seller patterns, prices tend to be {product.predictions?.trend === 'upward' ? 'increasing' : product.predictions?.trend === 'downward' ? 'decreasing' : 'stable'}. 
                  {product.predictions?.trend === 'upward' ? ' Consider buying sooner rather than later.' : 
                   product.predictions?.trend === 'downward' ? ' Watch for the price to drop further.' : 
                   ' Monitor for any sudden changes.'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
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
  glowOrb1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(102,126,234,0.3) 0%, transparent 70%)',
    borderRadius: '50%',
    top: '-100px',
    left: '-100px',
    animation: 'float 15s infinite ease-in-out',
  },
  glowOrb2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(245,87,108,0.2) 0%, transparent 70%)',
    borderRadius: '50%',
    bottom: '-150px',
    right: '-150px',
    animation: 'float 20s infinite ease-in-out reverse',
  },
  glowOrb3: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(79,172,254,0.2) 0%, transparent 70%)',
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    animation: 'pulse 8s infinite ease-in-out',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '3px solid rgba(102,126,234,0.3)',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    color: '#cbd5e0',
    fontSize: '14px',
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    textAlign: 'center',
    padding: '20px',
  },
  errorTitle: {
    fontSize: '24px',
    color: '#fff',
    marginTop: '20px',
  },
  errorText: {
    color: '#cbd5e0',
    marginTop: '10px',
  },
  errorButton: {
    marginTop: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  header: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  backButton: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '10px 20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontSize: '14px',
  },
  externalLink: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '10px 20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#fff',
    textDecoration: 'none',
    transition: 'all 0.3s',
    fontSize: '14px',
  },
  mainContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '1400px',
    margin: '0 auto',
  },
  titleSection: {
    marginBottom: '30px',
  },
  productTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '8px',
  },
  productId: {
    fontSize: '12px',
    color: '#a0aec0',
  },
  recommendationCard: {
    borderRadius: '20px',
    padding: '30px',
    marginBottom: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  },
  recommendationIcon: {
    width: '60px',
    height: '60px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationLabel: {
    fontSize: '12px',
    opacity: 0.8,
    marginBottom: '5px',
    color: '#fff',
  },
  recommendationTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '5px',
    color: '#fff',
  },
  recommendationMessage: {
    fontSize: '14px',
    opacity: 0.9,
    color: '#fff',
  },
  confidenceBadge: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '20px',
    padding: '15px',
  },
  confidenceCircle: {
    textAlign: 'center',
  },
  confidenceValue: {
    fontSize: '28px',
    fontWeight: '700',
    display: 'block',
    color: '#fff',
  },
  confidenceLabel: {
    fontSize: '11px',
    opacity: 0.8,
    color: '#fff',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  statIcon: {
    width: '50px',
    height: '50px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: '12px',
    color: '#a0aec0',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
  },
  statOldPrice: {
    fontSize: '12px',
    textDecoration: 'line-through',
    color: '#a0aec0',
  },
  statSavings: {
    fontSize: '12px',
    color: '#10b981',
  },
  statSubtext: {
    fontSize: '11px',
    color: '#a0aec0',
    marginTop: '4px',
  },
  tabNav: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '10px',
  },
  tabButton: {
    background: 'transparent',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    color: '#a0aec0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s',
    fontSize: '14px',
  },
  tabActive: {
    background: 'rgba(102,126,234,0.2)',
    color: '#667eea',
  },
  tabContent: {
    minHeight: '500px',
  },
  chartCard: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
  },
  chartLegend: {
    display: 'flex',
    gap: '15px',
    fontSize: '12px',
    color: '#a0aec0',
  },
  chartFooter: {
    marginTop: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#a0aec0',
  },
  reasoningCard: {
    background: 'rgba(102,126,234,0.1)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(102,126,234,0.3)',
  },
  reasoningHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  reasoningText: {
    color: '#e2e8f0',
    lineHeight: '1.6',
    fontSize: '14px',
  },
  analysisGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  analysisCard: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  analysisIcon: {
    marginBottom: '15px',
  },
  analysisTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '10px',
  },
  analysisStatus: {
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#e2e8f0',
  },
  analysisText: {
    fontSize: '13px',
    color: '#cbd5e0',
    marginTop: '10px',
    lineHeight: '1.5',
  },
  analysisStats: {
    marginTop: '10px',
    fontSize: '13px',
    color: '#cbd5e0',
    lineHeight: '1.8',
  },
  patternBadge: {
    background: 'rgba(102,126,234,0.2)',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '11px',
    color: '#a0aec0',
    display: 'inline-block',
    marginTop: '8px',
    marginRight: '8px',
  },
  insightsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  insightCard: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    gap: '15px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  insightIcon: {
    fontSize: '32px',
  },
  insightTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '8px',
  },
  insightText: {
    fontSize: '14px',
    color: '#cbd5e0',
    lineHeight: '1.5',
  },
};

export default ProductDetail;