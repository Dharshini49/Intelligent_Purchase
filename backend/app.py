from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from models.price_predictor import PricePredictor
from models.surge_detector import SurgeDetector
from models.seller_analyzer import SellerAnalyzer
from models.discount_validator import DiscountValidator
from models.decision_engine import DecisionEngine
from utils.scraper import PriceScraper
from utils.notifier import Notifier
from scheduler.price_updater import PriceUpdater
import json
import os

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Import models - Fix these imports
from models.price_predictor import PricePredictor
from models.surge_detector import SurgeDetector
from models.seller_analyzer import SellerAnalyzer
from models.discount_validator import DiscountValidator
from models.decision_engine import DecisionEngine
from utils.scraper import PriceScraper
from utils.notifier import Notifier


app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///price_system.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app, supports_credentials=True)
db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    preferences = db.Column(db.Text, default='{}')
    
    products = db.relationship('Product', backref='user', lazy=True)
    purchases = db.relationship('Purchase', backref='user', lazy=True)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    name = db.Column(db.String(200))
    current_price = db.Column(db.Float)
    original_price = db.Column(db.Float)
    currency = db.Column(db.String(10), default='USD')
    added_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    price_history = db.relationship('PriceHistory', backref='product', lazy=True)

class PriceHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    price = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'))
    price_paid = db.Column(db.Float)
    purchase_date = db.Column(db.DateTime, default=datetime.utcnow)

class Recommendation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    decision = db.Column(db.String(50))  # BUY_NOW, WAIT, BUY_SOON
    confidence = db.Column(db.Float)
    reasoning = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Initialize components
price_scraper = PriceScraper()
price_predictor = PricePredictor()
surge_detector = SurgeDetector()
seller_analyzer = SellerAnalyzer()
discount_validator = DiscountValidator()
decision_engine = DecisionEngine()
notifier = Notifier()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# API Routes
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username exists'}), 400
    
    from passlib.hash import pbkdf2_sha256
    hashed_password = pbkdf2_sha256.hash(data['password'])
    
    user = User(username=data['username'], email=data['email'], password=hashed_password)
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 401
    
    from passlib.hash import pbkdf2_sha256
    if pbkdf2_sha256.verify(data['password'], user.password):
        login_user(user)
        session['user_id'] = user.id
        return jsonify({'message': 'Login successful', 'user_id': user.id}), 200
    
    return jsonify({'error': 'Invalid password'}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    session.clear()
    return jsonify({'message': 'Logged out'}), 200

@app.route('/api/products', methods=['GET'])
@login_required
def get_products():
    products = Product.query.filter_by(user_id=current_user.id, is_active=True).all()
    
    product_list = []
    for product in products:
        # Get latest recommendation
        rec = Recommendation.query.filter_by(product_id=product.id).order_by(Recommendation.created_at.desc()).first()
        
        product_list.append({
            'id': product.id,
            'name': product.name,
            'url': product.url,
            'current_price': product.current_price,
            'original_price': product.original_price,
            'added_date': product.added_date.isoformat(),
            'decision': rec.decision if rec else 'WAIT',
            'confidence': rec.confidence if rec else 50
        })
    
    return jsonify(product_list), 200

@app.route('/api/products', methods=['POST'])
@login_required
def add_product():
    data = request.json
    url = data.get('url')
    
    # Scrape product info
    product_info = price_scraper.scrape_product(url)
    
    if not product_info:
        return jsonify({'error': 'Could not scrape product'}), 400
    
    product = Product(
        user_id=current_user.id,
        url=url,
        name=product_info['name'],
        current_price=product_info['current_price'],
        original_price=product_info.get('original_price'),
        currency=product_info.get('currency', 'USD')
    )
    
    db.session.add(product)
    db.session.flush()
    
    # Add initial price history
    price_history = PriceHistory(
        product_id=product.id,
        price=product_info['current_price']
    )
    db.session.add(price_history)
    
    db.session.commit()
    
    # Generate initial recommendation
    generate_recommendation(product.id)
    
    return jsonify({'message': 'Product added', 'product_id': product.id}), 201

@app.route('/api/products/<int:product_id>', methods=['GET'])
@login_required
def get_product_details(product_id):
    product = Product.query.get_or_404(product_id)
    
    if product.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get price history
    price_history = PriceHistory.query.filter_by(product_id=product_id).order_by(PriceHistory.timestamp).all()
    history_data = [{'date': ph.timestamp.isoformat(), 'price': ph.price} for ph in price_history]
    
    # Get recommendation
    rec = Recommendation.query.filter_by(product_id=product_id).order_by(Recommendation.created_at.desc()).first()
    
    # Get predictions
    predictions = price_predictor.predict_future_prices(product_id)
    
    # Analyze seller behavior
    seller_insights = seller_analyzer.analyze_seller(product_id)
    
    # Validate discount
    discount_info = discount_validator.validate_discount(product_id)
    
    return jsonify({
        'id': product.id,
        'name': product.name,
        'url': product.url,
        'current_price': product.current_price,
        'original_price': product.original_price,
        'price_history': history_data,
        'predictions': predictions,
        'recommendation': {
            'decision': rec.decision if rec else 'WAIT',
            'confidence': rec.confidence if rec else 50,
            'reasoning': rec.reasoning if rec else 'Analyzing data...'
        },
        'seller_insights': seller_insights,
        'discount_info': discount_info
    }), 200

@app.route('/api/products/<int:product_id>/recommendation', methods=['GET'])
@login_required
def get_recommendation(product_id):
    product = Product.query.get_or_404(product_id)
    
    if product.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    rec = generate_recommendation(product_id)
    
    return jsonify({
        'decision': rec.decision,
        'confidence': rec.confidence,
        'reasoning': rec.reasoning
    }), 200

@app.route('/api/dashboard/stats', methods=['GET'])
@login_required
def get_dashboard_stats():
    products = Product.query.filter_by(user_id=current_user.id, is_active=True).all()
    
    stats = {
        'total_products': len(products),
        'buy_now': 0,
        'wait': 0,
        'buy_soon': 0,
        'recent_alerts': []
    }
    
    for product in products:
        rec = Recommendation.query.filter_by(product_id=product.id).order_by(Recommendation.created_at.desc()).first()
        if rec:
            if rec.decision == 'BUY_NOW':
                stats['buy_now'] += 1
            elif rec.decision == 'WAIT':
                stats['wait'] += 1
            elif rec.decision == 'BUY_SOON':
                stats['buy_soon'] += 1
    
    return jsonify(stats), 200

def generate_recommendation(product_id):
    """Generate recommendation using all modules"""
    
    # Get product and its price history
    product = Product.query.get(product_id)
    price_history = PriceHistory.query.filter_by(product_id=product_id).order_by(PriceHistory.timestamp).all()
    
    if len(price_history) < 5:
        # Not enough data
        rec = Recommendation(
            product_id=product_id,
            decision='WAIT',
            confidence=50,
            reasoning='Not enough price history data yet. Please wait for more data points.'
        )
        db.session.add(rec)
        db.session.commit()
        return rec
    
    # Get predictions
    predictions = price_predictor.predict_future_prices(product_id)
    
    # Detect surge
    surge_detected = surge_detector.detect_surge(product_id)
    
    # Analyze seller
    seller_insights = seller_analyzer.analyze_seller(product_id)
    
    # Validate discount
    discount_info = discount_validator.validate_discount(product_id)
    
    # Get user behavior
    user_purchases = Purchase.query.filter_by(user_id=product.user_id).all()
    
    # Make decision
    decision_result = decision_engine.make_decision(
        current_price=product.current_price,
        price_history=[ph.price for ph in price_history],
        predictions=predictions,
        surge_detected=surge_detected,
        seller_insights=seller_insights,
        discount_info=discount_info,
        user_purchases=user_purchases
    )
    
    # Save recommendation
    rec = Recommendation(
        product_id=product_id,
        decision=decision_result['decision'],
        confidence=decision_result['confidence'],
        reasoning=decision_result['reasoning']
    )
    db.session.add(rec)
    db.session.commit()
    
    # Send notification if needed
    if decision_result['decision'] == 'BUY_NOW':
        notifier.send_price_alert(product.user.email, product.name, 'BEST_TIME_TO_BUY')
    
    return rec

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Start price updater scheduler
        updater = PriceUpdater(app, price_scraper)
        updater.start()
    
    app.run(debug=True, port=5000)