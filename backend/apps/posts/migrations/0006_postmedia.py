from django.db import migrations, models
import django.db.models.deletion
import uuid


CREATE_SQL = """
CREATE TABLE `post_media` (
  `id` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` integer unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `post_id` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `post_media_post_id_idx` (`post_id`),
  CONSTRAINT `post_media_post_id_fk_posts_id`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

DROP_SQL = "DROP TABLE IF EXISTS `post_media`;"


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0005_post_location"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(CREATE_SQL, DROP_SQL),
            ],
            state_operations=[
                migrations.CreateModel(
                    name="PostMedia",
                    fields=[
                        ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                        ("file", models.FileField(upload_to="posts/media/")),
                        ("sort_order", models.PositiveIntegerField(default=0)),
                        ("created_at", models.DateTimeField(auto_now_add=True)),
                        ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="media_items", to="posts.post")),
                    ],
                    options={
                        "db_table": "post_media",
                        "ordering": ["sort_order", "created_at"],
                    },
                ),
            ],
        ),
    ]
