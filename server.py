from flask import Flask, render_template, request

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


if __name__ == '__main__':
    app.run(debug=True)
