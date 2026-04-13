"""
Endpoints Auth — login, refresh token, profil utilisateur.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from .models import User
from .serializers import UserSerializer


class LoginView(APIView):
    """
    POST /api/auth/login/
    Body : { "email": "...", "password": "..." }
    Retourne : { "access": "...", "refresh": "...", "user": {...} }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response(
                {'error': 'Email ou mot de passe incorrect.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })


class RefreshView(APIView):
    """
    POST /api/auth/refresh/
    Renouvelle le token d'accès depuis le refresh token.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            refresh = RefreshToken(refresh_token)
            return Response({'access': str(refresh.access_token)})
        except Exception:
            return Response({'error': 'Token invalide ou expiré.'}, status=status.HTTP_401_UNAUTHORIZED)


class MeView(APIView):
    """GET /api/auth/me/ → profil de l'utilisateur connecté"""
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserListView(APIView):
    """GET /api/auth/users/ → liste les utilisateurs (admin seulement)"""
    def get(self, request):
        if not request.user.is_admin:
            return Response({'error': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.all()
        return Response(UserSerializer(users, many=True).data)
