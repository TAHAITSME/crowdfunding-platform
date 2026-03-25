from django.apps import AppConfig


class FollowsConfig(AppConfig):
    name = 'apps.follows'
    default_auto_field = 'django.db.models.BigAutoField'
    
    def ready(self):
        import apps.follows.signals
