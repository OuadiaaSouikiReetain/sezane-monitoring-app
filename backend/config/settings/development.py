"""
Settings développement — DEBUG activé, SQLite, CORS ouvert.
"""
from .base import *

DEBUG = True

# ─── Auth désactivée en dev ───────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# SQLite en dev — uniquement pour l'auth utilisateurs
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS — accepter le frontend React en dev
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
]
CORS_ALLOW_CREDENTIALS = True

# Logs détaillés en dev
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'loggers': {
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
