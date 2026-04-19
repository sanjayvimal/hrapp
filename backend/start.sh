#!/bin/sh
set -e

echo ">>> Running migrations"
python manage.py migrate --no-input

echo ">>> Collecting static files"
python manage.py collectstatic --no-input

echo ">>> Starting gunicorn on port ${PORT:-8000}"
exec gunicorn hrproject.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120 --access-logfile - --error-logfile -
