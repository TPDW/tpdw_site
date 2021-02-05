import os
from django.shortcuts import render, redirect
from django.http import HttpResponse, FileResponse
from django.views import generic
from .models import Qualification, GCSE, A_level, Degree, Thesis, FAQ_Question_Answer, Coursera_Course

# Create your views here.
# def index(request):
#     return HttpResponse("Hello, world. You're at the index.")

def CV(request):
    pdf = open(r'mainSite\static\mainSite\PDFs\CV.pdf','rb')
    return FileResponse(pdf)

def rickroll(request):
    return redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')

class QualificationsView(generic.TemplateView):
    template_name = 'mainSite/qualifications.html'
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['GCSE_list'] = GCSE.objects.all()
        context['A_level_list'] = A_level.objects.all()
        context['Degree_list'] = Degree.objects.all()
        context['Coursera_Course_list'] = Coursera_Course.objects.all()
        return context

def thesis_view(request,thesis_uuid):
    #TODO check if this works with non-pdf formats
    #if not, add file extension check such that other formats are downloaded
    filepath = 'theses\\' + thesis_uuid
    file_list = os.listdir(filepath)
    filepath += "\\"+file_list[0]
    return FileResponse(open(filepath,'rb'))


class FAQView(generic.TemplateView):
    template_name = 'mainSite/FAQ.html'
    def get_context_data(self,**kwargs):
        context = super().get_context_data(**kwargs)
        context['FAQ_list'] = FAQ_Question_Answer.objects.all()
        return context

class indexView(generic.TemplateView):
    template_name = 'base.html'
