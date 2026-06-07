"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from django.shortcuts import redirect
from django.http import HttpResponse

def home(request):
    return HttpResponse("Voting API is running 🚀")
urlpatterns = [
    # Root: redirect to API index (change if you want a frontend served here)
    path('', home),
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/elections/', include('elections.urls')),
    path('api/candidates/', include('candidates.urls')),
    path('api/votes/', include('votes.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
