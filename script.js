document.getElementById('equationForm').addEventListener('submit',function(e){
    e.preventDefault();
    console.log('submitted:', document.getElementById('equationInput').value);
});