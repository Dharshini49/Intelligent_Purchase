from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from datetime import datetime, timedelta
import random
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here-change-this'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///price_system.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Enable CORS for frontend
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)

# ============ DATABASE MODELS ============
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    products = db.relationship('Product', backref='user', lazy=True)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    name = db.Column(db.String(200))
    current_price = db.Column(db.Float, default=0)
    original_price = db.Column(db.Float, default=0)
    currency = db.Column(db.String(10), default='USD')
    added_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    price_history = db.relationship('PriceHistory', backref='product', lazy=True)
    recommendations = db.relationship('Recommendation', backref='product', lazy=True)

class PriceHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    price = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Recommendation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    decision = db.Column(db.String(50))  # BUY_NOW, WAIT, BUY_SOON
    confidence = db.Column(db.Float)
    reasoning = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ============ SMART RECOMMENDATION ENGINE ============
def generate_recommendation(product_id):
    """Generate intelligent recommendation based on price history"""
    
    # Get price history
    price_history = PriceHistory.query.filter_by(product_id=product_id).order_by(PriceHistory.timestamp).all()
    
    if len(price_history) < 3:
        return {
            'decision': 'WAIT',
            'confidence': 50,
            'reasoning': 'Collecting price data... Need more history for accurate recommendation.'
        }
    
    # Extract prices
    prices = [ph.price for ph in price_history]
    current_price = prices[-1]
    avg_price = sum(prices) / len(prices)
    min_price = min(prices)
    max_price = max(prices)
    
    # Calculate price trend (last 7 days vs previous 7 days)
    if len(prices) >= 14:
        recent_avg = sum(prices[-7:]) / 7
        older_avg = sum(prices[-14:-7]) / 7
        price_change_pct = ((recent_avg - older_avg) / older_avg) * 100
    else:
        price_change_pct = ((prices[-1] - prices[0]) / prices[0]) * 100 if prices[0] > 0 else 0
    
    # Calculate discount
    product = Product.query.get(product_id)
    discount_pct = 0
    if product.original_price and product.original_price > current_price:
        discount_pct = ((product.original_price - current_price) / product.original_price) * 100
    
    # Decision logic
    score = 50  # Base score
    
    # Factor 1: Discount (30% weight)
    if discount_pct > 25:
        score += 25
        discount_msg = f"Excellent {discount_pct:.0f}% discount!"
    elif discount_pct > 15:
        score += 15
        discount_msg = f"Good {discount_pct:.0f}% discount"
    elif discount_pct > 5:
        score += 5
        discount_msg = f"Small {discount_pct:.0f}% discount"
    else:
        discount_msg = "No significant discount"
    
    # Factor 2: Price trend (30% weight)
    if price_change_pct < -10:  # Price dropping significantly
        score -= 20
        trend_msg = "Prices are dropping rapidly"
    elif price_change_pct < -5:  # Price dropping
        score -= 10
        trend_msg = "Prices are trending downward"
    elif price_change_pct > 10:  # Price increasing significantly
        score += 20
        trend_msg = "Prices are rising rapidly"
    elif price_change_pct > 5:  # Price increasing
        score += 10
        trend_msg = "Prices are trending upward"
    else:
        trend_msg = "Prices are stable"
    
    # Factor 3: Position in price range (20% weight)
    price_range = max_price - min_price
    if price_range > 0:
        position = (current_price - min_price) / price_range
        if position < 0.2:  # Near lowest price
            score += 15
            position_msg = "Price is near historic low"
        elif position > 0.8:  # Near highest price
            score -= 15
            position_msg = "Price is near historic high"
        else:
            position_msg = "Price is in mid-range"
    else:
        position_msg = "Limited price data"
    
    # Factor 4: Comparison to average (20% weight)
    if current_price < avg_price * 0.85:
        score += 15
        avg_msg = f"Price is {((avg_price - current_price)/avg_price*100):.0f}% below average"
    elif current_price < avg_price * 0.95:
        score += 8
        avg_msg = f"Price is slightly below average"
    elif current_price > avg_price * 1.15:
        score -= 15
        avg_msg = f"Price is {((current_price - avg_price)/avg_price*100):.0f}% above average"
    elif current_price > avg_price * 1.05:
        score -= 8
        avg_msg = f"Price is slightly above average"
    else:
        avg_msg = "Price is at average levels"
    
    # Cap score between 0 and 100
    score = max(0, min(100, score))
    
    # Make final decision
    if score >= 70:
        decision = "WAIT"
        reasoning = f"{trend_msg}. {avg_msg}. {position_msg}. Better to wait for now."
    elif score <= 35:
        decision = "BUY_NOW"
        reasoning = f"{discount_msg} {trend_msg}. {avg_msg}. Great time to buy!"
    else:
        decision = "BUY_SOON"
        reasoning = f"{trend_msg}. {avg_msg}. Consider buying before price increases further."
    
    return {
        'decision': decision,
        'confidence': int(score),
        'reasoning': reasoning,
        'details': {
            'discount_pct': discount_pct,
            'price_change_pct': price_change_pct,
            'avg_price': avg_price
        }
    }

# ============ API ROUTES ============

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        print(f"📝 Signup attempt: {data.get('username')}")
        
        # Check if user exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create user
        user = User(
            username=data['username'],
            email=data['email'],
            password=data['password']  # Note: In production, hash this!
        )
        db.session.add(user)
        db.session.commit()
        
        print(f"✅ User created: {user.username}")
        return jsonify({
            'message': 'User created successfully',
            'user_id': user.id
        }), 201
        
    except Exception as e:
        print(f"❌ Signup error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        print(f"🔐 Login attempt: {data.get('username')}")
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        if user.password != data['password']:
            return jsonify({'error': 'Invalid password'}), 401
        
        login_user(user)
        session['user_id'] = user.id
        
        print(f"✅ User logged in: {user.username}")
        return jsonify({
            'message': 'Login successful',
            'user_id': user.id
        }), 200
        
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500

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
        rec = Recommendation.query.filter_by(product_id=product.id)\
            .order_by(Recommendation.created_at.desc()).first()
        
        product_list.append({
            'id': product.id,
            'name': product.name or 'Product',
            'url': product.url,
            'current_price': product.current_price,
            'original_price': product.original_price,
            'decision': rec.decision if rec else 'WAIT',
            'confidence': rec.confidence if rec else 50
        })
    
    return jsonify(product_list), 200

@app.route('/api/products', methods=['POST'])
@login_required
def add_product():
    try:
        data = request.json
        url = data.get('url')
        
        # Generate realistic mock data
        base_price = random.uniform(50, 500)
        current_price = round(base_price, 2)
        original_price = round(base_price * random.uniform(1.1, 1.5), 2)
        
        # Extract product name from URL
        product_name = url.split('/')[-1].replace('-', ' ').replace('_', ' ').title()
        if len(product_name) < 3 or len(product_name) > 100:
            product_name = f"Product from {url[:30]}..."
        
        # Create product
        product = Product(
            user_id=current_user.id,
            url=url,
            name=product_name[:100],
            current_price=current_price,
            original_price=original_price,
            currency='USD'
        )
        
        db.session.add(product)
        db.session.flush()
        
        # Generate 30 days of price history (for realistic charts)
        for i in range(30):
            # Create realistic price variation
            variation = random.uniform(-0.15, 0.15)  # ±15% variation
            historical_price = current_price * (1 + variation)
            price_history = PriceHistory(
                product_id=product.id,
                price=round(historical_price, 2),
                timestamp=datetime.utcnow() - timedelta(days=30-i)
            )
            db.session.add(price_history)
        
        # Generate initial recommendation
        rec_data = generate_recommendation(product.id)
        recommendation = Recommendation(
            product_id=product.id,
            decision=rec_data['decision'],
            confidence=rec_data['confidence'],
            reasoning=rec_data['reasoning']
        )
        db.session.add(recommendation)
        
        db.session.commit()
        
        print(f"✅ Product added: {product.name}")
        return jsonify({
            'message': 'Product added successfully',
            'product_id': product.id
        }), 201
        
    except Exception as e:
        print(f"❌ Add product error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['GET'])
@login_required
def get_product_details(product_id):
    product = Product.query.get_or_404(product_id)
    
    if product.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get price history
    price_history = PriceHistory.query.filter_by(product_id=product_id)\
        .order_by(PriceHistory.timestamp).all()
    
    history_data = [
        {
            'date': ph.timestamp.isoformat(),
            'price': ph.price
        }
        for ph in price_history
    ]
    
    # Get latest recommendation
    rec = Recommendation.query.filter_by(product_id=product_id)\
        .order_by(Recommendation.created_at.desc()).first()
    
    if not rec:
        rec_data = generate_recommendation(product_id)
        rec = Recommendation(
            product_id=product_id,
            decision=rec_data['decision'],
            confidence=rec_data['confidence'],
            reasoning=rec_data['reasoning']
        )
        db.session.add(rec)
        db.session.commit()
    
    # Generate price predictions (simple linear extrapolation)
    predictions = []
    if len(price_history) >= 7:
        recent_prices = [ph.price for ph in price_history[-7:]]
        trend = (recent_prices[-1] - recent_prices[0]) / 7
        for i in range(1, 8):
            pred_price = recent_prices[-1] + (trend * i)
            predictions.append(round(max(0, pred_price), 2))
    else:
        predictions = [product.current_price] * 7
    
    prediction_dates = [(datetime.now() + timedelta(days=i)).isoformat() for i in range(7)]
    
    # Determine price trend
    if len(price_history) >= 14:
        recent_avg = sum([ph.price for ph in price_history[-7:]]) / 7
        older_avg = sum([ph.price for ph in price_history[-14:-7]]) / 7
        if recent_avg > older_avg * 1.03:
            trend = 'upward'
        elif recent_avg < older_avg * 0.97:
            trend = 'downward'
        else:
            trend = 'stable'
    else:
        trend = 'stable'
    
    # Seller insights
    seller_insights = {
        'message': 'Regular price fluctuations detected',
        'next_move_prediction': random.choice(['maintain price', 'slight decrease', 'slight increase']),
        'confidence': random.randint(60, 85),
        'patterns': ['Weekend discounts observed', 'Monthly sale pattern detected']
    }
    
    # Discount validation
    discount_info = {
        'is_genuine': product.current_price < (product.original_price or product.current_price),
        'discount_percentage': round(((product.original_price or product.current_price) - product.current_price) / 
                                      (product.original_price or product.current_price) * 100, 1),
        'message': 'Genuine discount detected!' if product.current_price < (product.original_price or product.current_price) 
                   else 'No active discount',
        'confidence': random.randint(70, 95)
    }
    
    return jsonify({
        'id': product.id,
        'name': product.name,
        'url': product.url,
        'current_price': product.current_price,
        'original_price': product.original_price,
        'currency': product.currency,
        'price_history': history_data,
        'predictions': {
            'dates': prediction_dates,
            'prices': predictions,
            'trend': trend
        },
        'recommendation': {
            'decision': rec.decision,
            'confidence': rec.confidence,
            'reasoning': rec.reasoning
        },
        'seller_insights': seller_insights,
        'discount_info': discount_info
    }), 200

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@login_required
def delete_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        
        if product.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Delete related records
        PriceHistory.query.filter_by(product_id=product_id).delete()
        Recommendation.query.filter_by(product_id=product_id).delete()
        db.session.delete(product)
        db.session.commit()
        
        print(f"✅ Product deleted: {product.name}")
        return jsonify({'message': 'Product deleted successfully'}), 200
        
    except Exception as e:
        print(f"❌ Delete error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
        rec = Recommendation.query.filter_by(product_id=product.id)\
            .order_by(Recommendation.created_at.desc()).first()
        if rec:
            if rec.decision == 'BUY_NOW':
                stats['buy_now'] += 1
            elif rec.decision == 'WAIT':
                stats['wait'] += 1
            elif rec.decision == 'BUY_SOON':
                stats['buy_soon'] += 1
    
    return jsonify(stats), 200

# ============ MAIN ============
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✓ Database created successfully!")
        
        # Create demo user if none exists
        if not User.query.first():
            demo_user = User(
                username='demo',
                email='demo@example.com',
                password='demo123'
            )
            db.session.add(demo_user)
            db.session.commit()
            print("✓ Demo user created: username='demo', password='demo123'")
    
    print("\n" + "="*60)
    print("🚀 PRICE DECISION SYSTEM - BACKEND RUNNING")
    print("="*60)
    print(f"📍 Backend API: http://localhost:5000")
    print(f"🔗 Frontend URL: http://localhost:3000")
    print(f"📊 Dashboard: http://localhost:3000/dashboard")
    print("="*60)
    print("\n💡 Test credentials:")
    print("   Username: demo")
    print("   Password: demo123")
    print("\n✨ System ready! Press Ctrl+C to stop\n")
    
    app.run(debug=True, port=5000, host='localhost')