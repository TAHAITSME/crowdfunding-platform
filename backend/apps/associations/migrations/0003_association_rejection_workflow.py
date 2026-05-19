from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('associations', '0002_association_moderation_status'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='association',
            name='last_rejection_fields',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='association',
            name='last_rejection_reason',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='association',
            name='rejection_fields',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='association',
            name='rejection_reason',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='association',
            name='resubmitted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='association',
            name='reviewed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='association',
            name='reviewed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_association_requests', to=settings.AUTH_USER_MODEL),
        ),
    ]
