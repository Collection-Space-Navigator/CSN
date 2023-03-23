from flask import Flask, render_template,send_from_directory

app = Flask(__name__, static_folder='build/static',template_folder='build/')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/<path:path>')
def send_report(path):
  # remove the replace in next to lines later later <-- important !!!!!!!!
  print("files_report:",path)
  if path=="manifest.json":
      path="manifest.json"
  return send_from_directory('build/', str(path))

@app.route('/static/<path:path>')
def send_report2(path):
  # remove the replace in next to lines later later <-- important !!!!!!!!
  print("files_report2:",path)
  return send_from_directory('build/static/', str(path))

@app.route('/datasets/<path:path>')
def send_report3(path):
  # remove the replace in next to lines later later <-- important !!!!!!!!
  print("files_report3:",path)
  return send_from_directory('build/datasets/', str(path))

if __name__ == "__main__":
  #app.run(debug=False, port=port)
  app.run(debug=False, port=8001)