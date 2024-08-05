# app.py
from flask import Flask, render_template, jsonify, request
import json
from sudoku.generator import generate_sudoku
from sudoku.solver import solve_sudoku

app = Flask(__name__)

game_data = {
    'attempts': 0,
    'wins': 0,
    'losses': 0,
    'current_puzzle': None
}

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/game')
def game():
    game_data['current_puzzle'] = generate_sudoku()
    return render_template('game.html', puzzle=game_data['current_puzzle'])

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/check_solution', methods=['POST'])
def check_solution():
    data = request.json
    user_solution = data['solution']
    puzzle = game_data['current_puzzle']
    solve_sudoku(puzzle)
    if user_solution == puzzle:
        game_data['wins'] += 1
        return jsonify({'result': 'win'})
    else:
        game_data['losses'] += 1
        return jsonify({'result': 'loss', 'correct_solution': puzzle})

@app.route('/stats')
def stats():
    return jsonify(game_data)

if __name__ == '__main__':
    app.run(debug=True)
