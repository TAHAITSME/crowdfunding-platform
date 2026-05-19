# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def home(request):
    return JsonResponse({'message': 'Crowdfunding Platform API', 'status': 'running'})

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')), 
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.associations.urls')), 
    path('api/', include('apps.campaigns.urls')), 
    path('api/', include('apps.donations.urls')),
    path('api/', include('apps.posts.urls')),  
    path('api/', include('apps.reactions.urls')),
    path('api/', include('apps.comments.urls')),
    path('api/', include('apps.notifications.urls')),
    path('api/', include('apps.follows.urls')),
    path('api/', include('apps.friendships.urls')),
    path('api/messaging/', include('apps.messaging.urls')),
    path('api/', include('apps.users.urls')),
    path('api/donations/', include('apps.donations.urls')),

]

# Servir les fichiers médias en développement
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
