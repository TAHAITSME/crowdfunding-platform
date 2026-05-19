from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('campaigns', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='campaign',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'En attente'),
                    ('approved', 'Approuvee'),
                    ('rejected', 'Rejetee'),
                    ('suspended', 'Suspendue'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]
