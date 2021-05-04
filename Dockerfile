FROM python:3.8-slim-buster
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt
COPY . .
CMD ["python", "manage.py", "test"]
# RUN python manage.py runserver --settings tpdw.settings.dev