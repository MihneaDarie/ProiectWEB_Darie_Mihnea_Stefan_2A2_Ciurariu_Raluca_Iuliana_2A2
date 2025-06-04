document.addEventListener('DOMContentLoaded', function() {
    const inputType = document.getElementById('inputType');
    const numericalControls = document.querySelector('.numerical-controls');
    const generateBtn = document.getElementById('generateBtn');
    const outputField = document.getElementById('outputField');
    const outputArea = document.querySelector('.output-area');

    inputType.addEventListener('change', function() {
        numericalControls.style.display = this.value === 'numerical' ? 'block' : 'none';
        outputArea.innerHTML = ''; 
    });

    generateBtn.addEventListener('click', function() {
        const min = parseInt(document.getElementById('minValue').value);
        const max = parseInt(document.getElementById('maxValue').value);
        const length = parseInt(document.getElementById('arrayLength').value);
        const sortOrder = document.getElementById('sortOrder').value;

        if (isNaN(min) || isNaN(max) || isNaN(length) || length < 1) {
            alert('Please fill in all fields correctly');
            return;
        }

        let array = [];
        for (let i = 0; i < length; i++) {
            array.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }

        if (sortOrder === 'asc') {
            array.sort((a, b) => a - b);
        } else if (sortOrder === 'desc') {
            array.sort((a, b) => b - a);
        }

        fetch('/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/backend/api.php?page=generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                minValue: min,
                maxValue: max,
                arrayLength: length,
                sortOrder: sortOrder,
                array: array
            }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            outputArea.innerHTML = `
                <div style="padding: 20px;">
                    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px;">
                        [${array.join(', ')}]
                    </div>
                </div>
            `;
        })
        .catch(error => {
            outputArea.innerHTML = `
                <div style="color: red; padding: 15px;">
                    Error: ${error.message}
                </div>
            `;
        });
    });
});