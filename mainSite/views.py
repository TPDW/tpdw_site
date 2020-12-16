import os
from django.shortcuts import render, redirect
from django.http import HttpResponse,FileResponse


# Create your views here.
def index(request):
    return HttpResponse("Hello, world. You're at the index.")

def CV(request):
    pdf = open(r'mainSite\static\mainSite\PDFs\CV.pdf','rb')
    return FileResponse(pdf)

def rickroll(request):
    return redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
