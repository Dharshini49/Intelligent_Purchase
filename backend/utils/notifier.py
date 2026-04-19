import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

class Notifier:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def send_price_alert(self, user_email, product_name, alert_type):
        """Send email notification to user"""
        
        # For demo purposes, just log the notification
        # In production, you would configure SMTP settings
        
        messages = {
            'BEST_TIME_TO_BUY': f"Best time to buy {product_name}! Great deal detected.",
            'PRICE_DROP': f"Price dropped for {product_name}! Check it out.",
            'SURGE_WARNING': f"Price may increase soon for {product_name}. Consider buying now."
        }
        
        message = messages.get(alert_type, f"Price alert for {product_name}")
        
        self.logger.info(f"Notification to {user_email}: {message}")
        
        # Uncomment and configure for actual email sending
        """
        try:
            smtp_server = "smtp.gmail.com"
            smtp_port = 587
            sender_email = "your-email@gmail.com"
            sender_password = "your-password"
            
            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = user_email
            msg['Subject'] = f"Price Alert: {product_name}"
            
            body = message
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
            server.quit()
            
            self.logger.info(f"Email sent to {user_email}")
        except Exception as e:
            self.logger.error(f"Failed to send email: {e}")
        """
        
        return True