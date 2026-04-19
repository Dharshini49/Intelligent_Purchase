import numpy as np
from ..app import PriceHistory

class DiscountValidator:
    def __init__(self):
        self.fake_discount_threshold = 0.15  # 15% threshold for fake detection
    
    def validate_discount(self, product_id):
        """Validate if discount is genuine or fake"""
        
        price_history = PriceHistory.query.filter_by(product_id=product_id).order_by(PriceHistory.timestamp).all()
        
        if len(price_history) < 10:
            return {
                'is_genuine': True,
                'confidence': 30,
                'message': 'Insufficient data for discount validation'
            }
        
        prices = [ph.price for ph in price_history]
        current_price = prices[-1]
        
        # Find the highest price in the last 30 days (or all data if less)
        lookback = min(30, len(prices))
        highest_price = max(prices[-lookback:])
        average_price = np.mean(prices[-lookback:])
        
        # Calculate discount percentage from highest price
        discount_from_highest = (highest_price - current_price) / highest_price if highest_price > 0 else 0
        
        # Check if this is a fake discount (inflated original price)
        # A genuine discount typically has consistent lower prices over time
        price_consistency = np.std(prices[-10:]) / average_price if average_price > 0 else 0
        
        is_genuine = discount_from_highest > 0 and price_consistency < 0.15
        
        # Additional check: if price was recently increased before discount
        recent_trend = self._check_price_inflation_before_discount(prices)
        
        if recent_trend['increased_before_discount']:
            is_genuine = False
        
        confidence = int(min(95, (1 - price_consistency) * 100)) if is_genuine else int(80)
        
        return {
            'is_genuine': is_genuine,
            'confidence': confidence,
            'discount_percentage': round(discount_from_highest * 100, 1),
            'message': 'Genuine discount detected!' if is_genuine else 'Warning: This may be a fake discount!',
            'details': recent_trend['message']
        }
    
    def _check_price_inflation_before_discount(self, prices):
        """Check if price was artificially inflated before discount"""
        
        if len(prices) < 20:
            return {'increased_before_discount': False, 'message': 'Insufficient data'}
        
        # Check last 20 prices
        recent = prices[-20:]
        
        # Look for a spike in prices before current low
        max_price_index = recent.index(max(recent))
        current_price = recent[-1]
        
        if max_price_index < len(recent) - 2 and recent[-1] < recent[max_price_index] * 0.85:
            return {
                'increased_before_discount': True,
                'message': 'Price was increased before discount - typical fake discount pattern'
            }
        
        return {
            'increased_before_discount': False,
            'message': 'No suspicious price inflation detected'
        }