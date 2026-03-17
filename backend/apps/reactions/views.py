from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, generics, status
from .models import Reaction
from .serializers import ReactionSerializer
from apps.posts.models import Post


class ReactToPostView(APIView):
    """Ajouter, modifier ou supprimer une réaction sur un post"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post          = generics.get_object_or_404(Post, pk=pk)
        reaction_type = request.data.get('reaction_type', Reaction.LIKE)

        reaction, created = Reaction.objects.get_or_create(
            user=request.user,
            post=post,
            defaults={'reaction_type': reaction_type}
        )

        if not created:
            if reaction.reaction_type == reaction_type:
                # Même réaction → on supprime (toggle off)
                reaction.delete()
                return Response({'message': 'Réaction retirée.'}, status=status.HTTP_200_OK)
            else:
                # Réaction différente → on met à jour
                reaction.reaction_type = reaction_type
                reaction.save()
                return Response({'message': f'Réaction changée en {reaction_type} ✅'})

        return Response({'message': f'Réaction {reaction_type} ajoutée ✅'}, status=status.HTTP_201_CREATED)


class PostReactionsListView(generics.ListAPIView):
    """Liste toutes les réactions d'un post + compteur par type"""
    serializer_class   = ReactionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Reaction.objects.filter(post_id=self.kwargs['pk'])

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        # Compteur par type de réaction
        from django.db.models import Count
        counts = queryset.values('reaction_type').annotate(count=Count('id'))
        return Response({
            'total':    queryset.count(),
            'counts':   list(counts),
            'reactions': ReactionSerializer(queryset, many=True).data
        })
