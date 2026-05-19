from django.db import migrations, models


def populate_moderation_status(apps, schema_editor):
    Association = apps.get_model('associations', 'Association')
    Association.objects.filter(is_approved=True).update(moderation_status='approved')
    Association.objects.filter(is_approved=False).update(moderation_status='pending')


class Migration(migrations.Migration):

    dependencies = [
        ('associations', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='association',
            name='moderation_status',
            field=models.CharField(
                choices=[('pending', 'En attente'), ('approved', 'Approuvee'), ('rejected', 'Rejetee')],
                default='pending',
                max_length=20,
            ),
        ),
        migrations.RunPython(populate_moderation_status, migrations.RunPython.noop),
    ]
