"""
Modèle User — seul modèle Django avec vraie base de données.
Uniquement pour l'authentification. Les données métier sont dans SFMC DEs.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Utilisateur de l'app de monitoring.
    Étend AbstractUser Django pour garder toute la gestion auth native.
    """

    class Role(models.TextChoices):
        ADMIN   = 'admin',   'Administrateur'   # Configure règles, gère utilisateurs
        ANALYST = 'analyst', 'Analyste'         # Consulte, acquitte alertes
        VIEWER  = 'viewer',  'Lecteur'          # Lecture seule

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER,
        verbose_name='Rôle',
    )

    # On utilise l'email comme identifiant de connexion
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name        = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN

    @property
    def is_analyst(self) -> bool:
        return self.role in (self.Role.ADMIN, self.Role.ANALYST)
