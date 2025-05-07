from tortoise import Tortoise, fields
from tortoise.models import Model


# Define an asynchronous Test model
class Tests(Model):
    id = fields.IntField(primary_key=True, generated=True)
    name = fields.CharField(50)
    data = fields.JSONField()
