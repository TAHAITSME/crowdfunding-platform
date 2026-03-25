from django.shortcuts import get_object_or_404
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.hashers import check_password

from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import User, Profile
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ProfileSerializer,
    MeProfileDetailSerializer,
    UserPublicSerializer,
)


# ─────────────────────────────────────────────
# 🔓 Register
# ─────────────────────────────────────────────
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


# ─────────────────────────────────────────────
# 👤 Profil public d'un utilisateur (par id)
# ─────────────────────────────────────────────
class UserPublicProfileView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.select_related('profile').all()
    serializer_class = UserPublicSerializer
    lookup_field = 'id'

    def get_serializer_context(self):
        return {'request': self.request}


# ─────────────────────────────────────────────
# 👤 Profil par pk (lecture/mise à jour)
# ─────────────────────────────────────────────
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_object(self):
        pk = self.kwargs.get("pk", self.request.user.id)
        return get_object_or_404(User, pk=pk)


# ─────────────────────────────────────────────
# 🙋 /me  – utilisateur connecté (lecture seule)
# ─────────────────────────────────────────────
class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─────────────────────────────────────────────
# 🙋 /me/profile – lecture + mise à jour profil
# ─────────────────────────────────────────────
class MeProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        user = request.user
        Profile.objects.get_or_create(user=user)
        serializer = MeProfileDetailSerializer(user, context={'request': request})
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            detail = MeProfileDetailSerializer(user, context={'request': request})
            return Response(detail.data)
        return Response(serializer.errors, status=400)


# ─────────────────────────────────────────────
# ✏️  Mise à jour user + profil (PATCH)
# ─────────────────────────────────────────────
class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user    = request.user
        profile = user.profile
        data    = request.data

        # ✅ Mettre à jour username s'il est fourni
        if 'username' in data and data['username']:
            new_username = data['username'].strip()
            if new_username != user.username:
                # Vérifier que l'username n'existe pas déjà
                if User.objects.filter(username=new_username).exclude(pk=user.pk).exists():
                    return Response({'error': 'Cet identifiant est déjà pris'}, status=400)
                user.username = new_username

        # ✅ full_name → first_name + last_name
        full_name = data.get('full_name', '')
        if full_name:
            parts = full_name.strip().split(' ', 1)
            user.first_name = parts[0]
            user.last_name  = parts[1] if len(parts) > 1 else ''
            user.full_name = full_name

        # Champs Profile
        for field in ['bio', 'headline', 'location', 'website', 'linkedin']:
            if field in data:
                setattr(profile, field, data[field])

        # Avatar
        if 'avatar' in request.FILES:
            profile.avatar = request.FILES['avatar']

        # Cover
        if 'cover_image' in request.FILES:
            profile.cover_image = request.FILES['cover_image']

        user.save()
        profile.save()

        # ✅ Retourner MeProfileDetailSerializer pour cohérence
        from .serializers import MeProfileDetailSerializer
        return Response(MeProfileDetailSerializer(user, context={'request': request}).data)


# ─────────────────────────────────────────────
# 🔑 Changement de mot de passe
# ─────────────────────────────────────────────
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not check_password(old_password, user.password):
            return Response({'error': 'Mot de passe actuel incorrect'}, status=400)
        if not new_password or len(new_password) < 8:
            return Response({'error': 'Minimum 8 caractères'}, status=400)

        user.set_password(new_password)
        user.save()
        # ✅ Maintenir la session active après changement de mot de passe
        update_session_auth_hash(request, user)
        return Response({'success': True})


# ─────────────────────────────────────────────
# 🔒 Basculer la confidentialité du profil
# ─────────────────────────────────────────────
class TogglePrivacyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        password   = request.data.get('password')
        is_private = request.data.get('is_private')

        if not check_password(password, user.password):
            return Response({'error': 'Mot de passe incorrect'}, status=400)

        profile = user.profile
        profile.is_private = is_private
        profile.save()
        return Response({'success': True, 'is_private': profile.is_private})
