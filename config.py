import models


def config_db():
    try:
        models.User.create_table()
        print("Tabela 'Users' criada com sucesso!")
    except peewee.OperationalError:
        print("Tabela 'Users' ja existe!")
