# Generated by Django 3.1.3 on 2021-01-27 18:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mainSite', '0007_auto_20210127_1838'),
    ]

    operations = [
        migrations.AlterField(
            model_name='thesis',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to='theses/<django.db.models.fields.UUIDField>/'),
        ),
    ]
