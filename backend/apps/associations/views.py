from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Association
from .serializers import (
    AssociationRegisterSerializer,
    AssociationRejectionSerializer,
    AssociationSelfRequestSerializer,
    AssociationSerializer,
)


class AssociationRegisterView(generics.CreateAPIView):
    serializer_class = AssociationRegisterSerializer
    permission_classes = [permissions.AllowAny]


class AssociationDetailView(generics.RetrieveAPIView):
    serializer_class = AssociationSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Association.objects.filter(is_approved=True)


class AssociationListView(generics.ListAPIView):
    serializer_class = AssociationSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Association.objects.filter(is_approved=True)


class ApproveAssociationView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            association = Association.objects.get(pk=pk)
        except Association.DoesNotExist:
            return Response({'error': 'Association non trouvee.'}, status=status.HTTP_404_NOT_FOUND)

        association.moderation_status = Association.STATUS_APPROVED
        association.is_approved = True
        association.reviewed_at = timezone.now()
        association.reviewed_by = request.user
        association.user.is_verified = True
        association.user.save(update_fields=['is_verified'])
        association.save(update_fields=['moderation_status', 'is_approved', 'reviewed_at', 'reviewed_by'])
        return Response({'message': f"Association '{association.name}' approuvee."})


class MeAssociationRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request):
        if request.user.role != 'association' or not hasattr(request.user, 'association'):
            return None
        return request.user.association

    def get(self, request):
        association = self.get_object(request)
        if not association:
            return Response({'error': 'Association non trouvee.'}, status=404)
        return Response(AssociationSelfRequestSerializer(association, context={'request': request}).data)

    def patch(self, request):
        association = self.get_object(request)
        if not association:
            return Response({'error': 'Association non trouvee.'}, status=404)

        serializer = AssociationSelfRequestSerializer(
            association,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        if serializer.is_valid():
            association = serializer.save()
            return Response(AssociationSelfRequestSerializer(association, context={'request': request}).data)
        return Response(serializer.errors, status=400)


class AdminAssociationReviewView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk, action):
        try:
            association = Association.objects.select_related('user').get(pk=pk)
        except Association.DoesNotExist:
            return Response({'error': 'Association non trouvee.'}, status=404)

        if action == 'approve':
            association.moderation_status = Association.STATUS_APPROVED
            association.is_approved = True
            association.rejection_fields = []
            association.rejection_reason = ''
            association.reviewed_at = timezone.now()
            association.reviewed_by = request.user
            association.user.is_verified = True
            association.user.save(update_fields=['is_verified'])
            association.save(update_fields=[
                'moderation_status', 'is_approved', 'rejection_fields',
                'rejection_reason', 'reviewed_at', 'reviewed_by',
            ])
            return Response(AssociationSerializer(association, context={'request': request}).data)

        if action == 'reject':
            serializer = AssociationRejectionSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            association.moderation_status = Association.STATUS_REJECTED
            association.is_approved = False
            association.rejection_fields = serializer.validated_data['rejection_fields']
            association.rejection_reason = serializer.validated_data['rejection_reason']
            association.last_rejection_fields = serializer.validated_data['rejection_fields']
            association.last_rejection_reason = serializer.validated_data['rejection_reason']
            association.reviewed_at = timezone.now()
            association.reviewed_by = request.user
            association.user.is_verified = False
            association.user.save(update_fields=['is_verified'])
            association.save(update_fields=[
                'moderation_status', 'is_approved', 'rejection_fields',
                'rejection_reason', 'last_rejection_fields', 'last_rejection_reason',
                'reviewed_at', 'reviewed_by',
            ])
            return Response(AssociationSerializer(association, context={'request': request}).data)

        return Response({'error': 'Action inconnue.'}, status=400)
