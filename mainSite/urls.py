from django.urls import path

from . import views

urlpatterns = [
    path('', views.indexView.as_view(), name='index'),
    path('CV/', views.CV, name='CV'),
    path('qualifications/', views.QualificationsView.as_view(),
         name='qualifications'),
    path('theses/<str:thesis_uuid>', views.ThesisView.as_view(),
         name='thesis'),
    path('FAQ/', views.FAQView.as_view(), name='FAQ'),
    path('contact/', views.contactView.as_view(), name='contact'),
]
