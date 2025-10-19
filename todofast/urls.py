"""
URL configuration for todofast project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('todo.api_urls')),
    path('api-auth/', include('rest_framework.urls')),
    path('', include('todo.urls')),
]

# Serve static files
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Serve React assets at /assets/ path (for production compatibility)
from django.views.static import serve
urlpatterns += [
    path('assets/<path:path>', serve, {'document_root': settings.STATIC_ROOT / 'assets'}),
    path('vite.svg', serve, {'document_root': settings.STATIC_ROOT}),
]
