import os

from flask import Flask, render_template, request, jsonify
import asyncio
import db_service as db

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
def get_test_runner_page():
    return render_template('test-creator.html')


@app.post('/create-test')
async def create_test():
    data = request.get_json()
    try:
        test_json = await db.create_new_test(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify({'id': test_json['id']}), 200


@app.route('/tests', methods=['GET'])
async def get_tests():
    all_tests = await db.get_all_tests()
    return jsonify([
        {"id": t["id"], "title": t["title"], "image": t["image"]}
        for t in all_tests
    ])


@app.route('/tests/<int:test_id>', methods=['GET'])
async def get_test(test_id):
    test = await db.get_test_by_id(test_id)
    if not test:
        return jsonify({"error": "Тест не найден"}), 404
    return test.data


if __name__ == '__main__':
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(db.init_tortoise())
    host = os.getenv('FLASK_RUN_HOST', '127.0.0.1')
    app.run(debug=False, use_reloader=False, host=host)
