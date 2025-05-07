from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


@app.route('/', methods=['GET'])
def main_page():
    return render_template('main-page.html')


@app.get('/create-test.html')
def get_create_test_page():
    return render_template('create-test.html')


@app.post('/create-test.html')
def create_test():
    print(request.form)
    return render_template('create-test.html')


tests = [
    {
        "id": 1,
        "title": "Какой ты князь?",
        "description": "Узнай какой ты князь",
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
    }
]


@app.route('/tests', methods=['GET'])
def get_tests():
    return jsonify([
        {"id": t["id"], "title": t["title"], "description": t["description"]}
        for t in tests
    ])

@app.route('/tests/<int:test_id>', methods=['GET'])
def get_test(test_id):
    test = next((t for t in tests if t["id"] == test_id), None)
    if not test:
        return jsonify({"error": "Тест не найден"}), 404
    return jsonify({
        "id": test["id"],
        "title": test["title"],
        "description": test["description"]
    })

@app.route('/tests/<int:test_id>/questions', methods=['GET'])
def get_questions(test_id):
    test = next((t for t in tests if t["id"] == test_id), None)
    if not test:
        return jsonify({"error": "Тест не найден"}), 404
    return jsonify(test["questions"])


if __name__ == '__main__':
    app.run(debug=True)
