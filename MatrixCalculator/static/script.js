document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sizeInput = document.getElementById('size');
    const matrix1Container = document.getElementById('matrix1-container');
    const matrix2Container = document.getElementById('matrix2-container');
    const operationSelect = document.getElementById('operation');
    const additionalParams = document.getElementById('additional-params');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultSection = document.getElementById('result-section');
    const resultContent = document.getElementById('result-content');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const copyBtn = document.getElementById('copy-result');
    const navbarToggler = document.getElementById('navbar-toggler');
    const navbarLinks = document.querySelector('.navbar-links');
    const contactForm = document.querySelector('.contact-form');

    // Initialize matrices
    createMatrixInputs(parseInt(sizeInput.value));

    // Event listeners
    sizeInput.addEventListener('change', function() {
        createMatrixInputs(parseInt(this.value));
    });

    operationSelect.addEventListener('change', updateAdditionalParams);
    calculateBtn.addEventListener('click', calculate);
    copyBtn.addEventListener('click', copyResult);
    navbarToggler.addEventListener('click', toggleNavbar);
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                navbarLinks.classList.remove('show');
                
                // Scroll to target
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without jumping
                history.pushState(null, null, targetId);
            }
        });
    });

    // Create matrix inputs dynamically
    function createMatrixInputs(size) {
        // Clear existing inputs
        matrix1Container.innerHTML = '';
        matrix2Container.innerHTML = '';
        
        // Set grid class based on size
        matrix1Container.className = `matrix-grid size-${size}`;
        matrix2Container.className = `matrix-grid size-${size}`;
        
        // Create inputs for Matrix A
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                createMatrixCell(matrix1Container, i, j, '1');
            }
        }
        
        // Create inputs for Matrix B
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                createMatrixCell(matrix2Container, i, j, '2');
            }
        }
        
        updateAdditionalParams();
    }

    function createMatrixCell(container, i, j, matrixNum) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'matrix-cell';
        input.name = `matrix${matrixNum}_${i}_${j}`;
        input.placeholder = '0';
        input.value = (i === j) ? '1' : '0'; // Default to identity matrix
        container.appendChild(input);
    }

    function updateAdditionalParams() {
        const op = operationSelect.value;
        let html = '';
        
        if (['d', 'i', 'n', 'v', 's', 'o'].includes(op)) {
            html = `
                <div class="form-group">
                    <label><i class="fas fa-th"></i> Select Matrix:</label>
                    <select name="selected_matrix" class="full-width">
                        <option value="0">Matrix A</option>
                        <option value="1">Matrix B</option>
                    </select>
                </div>
            `;
        }
        
        if (op === 'p') {
            html = `
                <div class="form-group">
                    <label><i class="fas fa-clock"></i> Period:</label>
                    <input type="number" name="period" min="1" value="2" required class="full-width">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-th"></i> Select Matrix:</label>
                    <select name="selected_matrix" class="full-width">
                        <option value="0">Matrix A</option>
                        <option value="1">Matrix B</option>
                    </select>
                </div>
            `;
        } else if (op === 'n') {
            html = `
                <div class="form-group">
                    <label><i class="fas fa-bolt"></i> Power:</label>
                    <input type="number" name="power" min="1" value="2" required class="full-width">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-th"></i> Select Matrix:</label>
                    <select name="selected_matrix" class="full-width">
                        <option value="0">Matrix A</option>
                        <option value="1">Matrix B</option>
                    </select>
                </div>
            `;
        }
        
        additionalParams.innerHTML = html;
    }

    function calculate() {
        const size = parseInt(sizeInput.value);
        const operation = operationSelect.value;
        
        // Get matrix values
        const matrices = [];
        for (let m = 0; m < 2; m++) {
            const matrix = [];
            for (let i = 0; i < size; i++) {
                const row = [];
                for (let j = 0; j < size; j++) {
                    const value = document.querySelector(`input[name="matrix${m+1}_${i}_${j}"]`).value;
                    row.push(value);
                }
                matrix.push(row);
            }
            matrices.push(matrix);
        }
        
        // Get additional params
        const params = {
            size: size,
            operation: operation,
            matrices: matrices
        };
        
        const selectedMatrix = additionalParams.querySelector('select[name="selected_matrix"]');
        if (selectedMatrix) {
            params.selected_matrix = selectedMatrix.value;
        }
        
        const periodInput = additionalParams.querySelector('input[name="period"]');
        if (periodInput) {
            params.period = periodInput.value;
        }
        
        const powerInput = additionalParams.querySelector('input[name="power"]');
        if (powerInput) {
            params.power = powerInput.value;
        }
        
        // Hide previous results/errors
        resultSection.classList.add('hidden');
        errorMessage.classList.add('hidden');
        
        // Show loading state
        calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
        calculateBtn.disabled = true;
        
        // Send request to server
        fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayResult(data.result);
            } else {
                showError(data.error);
            }
        })
        .catch(error => {
            showError('An error occurred while calculating. Please try again.');
            console.error('Error:', error);
        })
        .finally(() => {
            calculateBtn.innerHTML = '<i class="fas fa-calculator"></i> Calculate';
            calculateBtn.disabled = false;
        });
    }

    function displayResult(result) {
        let resultHtml = '';
        
        if (result.type === 'matrix') {
            resultHtml = '<table class="result-table">';
            result.data.forEach(row => {
                resultHtml += '<tr>';
                row.forEach(cell => {
                    resultHtml += `<td>${cell}</td>`;
                });
                resultHtml += '</tr>';
            });
            resultHtml += '</table>';
        } else if (result.type === 'dict') {
            resultHtml = '<ul class="result-list">';
            for (const [key, value] of Object.entries(result.data)) {
                resultHtml += `<li><strong>${key}:</strong> ${formatValue(value)}</li>`;
            }
            resultHtml += '</ul>';
        } else {
            resultHtml = `<div class="result-text">${result.data}</div>`;
        }
        
        resultContent.innerHTML = resultHtml;
        resultSection.classList.remove('hidden');
        
        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function formatValue(value) {
        if (Array.isArray(value)) {
            return `[${value.join(', ')}]`;
        } else if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        return value;
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        
        // Scroll to error message
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function copyResult() {
        const textToCopy = resultContent.textContent;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                showError('Failed to copy result');
                console.error('Failed to copy: ', err);
            });
    }

    function toggleNavbar() {
        navbarLinks.classList.toggle('show');
    }

    function handleContactSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
        };
        
        // Here you would typically send the form data to a server
        // For this example, we'll just show a success message
        alert(`Thank you for your message, ${formData.name}! I'll get back to you soon at ${formData.email}.`);
        
        // Reset form
        e.target.reset();
    }
});