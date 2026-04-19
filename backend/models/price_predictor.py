import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from ..app import db, PriceHistory, Product

class PricePredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
    
    def predict_future_prices(self, product_id, days=7):
        """Predict future prices for the next N days"""
        
        # Get price history
        price_history = PriceHistory.query.filter_by(product_id=product_id).order_by(PriceHistory.timestamp).all()
        
        if len(price_history) < 5:
            return self._generate_fallback_predictions()
        
        # Prepare data for training
        df = pd.DataFrame([(ph.timestamp, ph.price) for ph in price_history], columns=['date', 'price'])
        df['days_from_start'] = (df['date'] - df['date'].min()).dt.days
        
        # Train linear regression model
        X = df[['days_from_start']].values
        y = df['price'].values
        
        self.model.fit(X, y)
        
        # Predict future
        last_day = df['days_from_start'].max()
        future_days = np.arange(last_day + 1, last_day + days + 1).reshape(-1, 1)
        predictions = self.model.predict(future_days)
        
        # Calculate confidence intervals (simplified)
        residuals = y - self.model.predict(X)
        std_residuals = np.std(residuals)
        
        future_dates = [(datetime.now() + timedelta(days=i+1)).isoformat() for i in range(days)]
        
        return {
            'dates': future_dates,
            'prices': predictions.tolist(),
            'lower_bound': (predictions - 1.96 * std_residuals).tolist(),
            'upper_bound': (predictions + 1.96 * std_residuals).tolist(),
            'trend': self._get_trend(predictions)
        }
    
    def _generate_fallback_predictions(self):
        """Generate mock predictions when not enough data"""
        dates = [(datetime.now() + timedelta(days=i+1)).isoformat() for i in range(7)]
        prices = [100 + i * 2 for i in range(7)]
        
        return {
            'dates': dates,
            'prices': prices,
            'lower_bound': [p - 10 for p in prices],
            'upper_bound': [p + 10 for p in prices],
            'trend': 'neutral'
        }
    
    def _get_trend(self, predictions):
        """Determine price trend"""
        if len(predictions) < 2:
            return 'neutral'
        
        slope = (predictions[-1] - predictions[0]) / len(predictions)
        
        if slope > 0.01 * predictions[0]:  # More than 1% increase
            return 'upward'
        elif slope < -0.01 * predictions[0]:  # More than 1% decrease
            return 'downward'
        else:
            return 'stable'