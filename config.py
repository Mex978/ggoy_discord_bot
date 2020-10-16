import models


def create_table():
    try:
        models.User.create_table()
        print("Tabela 'User' criada com sucesso!")
    except peewee.OperationalError:
        print("Tabela 'User' ja existe!")
