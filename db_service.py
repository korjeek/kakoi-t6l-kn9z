from flask import request, jsonify
from tortoise import Tortoise, fields
from models import Tests


# Initialize Tortoise ORM properly
async def init_tortoise():
    await Tortoise.init(
        db_url="sqlite://db.sqlite3",
        modules={"models": ["models"]}
    )
    await Tortoise.generate_schemas()
    test = await Tests(name='Kakoi ti smesharik', data=
    {
        "id": 1,
        "name": "Какой ты князь?",
        "questions": [
            {
                "id": 1,
                "text": "Как ты решаешь конфликты?",
                "answers": [
                    {"text": "Переговорами"},
                    {"text": "Силой"}
                ]
            },
            {
                "id": 2,
                "text": "Как ты управляешь?",
                "answers": [
                    {"text": "По законам"},
                    {"text": "Правила меня не касаются"}
                ]
            }
        ]
    })
    await test.save()


async def create_new_test():
    data = request.get_json()
    new_test = await Tests.create(name=data['name'], data=data['data'])

    return jsonify({"id": new_test.id, "name": new_test.name, "data": new_test.data})


async def delete_test_by_id():
    data = request.get_json()
    test = await Tests.get_or_none(id=data['id'])
    if test:
        await test.delete()
        return jsonify({"message": f"Test {test.name} deleted"})
    return jsonify({"error": "Test not found"}), 404


async def get_all_tests():
    all_tests = await Tests.all().values("id", "name")
    return all_tests


async def get_test_by_id(test_id):
    return await Tests.get_or_none(id=test_id)
