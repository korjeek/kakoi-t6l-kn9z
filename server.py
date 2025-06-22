import os

from flask import Flask, render_template, request, jsonify
from edit_key_service import check_request
import asyncio
import db_service as db
import uuid

app = Flask(__name__)


@app.route('/', methods=['GET'])
@app.route('/index', methods=['GET'])
def main_page():
    return render_template('index.html')


@app.get('/test-runner')
def get_create_test_page():
    test_id = request.args.get('testId')
    return render_template('test-runner.html', test_id=test_id)


@app.route('/test-creator')
def get_test_creator_page():
    return render_template('test-creator.html', scriptName='creator.js', buttonMode='true')


@app.route('/test-editor')
def get_test_editor_page():
    return render_template('test-creator.html', scriptName='editor.js', buttonMode='none')


@app.get('/get-test-to-edit')
async def get_test_to_edit():
    check_dict = await check_request(request)
    if not check_dict['pass']:
        return jsonify({'error': check_dict['error']})

    test_id = check_dict['test_id']
    return (await db.get_test_by_id(test_id)).data


@app.post('/edit-test')
async def edit_test():
    check_dict = await check_request(request)
    if not check_dict['pass']:
        return jsonify({'error': check_dict['error']})

    test_id = check_dict['test_id']
    data = request.get_json()
    try:
        await db.edit_test_by_id(test_id, data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify({'id': test_id}), 200


@app.post('/create-test')
async def create_test():
    data = request.get_json()
    try:
        new_test = await db.create_new_test(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify({'id': new_test.id, 'edit_key': f'{new_test.edit_key}'}), 200


@app.route('/tests', methods=['GET'])
async def get_tests():
    all_tests = await db.get_all_tests()
    return jsonify([
        {"id": t["id"], "title": t["title"], "image": t["image"]}
        for t in all_tests
    ])


@app.route('/tests/<int:test_id>', methods=['GET'])
async def get_test(test_id: int):
    test = await db.get_test_by_id(test_id)
    if not test:
        return jsonify({"error": "Тест не найден"}), 404
    return test.data


if __name__ == '__main__':
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(db.init_tortoise())
    host = os.getenv('FLASK_RUN_HOST', '127.0.0.1')
    app.run(debug=True, use_reloader=True, host=host)
