import numpy as np
from ..app import PriceHistory

class SurgeDetector:
    def __init__(self, threshold=1.2):  # 20% increase threshold
        self.threshold = threshold
    
    def detect_surge(self, product_id):
        """Detect if price is surging or about to surge"""
        
        price_history = PriceHistory.query.filter_by(product_id=product_id).order_by(PriceHistory.timestamp).all()
        
        if len(price_history) < 10:
            return {'surge_detected': False, 'confidence': 0, 'message': 'Insufficient data'}
        
        prices = [ph.price for ph in price_history]
        
        # Calculate rolling statistics
        recent_prices = prices[-5:]  # Last 5 prices
        historical_prices = prices[:-5]  # Older prices
        
        recent_avg = np.mean(recent_prices)
        historical_avg = np.mean(historical_prices)
        
        # Detect surge
        if recent_avg > historical_avg * self.threshold:
            # Calculate surge confidence based on volatility
            volatility = np.std(recent_prices) / recent_avg
            confidence = min(100, int((recent_avg / historical_avg - 1) * 200))
            
            return {
                'surge_detected': True,
                'confidence': confidence,
                'message': f'Price has increased by {(recent_avg/historical_avg - 1)*100:.1f}% recently',
                'current_trend': 'increasing'
            }
        
        # Predict upcoming surge using momentum
        momentum = self._calculate_momentum(prices)
        
        if momentum > 0.05:  # Strong positive momentum
            return {
                'surge_detected': False,
                'confidence': min(80, int(momentum * 500)),
                'message': 'Price showing signs of increasing momentum',
                'current_trend': 'increasing'
            }
        
        return {
            'surge_detected': False,
            'confidence': 0,
            'message': 'No surge detected',
            'current_trend': 'stable'
        }
    
    def _calculate_momentum(self, prices):
        """Calculate price momentum"""
        if len(prices) < 5:
            return 0
        
        recent = np.mean(prices[-3:])
        older = np.mean(prices[-10:-3]) if len(prices) >= 10 else np.mean(prices[:-3])
        
        return (recent - older) / older if older > 0 else 0