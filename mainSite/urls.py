from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('CV/', views.CV, name='CV'),
    path('qualifications/',views.QualificationsView.as_view(), name='qualifications'),
    path('theses/<str:thesis_uuid>',views.thesis_view,name='thesis'),
]
