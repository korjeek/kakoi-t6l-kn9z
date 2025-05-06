from flask import Flask, render_template

app = Flask(__name__)


@app.route('/', methods=['GET'])
def main_page():
    return render_template('main-page.html')


@app.route('/scripts/<filename>', methods=['GET'])
def get_script(filename):
    return render_template()


if __name__ == '__main__':
    app.run(debug=True)
