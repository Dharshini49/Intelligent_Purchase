import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiMail, FiLock, FiUser, FiArrowRight, FiShield, 
  FiTrendingUp, FiShoppingBag, FiZap, FiStar 
} from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        localStorage.setItem('user_id', response.data.user_id);
        localStorage.setItem('username', username);
        setIsAuthenticated(true);
        toast.success('Welcome back! 🎉');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Animated Background Particles */}
      <div style={styles.particlesContainer}>
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.particle,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
            }}
          />
        ))}
      </div>

      {/* Animated Gradient Orbs */}
      <div style={styles.gradientOrb1}></div>
      <div style={styles.gradientOrb2}></div>
      <div style={styles.gradientOrb3}></div>
      
      {/* Floating Elements */}
      <div style={{...styles.floatingIcon1, transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`}}>
        <FiShoppingBag size={40} />
      </div>
      <div style={{...styles.floatingIcon2, transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * -0.015}px)`}}>
        <FiTrendingUp size={35} />
      </div>
      <div style={{...styles.floatingIcon3, transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * -0.01}px)`}}>
        <FiZap size={30} />
      </div>
      <div style={{...styles.floatingIcon4, transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * 0.01}px)`}}>
        <FiStar size={25} />
      </div>

      {/* Main Card */}
      <div style={styles.card}>
        <div style={styles.cardGlow}></div>
        
        {/* Logo Section */}
        <div style={styles.logoSection}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoIcon}>🛍️</div>
            <div style={styles.logoPulse}></div>
          </div>
          <h1 style={styles.title}>Price Decision System</h1>
          <p style={styles.subtitle}>AI-Powered Smart Shopping Assistant</p>
        </div>

        {/* Features Badge */}
        <div style={styles.featuresBadge}>
          <span style={styles.featureItem}>
            <FiShield size={12} /> Smart Analytics
          </span>
          <span style={styles.featureItem}>
            <FiTrendingUp size={12} /> Price Prediction
          </span>
          <span style={styles.featureItem}>
            <FiZap size={12} /> Real-time Alerts
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <div style={styles.inputIcon}>
              <FiUser size={18} />
            </div>
            <input
              type="text"
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
            <div style={styles.inputFocus}></div>
          </div>
          
          <div style={styles.inputGroup}>
            <div style={styles.inputIcon}>
              <FiLock size={18} />
            </div>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            <div style={styles.inputFocus}></div>
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? (
              <div style={styles.loader}></div>
            ) : (
              <>
                <span>Login to Dashboard</span>
                <FiArrowRight style={styles.buttonIcon} />
              </>
            )}
          </button>
        </form>
        
        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Don't have an account? <Link to="/signup" style={styles.link}>Create Account</Link>
          </p>
          
        </div>

        {/* Stats Bar */}
        
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-15px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes particleFloat {
          0% {
            transform: translateY(100vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(20px) rotate(360deg);
            opacity: 0;
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
        
        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
          }
          50% {
            box-shadow: 0 0 40px rgba(102, 126, 234, 0.8);
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: '50%',
    opacity: 0.3,
    animation: 'particleFloat linear infinite',
  },
  gradientOrb1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(102,126,234,0.3) 0%, transparent 70%)',
    borderRadius: '50%',
    top: '-250px',
    left: '-250px',
    animation: 'rotate 20s linear infinite',
  },
  gradientOrb2: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(245,87,108,0.2) 0%, transparent 70%)',
    borderRadius: '50%',
    bottom: '-300px',
    right: '-300px',
    animation: 'rotate 25s linear infinite reverse',
  },
  gradientOrb3: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(79,172,254,0.2) 0%, transparent 70%)',
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    animation: 'pulse 8s ease-in-out infinite',
  },
  floatingIcon1: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    color: 'rgba(102,126,234,0.3)',
    animation: 'float 6s ease-in-out infinite',
    transition: 'transform 0.1s ease-out',
  },
  floatingIcon2: {
    position: 'absolute',
    bottom: '20%',
    right: '12%',
    color: 'rgba(245,87,108,0.3)',
    animation: 'floatSlow 8s ease-in-out infinite',
    transition: 'transform 0.1s ease-out',
  },
  floatingIcon3: {
    position: 'absolute',
    top: '30%',
    right: '18%',
    color: 'rgba(79,172,254,0.3)',
    animation: 'float 7s ease-in-out infinite reverse',
    transition: 'transform 0.1s ease-out',
  },
  floatingIcon4: {
    position: 'absolute',
    bottom: '30%',
    left: '15%',
    color: 'rgba(255,255,255,0.2)',
    animation: 'floatSlow 9s ease-in-out infinite',
    transition: 'transform 0.1s ease-out',
  },
  card: {
    position: 'relative',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    borderRadius: '32px',
    padding: '50px',
    width: '100%',
    maxWidth: '480px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    animation: 'glowPulse 4s ease-in-out infinite',
  },
  cardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
    borderRadius: '34px',
    zIndex: -1,
    opacity: 0.3,
    filter: 'blur(20px)',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logoWrapper: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: '20px',
  },
  logoIcon: {
    fontSize: '64px',
    animation: 'float 3s ease-in-out infinite',
  },
  logoPulse: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '80px',
    height: '80px',
    background: 'rgba(102,126,234,0.3)',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    animation: 'pulse 2s ease-in-out infinite',
    zIndex: -1,
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #fff 0%, #a0aec0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#a0aec0',
  },
  featuresBadge: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '35px',
    flexWrap: 'wrap',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    color: '#a0aec0',
    background: 'rgba(255,255,255,0.05)',
    padding: '5px 12px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '25px',
  },
  inputGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '15px',
    color: '#667eea',
    zIndex: 2,
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 45px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '16px',
    fontSize: '14px',
    color: '#ffffff',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  inputFocus: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    width: 0,
    height: '2px',
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
    transition: 'all 0.3s ease',
    transform: 'translateX(-50%)',
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '16px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
    marginTop: '10px',
    position: 'relative',
    overflow: 'hidden',
  },
  buttonIcon: {
    transition: 'transform 0.3s ease',
  },
  loader: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'rotate 1s linear infinite',
  },
  footer: {
    textAlign: 'center',
  },
  footerText: {
    color: '#a0aec0',
    fontSize: '13px',
    marginBottom: '15px',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.3s ease',
  },
  demoCredentials: {
    background: 'rgba(102,126,234,0.1)',
    borderRadius: '16px',
    padding: '12px',
    border: '1px solid rgba(102,126,234,0.3)',
  },
  demoBadge: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  demoInfo: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    fontSize: '12px',
    color: '#cbd5e0',
  },
  statsBar: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: '30px',
    paddingTop: '25px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  statItem: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '10px',
    color: '#a0aec0',
  },
  statDivider: {
    width: '1px',
    height: '30px',
    background: 'rgba(255,255,255,0.1)',
  },
};

export default Login;