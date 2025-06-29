from tortoise import Tortoise, fields
from tortoise.models import Model


# Define an asynchronous Test model
class Tests(Model):
    id = fields.IntField(primary_key=True, generated=True)
    title = fields.CharField(50)
    image = fields.TextField()
    edit_key = fields.UUIDField(unique=False)
    data = fields.JSONField()
