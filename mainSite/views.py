import os
from django.http import FileResponse, Http404
from django.views import generic
from django.conf import settings
from .models import GCSE, A_level, Degree, FAQ_Question_Answer, Coursera_Course


def CV(request):
    pdf = open(r'mainSite\static\mainSite\PDFs\CV.pdf', 'rb')
    return FileResponse(pdf)


class QualificationsView(generic.TemplateView):
    template_name = 'mainSite/qualifications.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['GCSE_list'] = GCSE.objects.all()
        context['A_level_list'] = A_level.objects.all()
        context['Degree_list'] = Degree.objects.all()
        context['Coursera_Course_list'] = Coursera_Course.objects.all()
        return context


def thesis_view(request, thesis_uuid):
    # TODO check if this works with non-pdf formats
    # if not, add file extension check such that other formats are downloaded
    filepath = settings.MEDIA_ROOT+'\\theses\\' + thesis_uuid
    file_list = os.listdir(filepath)
    filepath += "\\"+file_list[0]
    return FileResponse(open(filepath, 'rb'))


class ThesisView(generic.View):
    def get(self, request, *args, **kwargs):
        if 'thesis_uuid' in kwargs:
            thesis_uuid = kwargs['thesis_uuid']
            filepath = settings.MEDIA_ROOT+'\\theses\\' + thesis_uuid
            file_list = os.listdir(filepath)
            filepath += "\\"+file_list[0]
            return FileResponse(open(filepath, 'rb'))
        else:
            return Http404()

    def head(self, request, *args, **kwargs):
        return self.get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.get(request, *args, **kwargs)

    def options(self, request, *args, **kwargs):
        return self.get(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        return self.get(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        return self.get(request, *args, **kwargs)

    def patch(self, request, *args, **kwargs):
        return self.get(request, *args, **kwargs)


class FAQView(generic.TemplateView):
    template_name = 'mainSite/FAQ.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['FAQ_list'] = FAQ_Question_Answer.objects.all()
        return context


class indexView(generic.TemplateView):
    template_name = 'mainSite/index.html'


class contactView(generic.TemplateView):
    template_name = 'mainSite/contact.html'
