from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import time

class PriceUpdater:
    def __init__(self, app, scraper):
        self.app = app
        self.scraper = scraper
        self.scheduler = BackgroundScheduler()
        
    def start(self):
        """Start the price update scheduler"""
        
        # Schedule price updates every 6 hours
        self.scheduler.add_job(
            func=self.update_all_prices,
            trigger=IntervalTrigger(hours=6),
            id='price_updater',
            replace_existing=True
        )
        
        self.scheduler.start()
        print("Price updater scheduler started")
        
    def update_all_prices(self):
        """Update prices for all active products"""
        
        with self.app.app_context():
            from ..app import Product, PriceHistory, db
            
            products = Product.query.filter_by(is_active=True).all()
            
            for product in products:
                try:
                    # Scrape updated price
                    new_price = self.scraper.update_price(product)
                    
                    # Save new price
                    product.current_price = new_price
                    product.last_updated = datetime.utcnow()
                    
                    # Add to price history
                    price_history = PriceHistory(
                        product_id=product.id,
                        price=new_price
                    )
                    
                    db.session.add(price_history)
                    db.session.commit()
                    
                    print(f"Updated price for {product.name}: ${new_price}")
                    
                except Exception as e:
                    print(f"Failed to update {product.name}: {e}")
                    
            print(f"Price update completed for {len(products)} products")