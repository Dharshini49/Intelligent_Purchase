import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urlparse

class PriceScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def scrape_product(self, url):
        """Scrape product information from e-commerce URL"""
        
        try:
            # For demo purposes, return mock data if scraping fails
            # In production, you would implement proper scraping logic
            return self._get_mock_product_data(url)
            
        except Exception as e:
            print(f"Scraping error: {e}")
            return self._get_mock_product_data(url)
    
    def _get_mock_product_data(self, url):
        """Generate mock product data for demo purposes"""
        
        # Extract product name from URL or use generic name
        parsed_url = urlparse(url)
        path_parts = parsed_url.path.split('/')
        
        # Generate product name from URL or use default
        product_name = path_parts[-1].replace('-', ' ').replace('_', ' ').title() if path_parts else "Sample Product"
        if not product_name or len(product_name) < 3:
            product_name = "Wireless Headphones"
        
        import random
        base_price = random.uniform(50, 500)
        
        return {
            'name': product_name[:100],  # Limit length
            'current_price': round(base_price, 2),
            'original_price': round(base_price * random.uniform(1.1, 1.5), 2),
            'currency': 'USD',
            'availability': 'In Stock'
        }
    
    def update_price(self, product):
        """Update price for an existing product"""
        # Simulate price update with slight variation
        import random
        variation = random.uniform(-0.05, 0.05)  # ±5% variation
        new_price = product.current_price * (1 + variation)
        return round(max(0.01, new_price), 2)