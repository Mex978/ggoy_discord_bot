import peewee

db = peewee.SqliteDatabase("users.db")


class BaseModel(peewee.Model):
    class Meta:
        database = db


class User(BaseModel):
    user_id = peewee.IntegerField(unique=True)
    level = peewee.IntegerField()
    xp = peewee.FloatField()
    xp_needed = peewee.FloatField()
