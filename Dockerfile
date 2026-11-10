# Owner: Orion Kabeza (DevOps) · AI-assisted draft, see AI_USE_LOG.md
# One image, one link: the API under /api/ and the web app at /. The same image runs the scheduler worker.
# NOTE: written but not yet built in the session that created it (no Docker daemon there). Build it once.

# 1. Build the web app
FROM node:22-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. The Python service
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 FRONTEND_DIST=/app/frontend_dist
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY --from=web /web/dist /app/frontend_dist
RUN useradd --create-home app && chown -R app /app
USER app
# collectstatic needs settings to load, so it gets throwaway values that exist only for this build step
RUN DJANGO_SECRET_KEY=build-only DATABASE_URL=postgres://x:x@localhost/x python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py seed_reference && gunicorn strokecare.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --access-logfile -"]
