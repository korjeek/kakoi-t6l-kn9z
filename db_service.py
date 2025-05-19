from flask import jsonify, json
from tortoise import Tortoise
from models import Tests


# Initialize Tortoise ORM properly
async def init_tortoise():
    await Tortoise.init(
        db_url="sqlite://db.sqlite3",
        modules={"models": ["models"]}
    )
    await Tortoise.generate_schemas()

    test_file = open('hardcode_tests/knyaz_test.json', encoding="utf-8")
    json_data = json.load(test_file)
    initial_test = await Tests(title=json_data['title'], image=json_data['image'], data=json_data)
    await initial_test.save()


async def create_new_test(data):
    new_test = await Tests.create(title=data['title'], image=data['image'], data=data)
    return {"id": new_test.id, "title": new_test.title, "data": new_test.data}


async def delete_test_by_id():
    data = request.get_json()  # Мне кажется это не будет работать
    test = await Tests.get_or_none(id=data['id'])
    if test:
        await test.delete()
        return jsonify({"message": f"Test {test.name} deleted"})
    return jsonify({"error": "Test not found"}), 404


async def get_all_tests():
    all_tests = await Tests.all().values("id", "title", "image")
    return all_tests


async def get_test_by_id(test_id):
    return await Tests.get_or_none(id=test_id)
