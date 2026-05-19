from datetime import timedelta
from decimal import Decimal
from io import BytesIO
from pathlib import Path
import random

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import models, transaction
from django.utils import timezone
from PIL import Image, ImageDraw

from apps.associations.models import Association
from apps.campaigns.models import Campaign
from apps.comments.models import Comment, CommentReaction
from apps.donations.models import Donation
from apps.follows.models import Follow
from apps.friendships.models import Friendship
from apps.messaging.models import Conversation, Message
from apps.notifications.models import Notification
from apps.posts.models import Like, Post, PostMedia, SavedPost
from apps.users.models import Profile, User


DEMO_DOMAIN = "ydifydek.test"
DEMO_PASSWORD = "YdiFydek123!"
MEDIA_ROOT = Path(__file__).resolve().parents[5] / "media"
DEMO_USERNAMES = [
    "admin_ydifydek",
    "dar_hikma",
    "main_verte",
    "sourire_sante",
    "secours_oujda",
    "nour_jeunesse",
    "amani_mobilite",
    "abdelsalam",
    "salma_n",
    "youssef_b",
    "hanae_l",
    "ilyas_o",
    "sara_t",
    "mehdi_r",
    "nora_k",
]


class Command(BaseCommand):
    help = "Seed realistic demo data for the YdiFydek platform."

    def add_arguments(self, parser):
        parser.add_argument(
            "--keep-existing",
            action="store_true",
            help="Keep existing demo accounts instead of deleting and recreating them.",
        )

    def handle(self, *args, **options):
        random.seed(42)
        self.stdout.write("Seeding YdiFydek demo data...")
        with transaction.atomic():
            if not options["keep_existing"]:
                self._reset_demo_data()
            payload = self._build_demo_data()
        self.stdout.write(self.style.SUCCESS("Demo data ready."))
        self.stdout.write(f"Admin: {payload['admin'].email} / {DEMO_PASSWORD}")
        self.stdout.write(f"Sample donor: {payload['users'][0].email} / {DEMO_PASSWORD}")
        self.stdout.write(f"Sample association: {payload['association_users'][0].email} / {DEMO_PASSWORD}")

    def _reset_demo_data(self):
        demo_users = User.objects.filter(email__iendswith=f"@{DEMO_DOMAIN}") | User.objects.filter(username__in=DEMO_USERNAMES)
        demo_count = demo_users.count()
        if demo_count:
            self.stdout.write(f"Removing {demo_count} existing demo accounts...")
            demo_users.delete()

    def _build_demo_data(self):
        now = timezone.now()
        admin = self._create_admin()
        association_users = self._create_associations()
        users = self._create_regular_users()
        self._create_social_graph(users, association_users, now)
        campaigns = self._create_campaigns(association_users, now)
        posts = self._create_posts(association_users, users, now)
        self._create_post_interactions(posts, users, association_users, now)
        self._create_donations(campaigns, users, now)
        self._create_notifications(users, association_users, posts, campaigns, now)
        self._create_messages(users, association_users, posts, now)
        return {
            "admin": admin,
            "users": users,
            "association_users": association_users,
        }

    def _create_admin(self):
        admin = User.objects.create_user(
            username="admin_ydifydek",
            email=f"admin@{DEMO_DOMAIN}",
            password=DEMO_PASSWORD,
            role=User.ROLE_ADMIN,
            full_name="Admin YdiFydek",
            is_staff=True,
            is_superuser=True,
            is_verified=True,
        )
        profile, _ = Profile.objects.get_or_create(user=admin)
        profile.headline = "Supervision de la plateforme"
        profile.bio = "Compte administrateur de demonstration pour la moderation et le suivi global."
        profile.location = "Casablanca"
        profile.avatar.save("admin-avatar.png", self._image_file("Admin", "#0f766e", "#10b981"), save=True)
        return admin

    def _create_associations(self):
        definitions = [
            {
                "username": "dar_hikma",
                "email": f"dar.hikma@{DEMO_DOMAIN}",
                "full_name": "Association Dar Al Hikma",
                "phone": "0522001001",
                "location": "Casablanca",
                "bio": "Association marocaine dediee au soutien scolaire, aux bibliotheques de quartier et aux bourses pour les jeunes filles.",
                "headline": "Education, lecture et accompagnement",
                "status": Association.STATUS_APPROVED,
                "website": "https://dar-al-hikma.ma",
                "color": ("#065f46", "#10b981"),
            },
            {
                "username": "main_verte",
                "email": f"main.verte@{DEMO_DOMAIN}",
                "full_name": "Main Verte Atlas",
                "phone": "0522001002",
                "location": "Marrakech",
                "bio": "Collectifs d'agriculteurs, de benevoles et d'enseignants mobilises pour des potagers scolaires et la reforestation.",
                "headline": "Environnement et resilence locale",
                "status": Association.STATUS_APPROVED,
                "website": "https://mainverte-atlas.ma",
                "color": ("#14532d", "#22c55e"),
            },
            {
                "username": "sourire_sante",
                "email": f"sourire.sante@{DEMO_DOMAIN}",
                "full_name": "Sourire Sante Rabat",
                "phone": "0522001003",
                "location": "Rabat",
                "bio": "Actions de prevention, aide aux traitements lourds et accompagnement des familles en parcours de soin.",
                "headline": "Sante et dignite pour tous",
                "status": Association.STATUS_APPROVED,
                "website": "https://sourire-sante.ma",
                "color": ("#1d4ed8", "#38bdf8"),
            },
            {
                "username": "secours_oujda",
                "email": f"secours.oujda@{DEMO_DOMAIN}",
                "full_name": "Secours Solidaire Oujda",
                "phone": "0522001004",
                "location": "Oujda",
                "bio": "Interventions d'urgence, colis alimentaires, kits d'hiver et appui rapide apres sinistres.",
                "headline": "Urgence sociale et reponse rapide",
                "status": Association.STATUS_APPROVED,
                "website": "https://secours-oujda.ma",
                "color": ("#991b1b", "#f97316"),
            },
            {
                "username": "nour_jeunesse",
                "email": f"nour.jeunesse@{DEMO_DOMAIN}",
                "full_name": "Nour Jeunesse Fes",
                "phone": "0522001005",
                "location": "Fes",
                "bio": "Projet en attente de validation autour de l'insertion des jeunes, du numerique et de l'entrepreneuriat social.",
                "headline": "Insertion et avenir des jeunes",
                "status": Association.STATUS_PENDING,
                "website": "https://nour-jeunesse.ma",
                "color": ("#7c2d12", "#fb923c"),
            },
            {
                "username": "amani_mobilite",
                "email": f"amani.mobilite@{DEMO_DOMAIN}",
                "full_name": "Amani Mobilite Inclusive",
                "phone": "0522001006",
                "location": "Tanger",
                "bio": "Association orientee handicap et transport adapte, dossier a corriger avant validation.",
                "headline": "Mobilite inclusive",
                "status": Association.STATUS_REJECTED,
                "website": "https://amani-inclusive.ma",
                "color": ("#5b21b6", "#a78bfa"),
            },
        ]

        users = []
        for index, item in enumerate(definitions):
            user = User.objects.create_user(
                username=item["username"],
                email=item["email"],
                password=DEMO_PASSWORD,
                role=User.ROLE_ASSOCIATION,
                full_name=item["full_name"],
                phone=item["phone"],
                is_verified=item["status"] == Association.STATUS_APPROVED,
            )
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.headline = item["headline"]
            profile.bio = item["bio"]
            profile.location = item["location"]
            profile.website = item["website"]
            profile.avatar.save(
                f"{item['username']}-avatar.png",
                self._image_file(item["full_name"], item["color"][0], item["color"][1]),
                save=False,
            )
            profile.cover_image.save(
                f"{item['username']}-cover.png",
                self._banner_file(item["headline"], item["color"][0], item["color"][1]),
                save=False,
            )
            profile.save()

            association = Association.objects.create(
                user=user,
                name=item["full_name"],
                description=item["bio"],
                location=item["location"],
                website=item["website"],
                moderation_status=item["status"],
                is_approved=item["status"] == Association.STATUS_APPROVED,
                document=self._pdf_file(item["full_name"]),
            )
            association.logo.save(
                f"{item['username']}-logo.png",
                self._image_file(item["full_name"], item["color"][1], item["color"][0]),
                save=False,
            )
            if item["status"] == Association.STATUS_REJECTED:
                association.rejection_fields = ["document", "location"]
                association.rejection_reason = "Le document fourni est incomplet et l'adresse legale doit etre precisee."
                association.last_rejection_fields = list(association.rejection_fields)
                association.last_rejection_reason = association.rejection_reason
            association.save()

            self._set_created_at(user, timezone.now() - timedelta(days=120 - index * 8))
            self._set_created_at(profile, timezone.now() - timedelta(days=120 - index * 8), update_fields=["updated_at"])
            self._set_created_at(association, timezone.now() - timedelta(days=115 - index * 8), update_fields=["updated_at"])
            users.append(user)
        return users

    def _create_regular_users(self):
        definitions = [
            ("abdelsalam", "Abdelsalam El Idrissi", "Casablanca", "Je soutiens les campagnes education et sante pour avoir un impact local concret.", "#0f766e", "#5eead4", "profiles/avatars/COQX0964_-_Copie.JPG"),
            ("salma_n", "Salma Naciri", "Rabat", "Donatrice reguliere pour l'aide sociale et les projets destines aux femmes rurales.", "#0f766e", "#34d399", None),
            ("youssef_b", "Youssef Bennis", "Fes", "Photographe benevole et relais de campagnes sur le terrain.", "#2563eb", "#60a5fa"),
            ("hanae_l", "Hanae Laghmari", "Marrakech", "J'aime suivre les initiatives environnementales et les projets de reboisement.", "#7c3aed", "#c084fc", None),
            ("ilyas_o", "Ilyas Ouhssine", "Agadir", "Donateur occasionnel sensible aux campagnes d'urgence et de sante.", "#ea580c", "#fdba74"),
            ("sara_t", "Sara Tahiri", "Tanger", "Engagee pour l'inclusion et l'accessibilite dans les associations marocaines.", "#db2777", "#f9a8d4", None),
            ("mehdi_r", "Mehdi Rami", "Meknes", "Benevole lors des collectes alimentaires et des maraudes sociales.", "#1d4ed8", "#93c5fd"),
            ("nora_k", "Nora Kabbaj", "Oujda", "Je partage surtout les publications associatives qui meritent plus de visibilite.", "#15803d", "#86efac", "profiles/avatars/image_1.png"),
        ]

        users = []
        for index, item in enumerate(definitions):
            username, full_name, location, bio, start, end, *rest = item
            source_avatar = rest[0] if rest else None
            user = User.objects.create_user(
                username=username,
                email=f"{username}@{DEMO_DOMAIN}",
                password=DEMO_PASSWORD,
                role=User.ROLE_USER,
                full_name=full_name,
                phone=f"06110010{index:02d}",
                cin=f"DEMO-CIN-{index:03d}",
                is_verified=True,
            )
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.headline = "Donateur solidaire"
            profile.bio = bio
            profile.location = location
            avatar_file = self._local_media_file(source_avatar) if source_avatar else None
            if avatar_file:
                profile.avatar.save(f"{username}-avatar{Path(source_avatar).suffix}", avatar_file, save=False)
            else:
                profile.avatar.save(f"{username}-avatar.png", self._image_file(full_name, start, end), save=False)
            profile.cover_image.save(f"{username}-cover.png", self._banner_file(location, start, end), save=False)
            profile.save()
            self._set_created_at(user, timezone.now() - timedelta(days=90 - index * 6))
            self._set_created_at(profile, timezone.now() - timedelta(days=90 - index * 6), update_fields=["updated_at"])
            users.append(user)
        return users

    def _create_social_graph(self, users, association_users, now):
        follow_pairs = [
            (users[0], association_users[0]),
            (users[0], association_users[2]),
            (users[1], association_users[0]),
            (users[1], association_users[3]),
            (users[2], association_users[1]),
            (users[2], association_users[0]),
            (users[3], association_users[1]),
            (users[3], association_users[2]),
            (users[4], association_users[3]),
            (users[5], association_users[2]),
            (users[5], association_users[5]),
            (users[6], association_users[0]),
            (users[6], association_users[3]),
            (users[7], association_users[1]),
            (users[7], association_users[3]),
            (users[0], users[1]),
            (users[0], users[2]),
            (users[1], users[3]),
            (users[2], users[4]),
            (users[5], users[0]),
        ]
        for index, (follower, following) in enumerate(follow_pairs):
            follow = Follow.objects.create(follower=follower, following=following)
            self._set_created_at(follow, now - timedelta(days=40 - index))

        friendships = [
            (users[0], users[1], Friendship.ACCEPTED),
            (users[0], users[2], Friendship.ACCEPTED),
            (users[1], users[3], Friendship.ACCEPTED),
            (users[4], users[5], Friendship.PENDING),
            (users[6], users[0], Friendship.ACCEPTED),
        ]
        for index, (requester, addressee, status) in enumerate(friendships):
            friendship = Friendship.objects.create(requester=requester, addressee=addressee, status=status)
            self._set_created_at(friendship, now - timedelta(days=22 - index), update_fields=["updated_at"])

    def _create_campaigns(self, association_users, now):
        definitions = [
            (association_users[0], "Bourses de rentree pour 120 collegiennes", "education", Decimal("180000"), Decimal("126500"), 42, Campaign.STATUS_APPROVED, True, "posts/media/OIP.jpg"),
            (association_users[1], "1000 arbres fruitiers pour les ecoles rurales", "environment", Decimal("95000"), Decimal("70200"), 58, Campaign.STATUS_APPROVED, True, "campaigns/SierraLeone_2023_CG-7551.jpg"),
            (association_users[2], "Traitements solidaires pour enfants atteints de cancer", "health", Decimal("250000"), Decimal("241300"), 21, Campaign.STATUS_APPROVED, True, "posts/media/test.jpg"),
            (association_users[3], "Kits d'urgence pour familles sinistrees a Oujda", "emergency", Decimal("120000"), Decimal("120000"), -4, Campaign.STATUS_APPROVED, True, "posts/media/WhatsApp_Image_2026-02-22_at_12.41.57_6fd6c2e3.jpg"),
            (association_users[0], "Bibliotheque mobile pour douars isoles", "education", Decimal("140000"), Decimal("18000"), 67, Campaign.STATUS_PENDING, False, None),
            (association_users[1], "Nettoyage de l'oued et tri communautaire", "environment", Decimal("60000"), Decimal("0"), 28, Campaign.STATUS_REJECTED, False, None),
            (association_users[2], "Caravane de depistage dans les zones rurales", "health", Decimal("175000"), Decimal("83000"), 14, Campaign.STATUS_SUSPENDED, False, None),
            (association_users[3], "Aide alimentaire Ramadan quartier Al Qods", "humanitarian", Decimal("80000"), Decimal("49800"), 18, Campaign.STATUS_APPROVED, True, "campaigns/SierraLeone_2023_CG-7551.jpg"),
        ]

        campaigns = []
        for index, (association_user, title, category, goal, current, deadline_shift, status, is_active, source_image) in enumerate(definitions):
            campaign = Campaign.objects.create(
                association=association_user.association,
                title=title,
                description=self._campaign_description(title, association_user.association.name),
                goal_amount=goal,
                current_amount=current,
                category=category,
                deadline=now + timedelta(days=deadline_shift),
                status=status,
                is_active=is_active,
            )
            image_file = self._local_media_file(source_image) if source_image else None
            if image_file:
                suffix = Path(source_image).suffix or ".jpg"
                campaign.image.save(f"campaign-{index + 1}{suffix}", image_file, save=False)
            else:
                campaign.image.save(
                    f"campaign-{index + 1}.png",
                    self._banner_file(title, "#ecfdf5", "#10b981", size=(1280, 720)),
                    save=False,
                )
            campaign.save()
            self._set_created_at(campaign, now - timedelta(days=32 - index * 2), update_fields=["updated_at"])
            campaigns.append(campaign)
        return campaigns

    def _create_posts(self, association_users, users, now):
        posts = []
        definitions = [
            (association_users[0], "Aujourd'hui nous avons distribue 45 packs scolaires a Sidi Moumen. Merci aux donateurs qui rendent ces rentrees plus dignes.", "posts/media/OIP.jpg", "discussion"),
            (association_users[1], "Les premiers plants d'oliviers sont arrives dans l'ecole partenaire de Chichaoua. Les eleves commencent la mise en terre ce week-end.", "campaigns/SierraLeone_2023_CG-7551.jpg", "solidarity"),
            (association_users[2], "Notre equipe medicale a accompagne trois familles a l'hopital Ibn Sina cette semaine. La campagne continue pour couvrir les traitements.", "posts/media/test.jpg", "discussion"),
            (association_users[3], "Mise a jour terrain: 120 kits d'urgence ont deja ete livres apres les fortes pluies. Nous priorisons les familles avec enfants.", "posts/media/WhatsApp_Image_2026-02-22_at_12.41.57_6fd6c2e3.jpg", "solidarity"),
            (association_users[0], "Nous recherchons encore 20 benevoles pour animer les ateliers lecture du samedi matin.", False, "discussion"),
            (association_users[1], "Avant / apres sur une parcelle reboisee avec les jeunes du quartier. Le resultat motive tout le monde.", "campaigns/SierraLeone_2023_CG-7551.jpg", "discussion"),
            (association_users[2], "Merci a Dr. Amal et aux infirmieres benevoles pour la permanence pediatrique de ce mardi.", False, "discussion"),
            (association_users[3], "La collecte Ramadan couvre deja 312 colis. Nous ouvrons un second point de distribution la semaine prochaine.", "posts/media/OIP.jpg", "discussion"),
            (users[0], "Je viens de soutenir la campagne des bourses scolaires. Transparence, retours terrain et impact clair.", False, "discussion"),
            (users[3], "Le projet de reboisement me semble exemplaire. J'espere voir plus d'initiatives de ce type dans d'autres villes.", False, "discussion"),
            (users[5], "Les associations qui documentent bien leurs actions gagnent tout de suite en credibilite.", False, "discussion"),
        ]

        for index, (author, content, media_source, post_type) in enumerate(definitions):
            tagged = author.association if getattr(author, "association", None) and post_type == "solidarity" else None
            post = Post.objects.create(
                author=author,
                content=content,
                post_type=post_type,
                tagged_association=tagged,
                location_name=getattr(getattr(author, "profile", None), "location", "") or "",
            )
            if media_source:
                media = PostMedia.objects.create(
                    post=post,
                    sort_order=0,
                )
                local_file = self._local_media_file(media_source)
                suffix = Path(media_source).suffix or ".png"
                if local_file:
                    media.file.save(f"post-{index + 1}{suffix}", local_file, save=True)
                else:
                    media.file.save(
                        f"post-{index + 1}.png",
                        self._banner_file(content[:48], "#ffffff", "#a7f3d0", size=(1200, 900)),
                        save=True,
                    )
                post.media = media.file
                post.save(update_fields=["media"])
            self._set_created_at(post, now - timedelta(days=8 - min(index, 7), hours=index * 2), update_fields=["updated_at"])
            posts.append(post)
        return posts

    def _create_post_interactions(self, posts, users, association_users, now):
        like_map = {
            0: [users[0], users[1], users[2], users[6]],
            1: [users[2], users[3], users[7]],
            2: [users[0], users[4], users[5], users[6], users[7]],
            3: [users[1], users[4], users[6]],
            7: [users[0], users[1], users[3], users[5]],
            8: [association_users[0], users[1], users[2]],
        }
        for post_index, likers in like_map.items():
            for offset, liker in enumerate(likers):
                like = Like.objects.create(user=liker, post=posts[post_index])
                self._set_created_at(like, now - timedelta(days=post_index % 4, hours=offset + 1))

        comment_threads = [
            (posts[0], users[0], "Bravo pour la transparence. Avez-vous publie la liste des ecoles beneficiaires ?", [
                (association_users[0], "Oui, nous la publierons demain avec les photos terrain."),
                (users[2], "Excellent travail, je peux aider pour les photos si besoin."),
            ]),
            (posts[2], users[5], "Comment peut-on contribuer en dehors du don financier ?", [
                (association_users[2], "Nous avons aussi besoin de conducteurs benevoles et d'appui administratif."),
            ]),
            (posts[3], users[4], "La mise a jour est claire. Merci pour la rapidite d'intervention.", []),
            (posts[7], users[1], "Je peux aider a preparer des colis samedi prochain.", [
                (association_users[3], "Merci Salma, on vous ajoute au groupe benevole."),
            ]),
            (posts[8], users[3], "Entierement d'accord. Les preuves terrain font la difference.", []),
        ]

        for thread_index, (post, author, content, replies) in enumerate(comment_threads):
            comment = Comment.objects.create(post=post, author=author, content=content)
            self._set_created_at(comment, now - timedelta(days=thread_index, hours=2), update_fields=["updated_at"])
            for reply_offset, (reply_author, reply_content) in enumerate(replies):
                reply = Comment.objects.create(post=post, author=reply_author, content=reply_content, parent=comment)
                self._set_created_at(reply, now - timedelta(days=thread_index, hours=reply_offset + 1), update_fields=["updated_at"])

        first_comment = Comment.objects.filter(parent=None).first()
        if first_comment:
            reaction = CommentReaction.objects.create(comment=first_comment, user=users[1])
            self._set_created_at(reaction, now - timedelta(hours=6))

        SavedPost.objects.get_or_create(user=users[0], post=posts[2])
        SavedPost.objects.get_or_create(user=users[1], post=posts[0])
        SavedPost.objects.get_or_create(user=users[3], post=posts[7])

    def _create_donations(self, campaigns, users, now):
        donation_map = [
            (campaigns[0], users[0], Decimal("1500"), Donation.COMPLETED, "Pour soutenir les bourses de rentree."),
            (campaigns[0], users[1], Decimal("800"), Donation.COMPLETED, ""),
            (campaigns[0], users[6], Decimal("1200"), Donation.COMPLETED, "Bon courage a toute l'equipe."),
            (campaigns[1], users[2], Decimal("500"), Donation.COMPLETED, ""),
            (campaigns[1], users[3], Decimal("900"), Donation.COMPLETED, "Projet inspirant."),
            (campaigns[2], users[0], Decimal("2200"), Donation.COMPLETED, "Pour les familles accompagnees."),
            (campaigns[2], users[5], Decimal("3000"), Donation.COMPLETED, ""),
            (campaigns[2], users[7], Decimal("1500"), Donation.COMPLETED, ""),
            (campaigns[3], users[4], Decimal("700"), Donation.COMPLETED, "Soutien urgent."),
            (campaigns[7], users[1], Decimal("600"), Donation.COMPLETED, ""),
            (campaigns[7], users[3], Decimal("450"), Donation.PENDING, ""),
            (campaigns[6], users[5], Decimal("1000"), Donation.FAILED, ""),
        ]

        touched_campaigns = set()
        for index, (campaign, donor, amount, status, message) in enumerate(donation_map):
            donation = Donation.objects.create(
                campaign=campaign,
                donor=donor,
                amount=amount,
                status=status,
                message=message,
                is_anonymous=False,
            )
            self._set_created_at(donation, now - timedelta(days=10 - min(index, 9), hours=index), update_fields=[])
            touched_campaigns.add(campaign.id)

        for campaign in Campaign.objects.filter(id__in=touched_campaigns).select_related("association"):
            total = (
                Donation.objects.filter(campaign=campaign, status=Donation.COMPLETED)
                .aggregate(total=models.Sum("amount"))
            )
            completed_total = total["total"] or Decimal("0")
            campaign.current_amount = max(campaign.current_amount, completed_total)
            campaign.save(update_fields=["current_amount", "updated_at"])
            campaign.association.total_collected = (
                Donation.objects.filter(
                    campaign__association=campaign.association,
                    status=Donation.COMPLETED,
                ).aggregate(total=models.Sum("amount"))["total"] or Decimal("0")
            )
            campaign.association.save(update_fields=["total_collected", "updated_at"])

    def _create_notifications(self, users, association_users, posts, campaigns, now):
        notifications = [
            (association_users[0], users[0], Notification.DONATION, "Nouveau don recu", "Abdelsalam a soutenu votre campagne education."),
            (association_users[2], users[5], Notification.DONATION, "Nouveau don recu", "Sara a effectue un don de 3000 MAD."),
            (association_users[0], users[2], Notification.COMMENT, "Nouveau commentaire sur votre post", "Youssef a commente votre publication recente."),
            (users[0], association_users[0], Notification.FOLLOW, "Nouvelle association suivie", "Dar Al Hikma partage de nouvelles actions terrain."),
            (users[1], association_users[3], Notification.FOLLOW, "Nouvelle publication disponible", "Secours Solidaire Oujda a publie une mise a jour."),
            (users[0], users[6], Notification.MESSAGE, "Nouveau message", "Mehdi vous a envoye un message prive."),
        ]
        for index, (recipient, sender, kind, title, message) in enumerate(notifications):
            notification = Notification.objects.create(
                recipient=recipient,
                sender=sender,
                type=kind,
                title=title,
                message=message,
                is_read=index % 3 == 0,
            )
            self._set_created_at(notification, now - timedelta(hours=3 * (index + 1)), update_fields=[])

    def _create_messages(self, users, association_users, posts, now):
        conv1 = Conversation.objects.create()
        conv1.participants.set([users[0], association_users[0]])
        self._set_created_at(conv1, now - timedelta(days=2), update_fields=["updated_at"])

        messages = [
            (conv1, users[0], Message.TYPE_TEXT, "Bonjour, je souhaite aider lors du prochain atelier lecture.", None),
            (conv1, association_users[0], Message.TYPE_TEXT, "Merci beaucoup. Nous avons besoin de benevoles samedi a 10h.", None),
            (conv1, users[0], Message.TYPE_SHARED_POST, "", posts[0]),
        ]
        for index, (conversation, sender, message_type, content, shared_post) in enumerate(messages):
            message = Message.objects.create(
                conversation=conversation,
                sender=sender,
                message_type=message_type,
                content=content,
                shared_post=shared_post,
                is_read=index < 2,
            )
            self._set_created_at(message, now - timedelta(days=1, hours=5 - index), update_fields=[])

        conv2 = Conversation.objects.create()
        conv2.participants.set([users[1], users[4]])
        self._set_created_at(conv2, now - timedelta(days=1), update_fields=["updated_at"])
        message = Message.objects.create(
            conversation=conv2,
            sender=users[1],
            message_type=Message.TYPE_TEXT,
            content="Je viens de voir une campagne d'urgence interessante. Je te l'envoie apres verification.",
            is_read=False,
        )
        self._set_created_at(message, now - timedelta(hours=9), update_fields=[])

    def _campaign_description(self, title, association_name):
        return (
            f"{association_name} porte l'action '{title}' avec un suivi terrain, des preuves d'impact et des mises a jour regulieres. "
            "Chaque contribution finance directement des besoins identifies par l'association et son reseau local."
        )

    def _image_file(self, label, start_color, end_color, size=(512, 512)):
        image = Image.new("RGB", size, start_color)
        draw = ImageDraw.Draw(image)
        width, height = size
        for step in range(height):
            ratio = step / max(height - 1, 1)
            r1, g1, b1 = self._hex_to_rgb(start_color)
            r2, g2, b2 = self._hex_to_rgb(end_color)
            color = (
                int(r1 + (r2 - r1) * ratio),
                int(g1 + (g2 - g1) * ratio),
                int(b1 + (b2 - b1) * ratio),
            )
            draw.line((0, step, width, step), fill=color)
        initials = "".join(part[0] for part in label.split()[:2]).upper() or "YD"
        draw.ellipse((96, 96, width - 96, height - 96), fill=(255, 255, 255, 235))
        draw.text((width / 2 - 38, height / 2 - 28), initials, fill=self._hex_to_rgb(start_color))
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return ContentFile(buffer.getvalue())

    def _banner_file(self, label, start_color, end_color, size=(1440, 560)):
        image = Image.new("RGB", size, start_color)
        draw = ImageDraw.Draw(image)
        width, height = size
        for index in range(0, width, 18):
            ratio = index / max(width - 1, 1)
            r1, g1, b1 = self._hex_to_rgb(start_color)
            r2, g2, b2 = self._hex_to_rgb(end_color)
            color = (
                int(r1 + (r2 - r1) * ratio),
                int(g1 + (g2 - g1) * ratio),
                int(b1 + (b2 - b1) * ratio),
            )
            draw.rectangle((index, 0, min(index + 18, width), height), fill=color)
        draw.rounded_rectangle((40, height - 160, width - 40, height - 40), radius=32, fill=(255, 255, 255))
        draw.text((72, height - 120), label[:80], fill=(15, 23, 42))
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        return ContentFile(buffer.getvalue())

    def _pdf_file(self, title):
        safe_title = title[:40].replace("(", "[").replace(")", "]")
        stream = f"BT /F1 12 Tf 20 140 Td ({safe_title}) Tj ET\n".encode("utf-8")
        objects = [
            b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
            b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
            b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
            f"4 0 obj << /Length {len(stream)} >> stream\n".encode("utf-8") + stream + b"endstream endobj\n",
            b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
        ]

        buffer = BytesIO()
        buffer.write(b"%PDF-1.4\n")
        offsets = [0]
        for obj in objects:
            offsets.append(buffer.tell())
            buffer.write(obj)
        xref_start = buffer.tell()
        buffer.write(f"xref\n0 {len(offsets)}\n".encode("utf-8"))
        buffer.write(b"0000000000 65535 f \n")
        for offset in offsets[1:]:
            buffer.write(f"{offset:010d} 00000 n \n".encode("utf-8"))
        buffer.write(f"trailer << /Root 1 0 R /Size {len(offsets)} >>\n".encode("utf-8"))
        buffer.write(f"startxref\n{xref_start}\n%%EOF".encode("utf-8"))
        return ContentFile(buffer.getvalue(), name=f"{title.lower().replace(' ', '-')}.pdf")

    def _set_created_at(self, instance, dt, update_fields=None):
        update_fields = update_fields if update_fields is not None else ["updated_at"]
        payload = {"created_at": dt}
        available_fields = {field.name for field in instance._meta.fields}
        for field in update_fields:
            if field not in available_fields:
                continue
            payload[field] = dt
        instance.__class__.objects.filter(pk=instance.pk).update(**payload)

    def _hex_to_rgb(self, value):
        value = value.lstrip("#")
        return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))

    def _local_media_file(self, relative_path):
        if not relative_path:
            return None
        source = MEDIA_ROOT / relative_path
        if not source.exists() or not source.is_file():
            return None
        return ContentFile(source.read_bytes())
