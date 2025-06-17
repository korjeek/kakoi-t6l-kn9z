import uuid

from flask import json
from tortoise import Tortoise
from models import Tests
from uuid import uuid4


async def init_tortoise() -> None:
    await Tortoise.init(
        db_url='sqlite://db.sqlite3',
        modules={'models': ['models']}
    )
    await Tortoise.generate_schemas()

    test_file = open('hardcode_tests/knyaz_test.json', encoding="utf-8")
    json_data = json.load(test_file)
    initial_test = await Tests(title=json_data['title'], image=json_data['image'], data=json_data, edit_key=uuid4())
    await initial_test.save()


async def create_new_test(data: dict) -> Tests:
    return await Tests.create(title=data['title'], image=data['image'], data=data, edit_key=uuid4())


async def edit_test_by_id(test_id: int, data: dict) -> None:
    await Tests.filter(id=test_id).update(title=data['title'], image=data['image'], data=data)


async def delete_test_by_id(test_id: int) -> bool:
    test = await Tests.get_or_none(id=test_id)
    if test:
        await test.delete()
        return True
    return False


async def get_all_tests() -> list:
    all_tests = await Tests.all().values('id', 'title', 'image')
    return all_tests


async def get_test_by_id(test_id: int) -> Tests | None:
    return await Tests.get_or_none(id=test_id)


async def get_edit_key_by_test_id(test_id: int) -> uuid.UUID | None:
    try:
        return uuid.UUID((await Tests.get_or_none(id=test_id).values('edit_key'))['edit_key'])
    except ValueError:
        return None
