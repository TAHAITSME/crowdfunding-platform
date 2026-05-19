from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_user_document_user_full_name_alter_user_cin'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='cin',
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
    ]
