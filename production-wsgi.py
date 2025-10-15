"""
WSGI config for todofast project - Production optimized version.
"""

import os
import sys
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(project_dir))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')

try:
    from django.core.wsgi import get_wsgi_application
    
    # Pre-load Django for better performance
    application = get_wsgi_application()
    
except Exception as e:
    # Log startup errors
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to start WSGI application: {e}")
    raise

# Optional: Add middleware for production monitoring
class ProductionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response
