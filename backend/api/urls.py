from django.urls import path
from .views import route_view, autocomplete_view

urlpatterns = [
    path('route/', route_view, name='route'),
    path('autocomplete/', autocomplete_view, name='autocomplete'),
]
