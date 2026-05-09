#!/bin/sh
set -e

echo ">>> Making migrations"
python manage.py makemigrations employees attendance leaves salary --no-input

echo ">>> Running migrations"
python manage.py migrate --no-input

echo ">>> Ensuring superuser exists"
python manage.py shell <<'PYEOF'
import os
from django.contrib.auth import get_user_model
U = get_user_model()
u = os.environ.get("DJANGO_SUPERUSER_USERNAME")
e = os.environ.get("DJANGO_SUPERUSER_EMAIL")
p = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
if u and p and not U.objects.filter(username=u).exists():
    U.objects.create_superuser(username=u, email=e or "", password=p)
    print("Created superuser:", u)
else:
    print("Superuser exists or env vars missing; skipping.")
PYEOF

echo ">>> Collecting static files"
python manage.py collectstatic --no-input

echo ">>> Starting gunicorn on port ${PORT:-8000}"
exec gunicorn hrproject.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120 --access-logfile - --error-logfile -
