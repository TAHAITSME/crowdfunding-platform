import pymysql
from decouple import config

# Configuration
DB_USER = config("DB_USER", default="root")
DB_PASSWORD = config("DB_PASSWORD", default="abdellah")
DB_HOST = config("DB_HOST", default="localhost")
DB_PORT = config("DB_PORT", default="3306", cast=int)
DB_NAME = config("DB_NAME", default="crowdfunding_db")

try:
    # Connexion sans base de données spécifique
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        charset="utf8mb4"
    )
    
    with connection.cursor() as cursor:
        # Créer la base de données
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"✅ Base de données '{DB_NAME}' créée avec succès !")
    
    connection.commit()
    connection.close()
    
except pymysql.Error as e:
    print(f"❌ Erreur MySQL: {e}")
    print(f"Vérifiez que:")
    print(f"  - MySQL Server est en cours d'exécution")
    print(f"  - Les identifiants sont corrects (USER: {DB_USER}, PASSWORD: ****)")
    print(f"  - Le serveur est accessible sur {DB_HOST}:{DB_PORT}")
    exit(1)
