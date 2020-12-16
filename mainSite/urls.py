from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('CV/',views.CV,name='CV'),
    path('admin/',views.rickroll,name='rickroll')
]
