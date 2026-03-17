# backend/apps/associations/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Association
from .serializers import AssociationRegisterSerializer, AssociationSerializer


class AssociationRegisterView(generics.CreateAPIView):
    """Inscription association — public"""
    serializer_class   = AssociationRegisterSerializer
    permission_classes = [permissions.AllowAny]


class AssociationDetailView(generics.RetrieveAPIView):
    """Voir le profil d'une association"""
    serializer_class   = AssociationSerializer
    permission_classes = [permissions.AllowAny]
    queryset           = Association.objects.filter(is_approved=True)


class AssociationListView(generics.ListAPIView):
    """Liste de toutes les associations approuvées"""
    serializer_class   = AssociationSerializer
    permission_classes = [permissions.AllowAny]
    queryset           = Association.objects.filter(is_approved=True)


class ApproveAssociationView(APIView):
    """Valider une association — réservé à l'admin"""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            association = Association.objects.get(pk=pk)
            association.is_approved = True
            association.user.is_verified = True
            association.user.save()
            association.save()
            return Response({'message': f"Association '{association.name}' approuvée."})
        except Association.DoesNotExist:
            return Response({'error': 'Association non trouvée.'}, status=status.HTTP_404_NOT_FOUND)
