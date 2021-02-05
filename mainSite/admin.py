from django.contrib import admin
from .models import GCSE, A_level, Degree, Thesis, FAQ_Question_Answer,Coursera_Course
# Register your models here.

admin.site.register(GCSE)
admin.site.register(A_level)
admin.site.register(Degree)
admin.site.register(Thesis)
admin.site.register(FAQ_Question_Answer)
admin.site.register(Coursera_Course)
