# Generated by Django 3.1.3 on 2021-01-28 11:45

from django.db import migrations, models
import mainSite.models


class Migration(migrations.Migration):

    dependencies = [
        ('mainSite', '0008_auto_20210127_1844'),
    ]

    operations = [
        migrations.AlterField(
            model_name='thesis',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to=mainSite.models.Thesis.upload_path),
        ),
    ]
