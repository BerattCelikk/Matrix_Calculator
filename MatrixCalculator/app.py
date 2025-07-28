from flask import Flask, render_template, request, jsonify
import numpy as np
import logging
import os

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

class MatrixOperations:
    @staticmethod
    def diagonal_and_trace(matrix):
        diagonal = [matrix[i][i] for i in range(len(matrix))]
        trace = sum(diagonal)
        return {"diagonal": diagonal, "trace": trace}
    
    @staticmethod
    def is_idempotent(matrix):
        matrix_sq = np.dot(matrix, matrix)
        return np.array_equal(matrix_sq, matrix)
    
    @staticmethod
    def is_nilpotent(matrix, power=2):
        matrix_pow = np.linalg.matrix_power(matrix, power)
        return np.all(matrix_pow == 0)
    
    @staticmethod
    def is_involutive(matrix):
        matrix_sq = np.dot(matrix, matrix)
        identity = np.identity(len(matrix))
        return np.array_equal(matrix_sq, identity)
    
    @staticmethod
    def check_symmetry(matrix):
        transpose = np.transpose(matrix)
        symmetric = np.array_equal(matrix, transpose)
        antisymmetric = np.array_equal(matrix, -transpose)
        return {"symmetric": symmetric, "antisymmetric": antisymmetric}
    
    @staticmethod
    def is_orthogonal(matrix):
        transpose = np.transpose(matrix)
        product = np.dot(matrix, transpose)
        identity = np.identity(len(matrix))
        return np.allclose(product, identity)
    
    @staticmethod
    def is_periodic(matrix, period=2):
        matrix_pow = np.linalg.matrix_power(matrix, period + 1)
        return np.array_equal(matrix_pow, matrix)
    
    @staticmethod
    def format_result(result):
        if isinstance(result, (np.ndarray, list)):
            return {"type": "matrix", "data": result.tolist() if hasattr(result, 'tolist') else result}
        elif isinstance(result, dict):
            return {"type": "dict", "data": result}
        else:
            return {"type": "string", "data": str(result)}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        n = int(data['size'])
        operation = data['operation']
        matrices_data = data['matrices']
        
        matrices = []
        for matrix_data in matrices_data:
            matrix = []
            for i in range(n):
                row = []
                for j in range(n):
                    row.append(float(matrix_data[i][j]))
                matrix.append(row)
            matrices.append(np.array(matrix))
        
        ops = MatrixOperations()
        result = None
        
        if operation == '+':
            result = matrices[0] + matrices[1]
        elif operation == '-':
            result = matrices[0] - matrices[1]
        elif operation == '*':
            result = np.dot(matrices[0], matrices[1])
        elif operation == 'd':
            selected = int(data.get('selected_matrix', 0))
            result = ops.diagonal_and_trace(matrices[selected])
        elif operation == 'i':
            selected = int(data.get('selected_matrix', 0))
            result = ops.is_idempotent(matrices[selected])
        elif operation == 'n':
            selected = int(data.get('selected_matrix', 0))
            power = int(data.get('power', 2))
            result = ops.is_nilpotent(matrices[selected], power)
        elif operation == 'v':
            selected = int(data.get('selected_matrix', 0))
            result = ops.is_involutive(matrices[selected])
        elif operation == 's':
            selected = int(data.get('selected_matrix', 0))
            result = ops.check_symmetry(matrices[selected])
        elif operation == 'o':
            selected = int(data.get('selected_matrix', 0))
            result = ops.is_orthogonal(matrices[selected])
        elif operation == 'p':
            selected = int(data.get('selected_matrix', 0))
            period = int(data.get('period', 2))
            result = ops.is_periodic(matrices[selected], period)
        
        return jsonify({
            "success": True,
            "result": ops.format_result(result)
        })
        
    except Exception as e:
        app.logger.error(f"Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)