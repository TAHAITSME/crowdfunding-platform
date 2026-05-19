from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


CREATE_SQL = """
CREATE TABLE `comment_reactions` (
  `id` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `comment_id` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `comment_reactions_comment_id_user_id_4e08c344_uniq` (`comment_id`, `user_id`),
  KEY `comment_reactions_comment_id_87c59446_fk_comments_id` (`comment_id`),
  KEY `comment_reactions_user_id_de8dbdab_fk_users_id` (`user_id`),
  CONSTRAINT `comment_reactions_comment_id_87c59446_fk_comments_id`
    FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`),
  CONSTRAINT `comment_reactions_user_id_de8dbdab_fk_users_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

DROP_SQL = "DROP TABLE IF EXISTS `comment_reactions`;"


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("comments", "0001_initial"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(CREATE_SQL, DROP_SQL),
            ],
            state_operations=[
                migrations.CreateModel(
                    name="CommentReaction",
                    fields=[
                        ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                        ("created_at", models.DateTimeField(auto_now_add=True)),
                        ("comment", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reactions", to="comments.comment")),
                        ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comment_reactions", to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        "db_table": "comment_reactions",
                        "ordering": ["-created_at"],
                        "unique_together": {("comment", "user")},
                    },
                ),
            ],
        ),
    ]
