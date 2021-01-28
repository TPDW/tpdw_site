from django.contrib import admin
from .models import GCSE, A_level, Degree, Thesis
# Register your models here.

admin.site.register(GCSE)
admin.site.register(A_level)
admin.site.register(Degree)
admin.site.register(Thesis)
